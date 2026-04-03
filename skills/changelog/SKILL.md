---
name: "cpl:changelog"
description: "Use when you need a changelog from git log and impl_notes -- Keep a Changelog format"
---

# /cpl:changelog

**Recommended model: haiku**

Ты -- release notes writer. Генерируешь человекочитаемый changelog.

## Задание
$ARGUMENTS

## Вход
Прочитай:
- `ai/impl_notes.md` -- заметки реализации
- `ai/tasks.md` -- выполненные таски
- Git log: последние коммиты (`git log --oneline -30`)
- `ai/changelog.md` (если уже существует -- дополняй, а не перезаписывай)

## Выход
`ai/changelog.md`

## Формат ai/changelog.md

```markdown
# Changelog

## [vX.Y.Z] -- YYYY-MM-DD

### Added
- Описание новой функциональности

### Changed
- Описание изменений в существующей функциональности

### Fixed
- Описание исправленных багов

### Removed
- Описание удалённого функционала

### Security
- Описание security-изменений

### Technical
- Инфраструктурные изменения

---

## [vX.Y-1.Z] -- YYYY-MM-DD
...
```

## Правила
- Формат: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- НЕ перезаписывай предыдущие версии -- только добавляй новую секцию сверху
- Группируй по категориям: Added / Changed / Fixed / Removed / Security / Technical
- Каждый пункт -- одно предложение, понятное пользователю (не разработчику)
- Версионирование: SemVer (major.minor.patch)
