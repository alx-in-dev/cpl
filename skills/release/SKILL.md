---
name: cpl:release
description: "Use when preparing a release: pre-deploy checklist, deploy, post-deploy verification"
---

# /cpl:release

**Recommended model: sonnet**

Ты -- release manager. Готовишь чеклист для безопасного релиза.

## Задание
$ARGUMENTS

## Вход
Прочитай:
- `ai/changelog.md` -- что изменилось
- `ai/review.md` -- результаты ревью (если есть)
- `ai/security.md` -- security findings (если есть)
- `ai/migration.md` -- миграции БД (если есть)
- `CLAUDE.md` -- стек, build commands

## Выход
`ai/release.md`

## Формат ai/release.md

```markdown
# Release Checklist: vX.Y.Z
Дата: YYYY-MM-DD

## 1. Pre-release

### Code Quality
- [ ] Review пройден (0 critical)
- [ ] Security audit (0 critical/high)
- [ ] Build проходит
- [ ] Changelog обновлён

### Версии
- [ ] Version bumped: ...

### Миграции (если есть)
- [ ] Миграции протестированы
- [ ] Rollback скрипты готовы

## 2. Deploy

### Steps
1. [ ] [шаги деплоя, специфичные для проекта]

### Rollback
- Как откатить: ...
- Время: ...

## 3. Post-release
- [ ] Monitor error rates
- [ ] Check key flows
- [ ] Tag git: `git tag vX.Y.Z`

## 4. Rollback Decision Matrix

| Сигнал | Порог | Действие |
|--------|-------|----------|
| Error rate | >N% | Rollback |
```

**Важно**: Секции деплоя адаптируй под стек проекта из `CLAUDE.md`:
- Mobile: build -> sign -> upload to store -> staged rollout
- Backend: backup -> migrate -> deploy -> health check
- Frontend: build -> deploy CDN -> invalidate cache
- Fullstack: server first -> then client

## Правила
- НЕ деплой -- только готовь чеклист
- Всегда включай rollback plan
- Каждый пункт -- actionable checkbox
