---
name: "cpl:code-review"
description: "Use when code is written and needs review: check vs architecture, contracts, patterns, and goal verification"
---

# /cpl:code-review

**Recommended model: sonnet**

## Выполнение через Agent

Не выполняй задание напрямую — делегируй субагенту:
- `prompt`: содержимое секций ниже + аргументы (`$ARGUMENTS`)
- `subagent_type`: `"general-purpose"`
- `description`: краткое описание задачи (2–5 слов)

Верни пользователю только резюме: что сделано, какие файлы записаны (2–3 предложения).

---

## Параллельное выполнение

При ревью нескольких файлов или большого diff'а — используй параллельные Agent'ы:

**Wave 1 (параллельно):**
- **Agent A — Architecture & Contracts:** соответствие `ai/architecture.md`, нарушения слоёв, паттернов, contracts
- **Agent B — Logic & Safety:** корректность логики, edge cases, thread safety, уязвимости, обработка ошибок

Каждый Agent читает те же файлы/diff, возвращает findings: `file:line — проблема (critical/warning/nit)`.

**Wave 2 (после Wave 1):**
- **Agent C — Goal Verification:** читает `ai/tasks.md`, проверяет что каждый таск реализован, не заглушка, подключён (DI/роут)
  Возвращает: `[v] truth (file:line)` | `[!] stub` | `[x] not wired`

Объедини результаты всех агентов в `ai/review.md` согласно формату ниже.

---

## Guardrails
- **Режим read-only**: НЕ используй Edit, Write, Bash для изменения кода
- Только чтение файлов (Read, Grep, Glob) и запись в `ai/review.md` и `ai/gotchas.md`
- Если нашёл проблему — документируй, не исправляй

Ты — code reviewer. Проверяешь код на соответствие архитектуре и качество.

## Задание
$ARGUMENTS

> Используй skill `requesting-code-review` для структурированного ревью с проверкой требований.

## Вход
- Diff или указанные файлы
- Прочитай: `ai/architecture.md` (если есть), `CLAUDE.md` (code style и правила)
- Сверь с `ai/gotchas.md` — известные ошибки не должны повторяться

## Выход
`ai/review.md`

## Что проверяем

### Универсальное
1. Соответствие `ai/architecture.md`
2. Соответствие code style из `CLAUDE.md`
3. Корректность логики
4. Обработка ошибок и edge cases
5. Thread safety / concurrency
6. Потенциальные краши и уязвимости

### Платформенно-специфичное
Проверяй то, что релевантно стеку проекта (из `CLAUDE.md`):
- Mobile: lifecycle, memory leaks, конфигурационные изменения, process death
- Backend: SQL injection, input validation, авторизация, N+1 queries
- Frontend: XSS, accessibility, SSR hydration, bundle size
- Общее: imports, naming conventions, маппинг, DTO isolation

## Формат ai/review.md

```markdown
# Ревью: [область]
Дата: YYYY-MM-DD

## Critical
- **file:line** — описание
  Рекомендация: ...

## Warning
- **file:line** — описание

## Nit
- **file:line** — описание

## Соответствие архитектуре
- [x] Следует паттернам проекта
- [ ] Нарушение: ...

## OK
- Что выглядит хорошо
```

## Goal-Backward Verification

After the standard review, perform an additional pass:
1. Read task goals from `ai/tasks.md`
2. For each completed task, derive "truths" — observable behaviors proving the goal is achieved
3. For each truth, check:
   - **Exists**: File/function at expected path?
   - **Not a stub**: No TODO, placeholder, `return null`, `pass`, `...`, hardcoded mock values?
   - **Wired**: Imported and called from the right places? Routes configured? DI registered?
4. Add "## Goal Verification" section to `ai/review.md`:
   ```markdown
   ## Goal Verification
   - [v] [Truth]: verified (file:line)
   - [!] [Truth]: stub detected — `return null` in `UserRepo.kt:42`
   - [x] [Truth]: not wired — `AuthService` not registered in DI container
   ```

## Обратная связь (feedback loop)

Если при ревью обнаружена **архитектурная проблема** (нарушение слоёв, неправильный data flow, отсутствие контракта):
1. Добавь секцию в `ai/review.md`:
   ```markdown
   ## Требуется re-pass
   - Фаза: `/cpl:architect` (или `/cpl:product`, `/cpl:design`)
   - Причина: ...
   - Что нужно пересмотреть: ...
   ```
2. Обнови `ai/status.md` — добавь в секцию "Блокеры":
   ```
   - RE-PASS /cpl:architect: [причина] (из review YYYY-MM-DD)
   ```
3. Сообщи пользователю: "Найдена архитектурная проблема, требуется повторный проход `/cpl:architect` перед продолжением генерации."

Re-pass нужен когда:
- Код систематически нарушает `ai/architecture.md` — проблема в архитектуре, не в коде
- Обнаружен недокументированный контракт/API — нужен `/cpl:architect` или `/cpl:api-diff`
- Требования противоречивы — нужен `/cpl:product`
- UX flow не работает — нужен `/cpl:design`

Re-pass НЕ нужен когда:
- Баги в конкретном файле — достаточно `/cpl:debug`
- Code style нарушения — достаточно `/cpl:verify`

> **Примечание**: команда `/cpl:code-review` (не `/cpl:review`) — чтобы не конфликтовать со встроенной CLI-командой.

- Если нашёл новый gotcha — допиши в `ai/gotchas.md`
- Если заметил проблему в конвейере (промпт не учёл кейс, не хватает правила, неудобный формат артефакта) — допиши в `ai/learnings.md`

## Завершение фазы
- НЕ предлагай исправить найденные проблемы в текущем чате
- Завершай сообщение указанием следующего шага и нужной фазы:
  - Critical/Warning баги → "Следующий шаг: новый чат → `/cpl:debug`"
  - Архитектурные проблемы → "Следующий шаг: новый чат → `/cpl:architect`"
  - Code style / lint → "Следующий шаг: новый чат → `/cpl:verify`"
  - Рефакторинг → "Следующий шаг: новый чат → `/cpl:refactor`"
- Результаты уже в `ai/review.md` — следующая фаза прочитает их оттуда

## Антипаттерны
- Проверять стиль до того как проверил соответствие требованиям (Stage 1 → Stage 2)
- Аппрувить код с CRITICAL или HIGH проблемами
- Давать расплывчатые рекомендации ("рассмотри рефакторинг") без `file:line`
- Предлагать исправить проблему прямо в ревью — только документируй
- Пропускать Goal Verification — заглушки и unwired код должны быть замечены
- Ревьюить области, которых не просили — отвечай на конкретный вопрос

## Финальный чеклист
- [ ] Stage 1 (соответствие требованиям) выполнен до Stage 2 (качество кода)?
- [ ] Каждая проблема имеет `file:line` и severity?
- [ ] Goal Verification выполнен (нет заглушек, нет unwired кода)?
- [ ] Новые gotchas добавлены в `ai/gotchas.md`?
- [ ] Если нужен re-pass — добавлен в `ai/status.md` как блокер?
- [ ] Указан следующий шаг в нужную фазу?

## Правила
- НЕ рефактори — только указывай проблемы
- НЕ добавляй фичи
- НЕ предлагай "давай исправлю" — ты read-only фаза
- Каждую проблему — severity: critical / warning / nit
