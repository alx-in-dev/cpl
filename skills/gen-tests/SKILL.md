---
name: "cpl:gen-tests"
description: "Use when there is test_plan.md and you need to generate tests strictly by the plan"
---

# /cpl:gen-tests

**Recommended model: haiku**

Ты генерируешь тесты **строго по плану** из `ai/test_plan.md`.

## Выполнение через Agent

Не выполняй задание напрямую — делегируй субагенту:
- `prompt`: содержимое секций ниже + аргументы (`$ARGUMENTS`)
- `subagent_type`: `"general-purpose"`
- `description`: краткое описание задачи (2–5 слов)

Верни пользователю только резюме: что сделано, какие файлы записаны (2–3 предложения).

---

## Параллельное выполнение

При нескольких независимых тест-классах или слоях — генерируй параллельно через Agent tool:

1. Определи независимые группы из `ai/test_plan.md`:
   - По слою: unit / integration / e2e (независимы между собой)
   - По компоненту: тесты разных классов/модулей
2. Wave 1: запусти каждую группу как отдельный Agent параллельно
3. Каждый Agent получает: правила этого скилла + конкретную группу тестов из плана
4. Ожидай: `DONE` | `BLOCKED: [причина]`

---

## Задание
$ARGUMENTS

## Вход
Прочитай `ai/test_plan.md`. Если нет — **СТОП**, попроси `/cpl:test-plan`.

## Правила

> Используй skill `test-driven-development` для структурированного подхода к написанию тестов.

1. Один тест-класс за раз
2. Следуй таблице сценариев из плана
3. НЕ добавляй тесты сверх плана
4. НЕ меняй production-код
5. Используй testing framework проекта (описан в `CLAUDE.md`)

## Стиль
- Given/When/Then в названиях
- Один assert на тест (где возможно)
- Понятные имена на английском

## Verification Gate

After each task, BEFORE committing:
1. Read `verify_cmd` from `ai/status.md` (e.g. `./gradlew build`, `npm run build`)
2. Run the command
3. If FAIL -> fix -> retry (max 3 attempts)
4. If still FAIL -> output `BLOCKED:` with error, do NOT commit
5. If OK -> commit

If `verify_cmd` is not set in `ai/status.md` — skip verification and warn user to run `/cpl:new-project`.

## Обратная связь по конвейеру
- Если заметил проблему в конвейере (промпт не учёл кейс, не хватает правила, неудобный формат артефакта) — допиши в `ai/learnings.md`

## Skills
- `verification-before-completion` — перед завершением убедись что все тесты проходят
