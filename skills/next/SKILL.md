---
name: cpl:next
description: "Use when user asks what to do next, wants to know current progress, or needs guidance on the next pipeline phase"
---

# /cpl:next

**Recommended model: haiku**

Автоопределение следующего шага конвейера.

## Выполнение через Agent

Не выполняй задание напрямую — делегируй субагенту:
- `prompt`: содержимое секций ниже + аргументы (`$ARGUMENTS`)
- `subagent_type`: `"general-purpose"`
- `description`: краткое описание задачи (2–5 слов)

Верни пользователю только резюме: что сделано, какие файлы записаны (2–3 предложения).

---


## Инструкции

### Шаг 1: Прочитай состояние
Прочитай `ai/status.md`. Если файла нет — предложи `/cpl:new-project`.

### Шаг 2: Проверь блокеры (Приоритет 1)
Если в `ai/status.md` есть `⚠️ RE-PASS`:
> "Есть блокер: RE-PASS `/cpl:<фаза>` (причина: ...). Рекомендую начать с него."

### Шаг 3: Проверь прогресс артефактов (Приоритет 2)
Определи первый незаполненный артефакт в цепочке:

```
ai/context.md      [ ] → /cpl:context
ai/requirements.md [ ] → /cpl:product
ai/architecture.md [ ] → /cpl:architect
ai/design.md       [ ] → /cpl:design (если UI-проект)
ai/ui_spec.md      [ ] → /cpl:ui-spec (если UI-проект)
ai/test_plan.md    [ ] → /cpl:test-plan
ai/tasks.md        [x] + implementation [ ] → /cpl:gen (или /cpl:gen-server)
implementation     [x] + review [ ] → /cpl:code-review
всё                [x] → /cpl:release (или /cpl:changelog)
```

Артефакт считается заполненным если файл существует И содержит больше чем шаблонный заголовок.

### Шаг 4: Проверь Next action (Приоритет 3)
Если в `ai/status.md` указан "Next action" — предложи его.

### Шаг 5: Выведи результат

```
Фаза: [текущая фаза из status.md]
Прогресс: N/M артефактов заполнено
Рекомендую: `/cpl:<фаза>` — [почему]
```

## Правила
- Не менять никакие файлы — только чтение и рекомендация
- Учитывай тип проекта: если не UI-проект, пропускай design и ui-spec
- Если handoff.md существует — предложи `/cpl:resume`
