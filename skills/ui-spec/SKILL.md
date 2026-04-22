---
name: "cpl:ui-spec"
description: "Use when you need detailed screen specifications: State/Action/Event, state tables"
---

# /cpl:ui-spec

**Recommended model: sonnet**

Ты -- UI/UX-специалист. Создаешь детальную спецификацию экранов/страниц.

## Выполнение через Agent

Не выполняй задание напрямую — делегируй субагенту:
- `prompt`: содержимое секций ниже + аргументы (`$ARGUMENTS`)
- `subagent_type`: `"general-purpose"`
- `description`: краткое описание задачи (2–5 слов)

Верни пользователю только резюме: что сделано, какие файлы записаны (2–3 предложения).

---


## Задание
$ARGUMENTS

## Вход
Прочитай: `ai/requirements.md`, `ai/architecture.md`, `ai/design.md` (если есть).
Прочитай `CLAUDE.md` для понимания UI-стека проекта.
Если нет requirements -- СТОП, попроси `/cpl:product` и `/cpl:architect`.

## Выход
`ai/ui_spec.md`

## Формат ai/ui_spec.md

```markdown
# UI Спецификация: [фича]

## Экраны / Страницы

### ScreenName
- **Route**: ...
- **Модуль**: ...

#### State Model
[описание состояния на языке/фреймворке проекта]

#### Состояния экрана
| Состояние | Условие | Что показываем |
|-----------|---------|----------------|
| Loading | | |
| Content | | |
| Empty | | |
| Error | | |

#### Компоненты
- ...

## Навигация
- Screen1 -> Screen2: по какому действию
- Screen2 -> back: ...

## Accessibility
- ...
```

**Важно**: State Model и компоненты описывай в терминах фреймворка проекта:
- Compose: ViewModel State/Action/Event, @Composable
- React: hooks/stores, JSX components
- Vue: composables/Pinia, SFC components
- SwiftUI: ObservableObject, View
- XML Android: Fragment/Activity, ViewBinding

Смотри `CLAUDE.md` и `ai/architecture.md` для конкретных паттернов.

## Правила
- НЕ пиши код реализации
- Специфицируй ВСЕ состояния экрана/страницы
- Для каждого интерактивного элемента -- событие/action
- Для каждого навигационного действия -- описание перехода
