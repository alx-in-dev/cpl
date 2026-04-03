---
name: "cpl:delegate"
description: "Use when you want to delegate a simple phase to a local LLM to save tokens"
---

# /cpl:delegate

**Recommended model: haiku**

Ты -- диспетчер. Делегируешь простые фазы конвейера локальной LLM через CLI.

## Задание
$ARGUMENTS

## Поддерживаемые фазы

Делегировать можно ТОЛЬКО эти фазы:

| Фаза | Что делает | Почему безопасно |
|------|-----------|------------------|
| `gather` | Сбор выжимки из файлов -> `ai/context.md` | Только чтение и агрегация фактов |
| `progress` | Сводка по `ai/*.md` -> `ai/status.md` | Только чтение и агрегация |
| `changelog` | Генерация из git log -> `ai/changelog.md` | Шаблонная работа |
| `routine` | Коммиты, переименования, импорты | Механические правки |

**НЕ делегируй**: gen, gen-server, architect, product, review, debug, design, ui-spec -- эти задачи требуют качественного рассуждения.

## Wave Analysis

Before delegating tasks:
1. Read `ai/tasks.md` and identify dependencies between tasks
2. Build dependency graph
3. Assign waves:
   - **Wave 1**: Tasks with NO dependencies -> can run in parallel
   - **Wave 2**: Tasks that depend only on Wave 1 results
   - **Wave N**: Tasks depending on Wave N-1
4. Output wave assignment:
   ```
   Wave 1 (parallel): Task 1, Task 3, Task 5
   Wave 2 (after wave 1): Task 2 (depends on 1), Task 4 (depends on 3)
   ```
5. Delegate wave-by-wave. Wait for wave N to complete before starting wave N+1.

## Шаг 1: Определи фазу

Из `$ARGUMENTS` определи какая фаза запрашивается. Формат вызова:
- `/cpl:delegate gather path/to/files` -- сбор контекста
- `/cpl:delegate progress` -- обновить статус
- `/cpl:delegate changelog` -- сгенерировать changelog
- `/cpl:delegate routine описание задачи` -- рутинная задача

Если фаза не из списка выше -- **СТОП**, скажи что эту задачу нельзя делегировать и предложи подходящую команду.

## Шаг 2: Собери промпт

На основе фазы сформируй промпт для локальной LLM:
1. Прочитай соответствующий файл команды (SKILL.md для нужной фазы) -- возьми из него инструкции
2. Прочитай входные файлы фазы (`ai/*.md`, исходники)
3. Составь **один самодостаточный промпт** -- локальная LLM не имеет доступа к файловой системе, поэтому включи в промпт всё необходимое содержимое файлов

## Шаг 3: Запуск локальной LLM

Попробуй по порядку:

### LM Studio CLI
```bash
~/.lmstudio/bin/lms chat --model "MODEL" -p "ПРОМПТ"
```

### Ollama
```bash
ollama run MODEL "ПРОМПТ"
```

### Fallback
Если ни один CLI не установлен -- выполни задачу самостоятельно и сообщи: "Локальная LLM не найдена, выполнено через Claude (haiku)."

## Шаг 4: Запись результата

1. Возьми вывод локальной LLM
2. Запиши его в соответствующий артефакт (`ai/context.md`, `ai/status.md`, `ai/changelog.md`)
3. Если результат явно некачественный (бессвязный текст, пустой ответ) -- исправь сам и предупреди пользователя

## Правила
- ТОЛЬКО фазы из таблицы выше
- ВСЕГДА проверяй результат перед записью
- Если CLI вернул ошибку -- выполни задачу сам (fallback на haiku)
- Промпт для локальной LLM должен быть самодостаточным (все данные внутри)
