#!/usr/bin/env node
"use strict";

/**
 * CPL Autopilot — Stop hook
 *
 * Intercepts Claude Code Stop events and blocks stopping while
 * ai/autopilot.md contains "Статус: running". Outputs:
 *   {"decision":"block","reason":"..."}  — keep going
 *   {"continue":true,"suppressOutput":true} — allow stop
 */

const fs = require("fs");
const path = require("path");

async function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    const timer = setTimeout(() => resolve(""), 3000);
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => { clearTimeout(timer); resolve(Buffer.concat(chunks).toString()); });
  });
}

async function main() {
  await readStdin();

  const cwd = process.cwd();
  const autopilotPath = path.join(cwd, "ai", "autopilot.md");

  const allow = JSON.stringify({ continue: true, suppressOutput: true });

  if (!fs.existsSync(autopilotPath)) {
    process.stdout.write(allow);
    return;
  }

  const content = fs.readFileSync(autopilotPath, "utf-8");

  if (!content.includes("Статус: running")) {
    process.stdout.write(allow);
    return;
  }

  // Count completed iterations from log entries
  const iterCount = (content.match(/^### Итерация \d+/gm) || []).length;
  const MAX_ITER = 10;

  if (iterCount >= MAX_ITER) {
    process.stdout.write(allow);
    return;
  }

  const goalMatch = content.match(/^Цель:\s*(.+)/m);
  const goal = goalMatch ? goalMatch[1].trim() : "";

  const finishMatch = content.match(/^Финиш:\s*(.+)/m);
  const finish = finishMatch ? finishMatch[1].trim() : "code-review";

  const resultMatches = [...content.matchAll(/^- Результат:\s*(.+)/gm)];
  const lastResult = resultMatches.length > 0
    ? resultMatches[resultMatches.length - 1][1].trim()
    : "—";

  const reason = [
    `[CPL AUTOPILOT — Итерация ${iterCount + 1}/${MAX_ITER}]`,
    `Цель: "${goal}" | Финиш: ${finish}`,
    `Последний результат: ${lastResult}`,
    "",
    "Автопилот активен. Продолжай конвейер:",
    "1. Прочитай ai/autopilot.md — определи следующую фазу по цепочке и логу",
    "2. Выполни фазу (Codex или Claude Agent согласно таблице маршрутизации в SKILL.md)",
    "3. Добавь запись ### Итерация N в раздел ## Лог",
    "4. Проверь условия остановки: Level 3 deviation → PAUSE, двойной FAIL → STOP, финальная фаза ОК → DONE",
    "5. Если конвейер завершён — замени Статус: running → Статус: done в ai/autopilot.md",
  ].join("\n");

  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
});
