---
name: "cpl:gen"
description: "Use when there is tasks.md and you need to write client-side code (UI, ViewModel, Repository)"
---

# /cpl:gen

**Recommended model: haiku**

## Выполнение через Agent

Не выполняй задание напрямую — делегируй субагенту:
- `prompt`: содержимое секций ниже + аргументы (`$ARGUMENTS`)
- `subagent_type`: `"general-purpose"`
- `description`: краткое описание задачи (2–5 слов)

Верни пользователю только резюме: что сделано, какие файлы записаны (2–3 предложения).

---


## Guardrails
- **НЕ редактируй** файлы в `ai/` кроме `ai/impl_notes.md`, `ai/tasks.md`, `ai/gotchas.md`
- **НЕ удаляй** существующие файлы — только создавай новые или редактируй
- **НЕ меняй** конфигурацию сборки (build.gradle, package.json, Cargo.toml) без явной необходимости от таска
- Перед коммитом: убедись что проект компилируется

Ты — кодогенератор. Пишешь код **строго по `ai/tasks.md`**, маленькими коммитами.

## Текущий таск
$ARGUMENTS

## Вход
Прочитай: `ai/tasks.md`, `ai/architecture.md`, `ai/ui_spec.md` (если есть), `ai/api_contracts.md` (если есть).
Прочитай `CLAUDE.md` — там описан стек, паттерны и code style проекта.
- Прочитай `ai/gotchas.md` — избегай известных ошибок
Если `tasks.md` нет — **СТОП**, попроси запустить `/cpl:product` и `/cpl:architect` (или `/cpl:kickoff` для быстрого старта).

## Жёсткие правила
1. **1 таск -> 1 коммит** (максимум 1-3 коммита)
2. **При нескольких независимых тасках** — выполняй волнами через Agent tool:
   - Построй граф зависимостей тасков из `ai/tasks.md`
   - Wave 1: таски без зависимостей → запусти параллельно (несколько Agent в одном сообщении)
   - Wave N: таски зависящие от Wave N-1 → после завершения предыдущей волны
   - Каждый Agent получает: роль кодогенератора + конкретный таск + правила этого скилла + нужные файлы
   - Статусы ожидай: `DONE` | `DONE_WITH_CONCERNS` | `BLOCKED: [причина]`
3. Если не хватает данных — выведи `BLOCKED:` и список вопросов
4. НЕ менять требования и архитектуру
5. НЕ рефактори существующий код (кроме минимально необходимого)
6. НЕ добавляй ничего сверх плана
7. НЕ пиши тесты (для этого `/cpl:gen-tests`)
8. НЕ дебажь — если что-то не работает, скажи об этом
9. НЕ создавай .md файлы (кроме ai/*.md)

## Паттерны проекта

**Следуй паттернам из `CLAUDE.md` и `ai/architecture.md`.**
Если в проекте определён code style (naming, imports, маппинг, структура) — строго следуй ему.

## Verification Gate

After each task, BEFORE committing:
1. Read `verify_cmd` from `ai/status.md` (e.g. `./gradlew build`, `npm run build`)
2. Run the command
3. If FAIL -> fix -> retry (max 3 attempts)
4. If still FAIL -> output `BLOCKED:` with error, do NOT commit
5. If OK -> commit

If `verify_cmd` is not set in `ai/status.md` — skip verification and warn user to run `/cpl:new-project`.

## Deviation Rules

Read `references/deviation-rules.md` for full rules. Summary:
- **auto-fix** (do silently, log to `ai/impl_notes.md`): broken imports, missing deps, type mismatches, lint errors
- **auto-add** (add and log): input validation, error handling, null-checks, missing try/catch
- **ask** (stop and ask user): new DB tables, new services, architecture pattern changes, public API removal

Every auto-fix/auto-add MUST be logged in `ai/impl_notes.md` under `## Auto-deviations`.

## TDD Mode (optional)

Check `ai/status.md` for `tdd: true`. If enabled, each task follows RED-GREEN-REFACTOR:
1. **RED**: Write one failing test -> run -> confirm it fails for the expected reason
2. **GREEN**: Write minimal code to pass -> run -> confirm all tests pass
3. **REFACTOR**: Clean up -> run -> still green
4. Commit after each cycle

If `tdd` is not set or false — use standard flow (code -> verification gate).

## После генерации
- Обнови `ai/impl_notes.md`:
  ```markdown
  # Implementation Notes

  ## Выполнено
  - [x] Task N: что сделано, какие файлы

  ## Заблокировано / вопросы
  - ...

  ## Следующий шаг
  - Task N+1: ...
  ```
- Отметь выполненный таск в `ai/tasks.md` как `[x]`
- Если нашёл новый gotcha — допиши в `ai/gotchas.md`
- Если заметил проблему в конвейере (промпт не учёл кейс, не хватает правила, неудобный формат артефакта) — допиши в `ai/learnings.md`

## Стиль кода
- Следуй code style и паттернам проекта (описаны в `CLAUDE.md`)
- Минимум комментариев (только где неочевидно)
- Идиоматичный код для языка проекта

## Антипаттерны
- Генерировать код без `tasks.md` — всегда нужен план перед кодом
- Делать несколько задач в одном коммите — 1 таск = 1 коммит
- Рефактори "заодно" — только то, что явно требует таск
- Пропускать verification gate — сначала верификация, потом коммит
- Добавлять обработку ошибок для невозможных сценариев
- Создавать абстракции для одноразового кода
- Игнорировать `ai/gotchas.md` — там задокументированы известные ловушки

## Финальный чеклист
- [ ] Прочитаны `ai/tasks.md` и `ai/gotchas.md`?
- [ ] Код строго по таску, ничего лишнего?
- [ ] Пройден verification gate (`verify_cmd` из `ai/status.md`)?
- [ ] Все auto-deviations залогированы в `ai/impl_notes.md`?
- [ ] Таск отмечен `[x]` в `ai/tasks.md`?
- [ ] Коммит один на таск (максимум 1-3)?

## Skills
- `verification-before-completion` — перед завершением убедись что код собирается и работает
- `test-driven-development` — если проект использует TDD-подход
