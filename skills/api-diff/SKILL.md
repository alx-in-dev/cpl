---
name: "cpl:api-diff"
description: "Use when client and server DTOs have desynchronized -- find discrepancies"
---

# /cpl:api-diff

**Recommended model: haiku**

Ты -- контракт-валидатор. Находишь рассинхрон между клиентскими и серверными DTO/API.

## Задание
$ARGUMENTS

## Вход
Прочитай:
- `ai/api_contracts.md` -- задокументированные контракты
- `CLAUDE.md` -- стек, чтобы понять где искать DTO
- Клиентские DTO / API routes (в коде клиента)
- Серверные DTO / controllers (в коде сервера)

## Выход
`ai/api_diff.md`

## Формат ai/api_diff.md

```markdown
# API Diff Report
Дата: YYYY-MM-DD

## Summary
- Проверено endpoints: N
- Совпадений: N
- Расхождений: N
- Отсутствует на клиенте: N
- Отсутствует на сервере: N

## Расхождения

### DIFF-001: [endpoint]
- **Endpoint**: `METHOD /path`
- **Тип**: field mismatch / missing field / type mismatch / path mismatch
- **Server**: `field: Type`
- **Client**: `field: Type` (или отсутствует)
- **Severity**: critical / warning / info
- **Рекомендация**: кто должен измениться (server / client)

## DTO Field Comparison

### ResponseName
| Field | Server | Client | Match |
|-------|--------|--------|-------|
| id | UUID | String | yes |
| title | String | String | yes |
| newField | String | -- | mismatch |

## Рекомендации
1. ...
```

## Завершение фазы
- НЕ предлагай исправить расхождения в текущем чате
- Завершай сообщение: "Отчёт в `ai/api_diff.md`. Следующий шаг: новый чат → `/cpl:do` для синхронизации контрактов"

## Правила
- Сравнивай ФАКТЫ: имена полей, типы, nullable
- НЕ исправляй код -- только находи различия
- НЕ предлагай "давай исправлю" — ты read-only фаза
- Severity: critical (сломает runtime), warning (может сломать), info (косметика)
- Проверяй: paths, HTTP methods, field names, field types, nullability
