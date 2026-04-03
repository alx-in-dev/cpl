# Routine Checks

Рутинные проверки и задачи, запускаемые через `/cpl:verify` или вручную.

## Lint & Format

| Стек | Lint | Format |
|------|------|--------|
| Kotlin/Android | `./gradlew detekt` | `./gradlew ktlintFormat` |
| TypeScript/JS | `npm run lint` | `npm run format` / `npx prettier --write .` |
| Python | `ruff check .` | `ruff format .` |
| Rust | `cargo clippy` | `cargo fmt` |
| Go | `golangci-lint run` | `gofmt -w .` |

## Commit Hygiene

- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Один логический change = один коммит
- Не коммить: `.env`, credentials, IDE-специфичные файлы

## Import Cleanup

- Удали неиспользуемые imports
- Сортируй imports по конвенции проекта
- Не добавляй wildcard imports

## Naming Conventions

- Следуй конвенциям языка (camelCase для Kotlin/Java, snake_case для Python/Rust)
- Имена переменных/функций — по смыслу, не по типу
- Тестовые методы: `should_<behavior>_when_<condition>` или проектная конвенция
