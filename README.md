# cpl — Claude Pipeline

AI-конвейер разработки для Claude Code. Устанавливает 28 команд `/cpl:*` и структуру `ai/*.md` артефактов для любого проекта.

## Установка

```bash
npx claude-pipeline@latest          # глобально (~/.claude/commands/cpl/)
npx claude-pipeline@latest --local  # локально (./.claude/commands/cpl/)
npx claude-pipeline@latest --uninstall
```

## Быстрый старт

```
/cpl:new-project    # один раз — определяет стек, создаёт ai/ артефакты
/cpl:kickoff        # контекст → требования → задачи за один чат
```

Или пошагово:

```
/cpl:context → /cpl:product → /cpl:architect → /cpl:gen → /cpl:code-review → /cpl:release
```

Не знаешь с чего начать — напиши `/cpl:do <запрос>`, роутер определит фазу.

## Команды

### Конвейер

| Команда | Что делает |
|---------|-----------|
| `/cpl:context` | Читает проект, пишет `ai/context.md` |
| `/cpl:product` | Требования + user stories → `ai/requirements.md` |
| `/cpl:architect` | Архитектура + ADR → `ai/architecture.md` |
| `/cpl:design` | UX-потоки → `ai/design.md` |
| `/cpl:ui-spec` | Спеки экранов → `ai/ui_spec.md` |
| `/cpl:test-plan` | Стратегия тестирования → `ai/test_plan.md` |
| `/cpl:gen` | Генерация клиентского кода |
| `/cpl:gen-server` | Генерация серверного кода |
| `/cpl:gen-tests` | Генерация тестов |
| `/cpl:code-review` | Ревью + проверка целей → `ai/review.md` |
| `/cpl:debug` | Дебаг по stacktrace → `ai/debug.md` |
| `/cpl:investigate` | Расследование без stacktrace → `ai/investigate.md` |

### Post-MVP

| Команда | Что делает |
|---------|-----------|
| `/cpl:refactor` | План рефакторинга |
| `/cpl:migrate` | Миграция БД |
| `/cpl:security` | Аудит OWASP |
| `/cpl:api-diff` | Проверка рассинхрона клиент/сервер |
| `/cpl:changelog` | Changelog из git |
| `/cpl:release` | Чеклист релиза |

### Мета

| Команда | Что делает |
|---------|-----------|
| `/cpl:do` | Роутер — определяет нужную фазу по запросу |
| `/cpl:next` | Следующий шаг конвейера |
| `/cpl:kickoff` | Быстрый старт: context → requirements → tasks |
| `/cpl:new-project` | Инициализация проекта |
| `/cpl:progress` | Состояние конвейера |
| `/cpl:pause` / `/cpl:resume` | Сохранение и восстановление сессии |
| `/cpl:verify` | Проверка артефактов + билд |
| `/cpl:evolve` | Самоулучшение из накопленных learnings |

## Инициализация проекта из CLI

```bash
npx claude-pipeline@latest init --target-dir /path/to/project
```

Флаги: `--project-name`, `--type mobile|backend|frontend|fullstack|cli|library`, `--stack "Kotlin + Compose"`, `--inline` (без симлинков), `--force-ai` (перезаписать ai/).

## Принципы

- **Фазовая изоляция** — каждая фаза читает предыдущие артефакты, пишет в свой. Фазы не смешиваются в одном чате.
- **Verification gates** — генерация кода запускает `verify_cmd` после каждого таска. 3 попытки, иначе BLOCKED.
- **Deviation rules** — агент чинит импорты молча, добавляет валидацию с логом, спрашивает при архитектурных решениях.
- **Auto-learnings** — каждая фаза пишет в `ai/learnings.md`, `/cpl:evolve` превращает их в улучшения конвейера.

## License

MIT
