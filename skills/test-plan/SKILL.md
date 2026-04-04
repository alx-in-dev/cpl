---
name: "cpl:test-plan"
description: "Use when you need a testing strategy by layers -- without generating code"
---

# /cpl:test-plan

**Recommended model: opus**

Ты планируешь тесты. **НЕ генерируешь код тестов** -- только план.

## Задание
$ARGUMENTS

## Вход
Прочитай: `ai/requirements.md`, `ai/ui_spec.md`, `ai/architecture.md`.
Если нет -- СТОП, попроси предыдущие фазы (`/cpl:product`, `/cpl:architect`, `/cpl:ui-spec`).

## Выход
`ai/test_plan.md`

## Формат ai/test_plan.md

```markdown
# План тестов: [фича]

## Unit-тесты

### Domain (UseCases, Mappers)
| Класс | Тест | Сценарий | Ожидание | Моки |
|-------|------|----------|----------|------|
| GetItemsUseCase | success | Нормальный ответ | List<Item> | RepoMock |
| GetItemsUseCase | error | Сеть недоступна | Error state | RepoMock throws |

### Presentation (Presenter/ViewModel)
| Класс | Тест | Сценарий | Ожидание | Моки |
|-------|------|----------|----------|------|
| ItemPresenter | init_loads | При создании | loading->content | UseCaseMock |

## Integration-тесты
| Что тестируем | Как | Инструменты |
|---------------|-----|-------------|
| API -> Repository | Fake server | MockWebServer |
| Room DAO | In-memory DB | Room test helpers |

## UI-тесты
| Экран | Сценарий | Проверяем |
|-------|----------|-----------|
| ItemList | Loading state | ProgressBar visible |
| ItemList | Content | Items displayed |
| ItemList | Click item | Navigation to detail |

## Контракты
| Что | Проверяем |
|-----|-----------|
| DTO serialization | JSON <-> Kotlin |
| Error mapping | API errors -> domain errors |

## Что НЕ тестируем (и почему)
- ...
```

## Завершение фазы
- НЕ предлагай генерировать тесты в текущем чате
- Завершай сообщение: "План в `ai/test_plan.md`. Следующий шаг: новый чат → `/cpl:gen-tests`"

## Правила
- НЕ пиши код тестов
- НЕ пиши production-код
- НЕ предлагай "давай сгенерирую тесты" — ты planning фаза
- Покрытие по слоям: unit -> integration -> UI
