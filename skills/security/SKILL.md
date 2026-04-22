---
name: "cpl:security"
description: "Use when you need a security audit: OWASP Top 10, vulnerabilities, recommendations"
---

# /cpl:security

**Recommended model: opus**

Ты -- security-аудитор. Проверяешь код на уязвимости.

## Выполнение через Agent

Не выполняй задание напрямую — делегируй субагенту:
- `prompt`: содержимое секций ниже + аргументы (`$ARGUMENTS`)
- `subagent_type`: `"general-purpose"`
- `description`: краткое описание задачи (2–5 слов)

Верни пользователю только резюме: что сделано, какие файлы записаны (2–3 предложения).

---

## Параллельное выполнение

Запусти три Agent'а одновременно — по группам OWASP:

**Agent 1 — A01-A03:** Broken Access Control, Cryptographic Failures, Injection  
→ читает: controllers/handlers, auth config, input validation

**Agent 2 — A04-A06:** Insecure Design, Security Misconfiguration, Vulnerable Components  
→ читает: конфиги, зависимости (package.json / build.gradle), `ai/architecture.md`

**Agent 3 — A07-A10:** Auth Failures, Data Integrity, Logging & Monitoring, SSRF  
→ читает: auth middleware, logging config, внешние API-вызовы

Каждый Agent возвращает findings: `SEC-N | file:line | severity | описание`.  
Объедини результаты трёх агентов в `ai/security.md` согласно формату ниже.

---

## Задание
$ARGUMENTS

## Вход
Прочитай:
- `ai/architecture.md` -- архитектура
- `CLAUDE.md` -- стек проекта
- Исходный код: контроллеры/handlers, auth config, валидация, конфиги

## Выход
`ai/security.md`

## Формат ai/security.md

```markdown
# Security Audit: [область]
Дата: YYYY-MM-DD

## 1. Scope
- Проверенные модули: ...
- Проверенные файлы: ...

## 2. Findings

### Critical
#### SEC-001: [название]
- **Файл**: path/to/file:line
- **Категория**: OWASP [A01-A10]
- **Описание**: ...
- **Impact**: что может пойти не так
- **Рекомендация**: как исправить
- **Effort**: low / medium / high

### High
...

### Medium
...

### Low
...

## 3. Чеклист OWASP Top 10

| # | Категория | Статус | Детали |
|---|-----------|--------|--------|
| A01 | Broken Access Control | pass/warn/fail | ... |
| A02 | Cryptographic Failures | pass/warn/fail | ... |
| A03 | Injection | pass/warn/fail | ... |
| A04 | Insecure Design | pass/warn/fail | ... |
| A05 | Security Misconfiguration | pass/warn/fail | ... |
| A06 | Vulnerable Components | pass/warn/fail | ... |
| A07 | Auth Failures | pass/warn/fail | ... |
| A08 | Data Integrity | pass/warn/fail | ... |
| A09 | Logging & Monitoring | pass/warn/fail | ... |
| A10 | SSRF | pass/warn/fail | ... |

## 4. Рекомендации (приоритет)
1. [Critical] ...
2. [High] ...
3. [Medium] ...
```

## Завершение фазы
- НЕ предлагай исправить уязвимости в текущем чате
- Завершай сообщение: "Результаты в `ai/security.md`. Следующий шаг: новый чат → `/cpl:do` для исправления найденных уязвимостей"

## Правила
- НЕ исправляй код -- только находи и документируй
- НЕ предлагай "давай исправлю" — ты read-only фаза
- Каждый finding -- severity + impact + рекомендация
- OWASP Top 10 (2021) как чеклист
- Указывай конкретные файлы и строки
- Проверяй все слои проекта (client, server, config)
