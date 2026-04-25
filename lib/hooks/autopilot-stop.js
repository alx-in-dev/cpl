#!/usr/bin/env node
"use strict";

/**
 * CPL Autopilot — Stop hook
 *
 * Intercepts Claude Code Stop events and blocks stopping while
 * ai/autopilot.md contains "Статус: running".
 *
 * Design: this hook is a SAFETY NET only — it prevents accidental stops.
 * The iteration limit (10) is enforced by the SKILL itself, which sets
 * Статус: stopped when the limit is reached. The hook's HARD_MAX (30) is
 * a failsafe against infinite loops if the SKILL forgets to update status.
 *
 * Outputs:
 *   {"decision":"block","reason":"..."}  — keep going
 *   {"continue":true,"suppressOutput":true} — allow stop
 */

const fs = require("fs");
const path = require("path");

const HARD_MAX = 30; // failsafe only — SKILL enforces its own 10-iter limit

async function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    const timer = setTimeout(() => resolve(""), 3000);
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => { clearTimeout(timer); resolve(Buffer.concat(chunks).toString()); });
  });
}

function findAutopilotMd(cwd) {
  // Check cwd/ai/autopilot.md (may be a symlink)
  const direct = path.join(cwd, "ai", "autopilot.md");
  if (fs.existsSync(direct)) return direct;

  // Check if ai/ is a symlink and resolve it
  const aiDir = path.join(cwd, "ai");
  if (fs.existsSync(aiDir)) {
    try {
      const real = fs.realpathSync(aiDir);
      const resolved = path.join(real, "autopilot.md");
      if (fs.existsSync(resolved)) return resolved;
    } catch {}
  }

  return null;
}

function isRunning(content) {
  // Accept "Статус: running" in various markdown forms
  return /Статус\s*:\s*running/i.test(content);
}

function countIterations(content) {
  // Count both "### Итерация N" log entries and any header "Итерация: N"
  const logEntries = (content.match(/^#{1,4}\s*Итерация\s+\d+/gim) || []).length;
  const headerMatch = content.match(/^Итерация\s*:\s*(\d+)/im);
  const headerVal = headerMatch ? parseInt(headerMatch[1], 10) : 0;
  return Math.max(logEntries, headerVal);
}

async function main() {
  await readStdin();

  const allow = JSON.stringify({ continue: true, suppressOutput: true });

  const autopilotPath = findAutopilotMd(process.cwd());
  if (!autopilotPath) {
    process.stdout.write(allow);
    return;
  }

  const content = fs.readFileSync(autopilotPath, "utf-8");

  if (!isRunning(content)) {
    process.stdout.write(allow);
    return;
  }

  const iterCount = countIterations(content);

  if (iterCount >= HARD_MAX) {
    process.stdout.write(allow);
    return;
  }

  const goalMatch = content.match(/^Цель\s*:\s*(.+)/im);
  const goal = goalMatch ? goalMatch[1].trim() : "";

  const finishMatch = content.match(/^Финиш\s*:\s*(.+)/im);
  const finish = finishMatch ? finishMatch[1].trim() : "code-review";

  const resultMatches = [...content.matchAll(/^[-–]\s*Результат\s*:\s*(.+)/gim)];
  const lastResult = resultMatches.length > 0
    ? resultMatches[resultMatches.length - 1][1].trim()
    : "—";

  const reason = [
    `[CPL AUTOPILOT — Итерация ${iterCount + 1} | Финиш: ${finish}]`,
    `Цель: "${goal}"`,
    `Последний результат: ${lastResult}`,
    "",
    "Автопилот активен — не останавливайся. Продолжай конвейер:",
    "1. Прочитай ai/autopilot.md — определи следующую фазу",
    "2. Выполни фазу (Codex или Claude Agent)",
    "3. Добавь запись ### Итерация N в ## Лог",
    "4. Проверь условия остановки из SKILL.md",
    "5. Только если конвейер завершён — замени Статус: running → done/stopped/paused",
  ].join("\n");

  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
});
