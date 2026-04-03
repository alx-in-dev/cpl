# Deviation Rules

Правила автономности агента при генерации кода. Определяют что агент может делать сам, а что требует подтверждения пользователя.

## Уровень 1: auto-fix (чини молча, логируй)

Действуй самостоятельно, запиши в `ai/impl_notes.md` → `## Auto-deviations`:

- Broken imports / missing imports
- Missing dependencies (добавление в build file)
- Type mismatches (очевидные: Int vs Long, String vs String?)
- Lint errors и warnings
- Compilation errors от typo
- Deprecated API → замена на актуальный аналог
- Missing null-checks где компилятор требует

**Критерий**: Исправление очевидно, единственный правильный вариант, не меняет поведение.

## Уровень 2: auto-add (добавь и логируй)

Добавь недостающее, запиши в `ai/impl_notes.md` → `## Auto-deviations`:

- Input validation (проверка параметров на null, пустоту, границы)
- Error handling (try/catch, Result, sealed class для ошибок)
- Null-safety guards
- Missing logging (в catch-блоках, на границах сервисов)
- Missing resource cleanup (close, dispose, cancel)
- Rate limiting / throttling (если паттерн уже есть в проекте)

**Критерий**: Добавление улучшает robustness, не меняет бизнес-логику, следует существующим паттернам проекта.

## Уровень 3: ask (останови и спроси)

**СТОП** — спроси пользователя перед выполнением:

- Новая таблица / коллекция в БД
- Новый сервис / микросервис
- Смена архитектурного паттерна (MVC → MVVM, monolith → microservice)
- Удаление или изменение публичного API
- Новая внешняя зависимость (библиотека, SDK)
- Изменение схемы аутентификации / авторизации
- Изменение формата хранения данных (миграция)
- Добавление нового environment variable

**Критерий**: Изменение имеет архитектурные последствия, затрагивает другие компоненты, или необратимо.

## Формат логирования

В `ai/impl_notes.md`:

```markdown
## Auto-deviations

### [Дата]
- **auto-fix**: Добавлен import `com.example.Foo` в `Bar.kt` (compilation error)
- **auto-add**: Добавлен try/catch в `UserRepository.fetch()` (missing error handling)
- **ask**: ⏸️ Нужна новая таблица `user_sessions` — ожидаю подтверждения
```
