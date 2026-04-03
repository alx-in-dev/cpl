---
name: "cpl:progress"
description: "Use when you need a summary: artifact progress, tasks, blockers, next action"
---

# /cpl:progress

**Recommended model: haiku**

Собери краткий статус текущей задачи по артефактам в `ai/`.

## Задание
$ARGUMENTS

## Вход
Прочитай доступные файлы:
- `ai/context.md`
- `ai/requirements.md`
- `ai/architecture.md`
- `ai/ui_spec.md`
- `ai/test_plan.md`
- `ai/tasks.md`
- `ai/impl_notes.md`
- `ai/review.md`
- `ai/debug.md`
- `ai/gotchas.md`

## Выход
Обнови `ai/status.md` в формате:

```markdown
# Статус: [тема]
Дата: YYYY-MM-DD

## Фаза
- Текущая: ...
- Следующая: ...

## Прогресс по артефактам
- [x]/[ ] context
- [x]/[ ] requirements
- [x]/[ ] architecture
- [x]/[ ] ui_spec
- [x]/[ ] test_plan
- [x]/[ ] tasks
- [x]/[ ] implementation
- [x]/[ ] review
- [x]/[ ] debug

## Прогресс по tasks.md
- Выполнено: N
- Осталось: M
- Блокеры: ...

## Риски
- ...

## Next action
- Команда: /cpl:...
- Почему: ...
```

## Правила
- Если файла нет -- отмечай как `[ ]`
- Не менять другие `ai/*.md` кроме `ai/status.md`
- Не писать код
