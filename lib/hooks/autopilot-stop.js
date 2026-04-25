#!/usr/bin/env node
"use strict";

/**
 * CPL Autopilot — Stop hook
 *
 * Blocks Claude Code Stop events while ai/autopilot.md has:
 *   - Статус: running
 *   - at least one unchecked criterion: - [ ]
 *
 * Termination is goal-based: the loop runs until all criteria are [x],
 * not until an iteration count is reached. HARD_MAX (30) is a failsafe
 * against infinite loops only — the SKILL manages its own iteration limit.
 *
 * Outputs:
 *   {"decision":"block","reason":"..."}       — keep going
 *   {"continue":true,"suppressOutput":true}   — allow stop
 */

const fs = require("fs");
const path = require("path");

const HARD_MAX = 30;

async function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    const timer = setTimeout(() => resolve(""), 3000);
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => { clearTimeout(timer); resolve(Buffer.concat(chunks).toString()); });
  });
}

function findAutopilotMd(cwd) {
  const direct = path.join(cwd, "ai", "autopilot.md");
  if (fs.existsSync(direct)) return direct;
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
  return /Статус\s*:\s*running/i.test(content);
}

function countIterations(content) {
  const logEntries = (content.match(/^#{1,4}\s*Итерация\s+\d+/gim) || []).length;
  const headerMatch = content.match(/^Итерация\s*:\s*(\d+)/im);
  return Math.max(logEntries, headerMatch ? parseInt(headerMatch[1], 10) : 0);
}

function getCriteria(content) {
  const unchecked = content.match(/^- \[ \] .+/gm) || [];
  const checked = content.match(/^- \[x\] .+/gim) || [];
  return { unchecked, checked, total: unchecked.length + checked.length };
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

  // Failsafe: allow stop if hard max iterations reached
  const iterCount = countIterations(content);
  if (iterCount >= HARD_MAX) {
    process.stdout.write(allow);
    return;
  }

  const { unchecked, checked, total } = getCriteria(content);

  // Goal reached: all criteria checked (or no criteria defined — allow stop)
  if (total > 0 && unchecked.length === 0) {
    process.stdout.write(allow);
    return;
  }

  // No criteria defined yet — block and ask to define them
  const goalMatch = content.match(/^Цель\s*:\s*(.+)/im);
  const goal = goalMatch ? goalMatch[1].trim() : "";

  const finishMatch = content.match(/^Финиш\s*:\s*(.+)/im);
  const finish = finishMatch ? finishMatch[1].trim() : "code-review";

  let progressLine = total > 0
    ? `Прогресс: ${checked.length}/${total} критериев выполнено`
    : "Критерии не определены — добавь ## Критерии достижения цели в ai/autopilot.md";

  let remainingBlock = "";
  if (unchecked.length > 0) {
    remainingBlock = "\nОставшиеся критерии:\n" + unchecked.map(l => "  " + l).join("\n");
  }

  const reason = [
    `[CPL AUTOPILOT | Финиш: ${finish} | Итерация ${iterCount + 1}]`,
    `Цель: "${goal}"`,
    progressLine,
    remainingBlock,
    "",
    "Цель ещё не достигнута. Продолжай конвейер:",
    "1. Прочитай ai/autopilot.md — определи следующий шаг по оставшимся критериям",
    "2. Выполни работу (Codex или Claude Agent)",
    "3. Обнови чекбоксы критериев по реальному состоянию кода",
    "4. Добавь запись ### Итерация N в ## Лог",
    "5. Только когда ВСЕ критерии [x] — установи Статус: done",
  ].join("\n");

  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
});
