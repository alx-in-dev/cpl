# Определение профиля проекта

## Разведка

Изучи проект:
1. Прочитай `CLAUDE.md` (если есть)
2. Прочитай `README.md` (если есть)
3. Посмотри структуру: `build.gradle.kts`, `package.json`, `Cargo.toml`, `pyproject.toml`, `pom.xml`, `go.mod` и т.д.
4. Посмотри `.gitignore`, `docker-compose*.yml`, CI-конфиги
5. Прочитай `Docs/` или `docs/` (если есть) — кратко

Если проект пустой или нет кодовой базы — задай вопросы пользователю.

## Шаблон профиля

Заполни и выведи в чат:

```
## Профиль проекта
- **Название**: ...
- **Тип**: [android | ios | kmp | fullstack | backend | frontend | cli | library | другое]
- **Стеки**:
  - Язык: [Kotlin | Java | TypeScript | Python | Rust | Go | ...]
  - UI: [Compose | XML | React | Vue | SwiftUI | нет]
  - Backend: [Spring Boot | Express | FastAPI | нет]
  - DB: [PostgreSQL | MySQL | SQLite | MongoDB | нет]
  - DI: [Koin | Hilt/Dagger | нет]
  - CI: [GitHub Actions | GitLab CI | нет]
- **Монорепо**: [да (перечисли модули) | нет]
- **Текущее состояние**: [пустой | начальный | MVP | production]
```

Попроси пользователя подтвердить или скорректировать.

## Выбор фаз конвейера по профилю

На основе профиля — выбери какие фазы и артефакты нужны:

### Базовые (всегда)
- `/gather` → `ai/context.md`
- `/product` → `ai/requirements.md`, `ai/tasks.md`
- `/architect` → `ai/architecture.md`
- `/gen` → `ai/impl_notes.md`
- `/code-review` → `ai/review.md`
- `/debug` + `/debug-fix` → `ai/debug.md`
- `ai/gotchas.md` — реестр подводных камней (пополняется всеми фазами)
- `/routine`
- `/bootstrap`, `/progress`, `/handoff`

### Если есть UI (mobile/frontend)
- `/design` → `ai/design.md`
- `/ui-spec` → `ai/ui_spec.md`

### Если fullstack (mobile + backend)
- `/gen-server` → `ai/impl_notes.md`
- `/api-diff` → `ai/api_diff.md`
- `ai/api_contracts.md`
- `ai/screens_api_map.md`

### Если есть backend
- `/gen-server` → `ai/impl_notes.md`
- `/migrate` → `ai/migration.md`
- `/security` → `ai/security.md`
- `ai/api_contracts.md`

### Если есть тесты
- `/test-plan` → `ai/test_plan.md`
- `/gen-tests`

### Post-MVP (включить при зрелом проекте)
- `/refactor` → `ai/refactor.md`
- `/changelog` → `ai/changelog.md`
- `/release` → `ai/release.md`

Выведи таблицу:
```
## Конвейер для этого проекта
| Фаза | Команда | Нужна? | Причина |
|------|---------|--------|---------|
| ... | ... | ✅/❌ | ... |
```

Попроси пользователя подтвердить.

## Инжекция стек-специфичных паттернов в команды

Базовые skills стек-агностичные. После определения профиля `/cpl:new-project` **добавляет секцию `## Паттерны проекта`** в `CLAUDE.md` целевого проекта. Ниже — какие паттерны добавлять для каждой фазы:

### `/cpl:gen` — паттерны кодогенерации

Добавь конкретные примеры кода на языке/фреймворке проекта. Примеры по стекам:

**Kotlin + Compose + MVVM+MVI + Koin:**
```markdown
## Паттерны проекта

### ViewModel
```kotlin
class XxxViewModel(router: XxxRouter) : BaseViewModel<State, Action, Event>(State()) {
    override suspend fun onLaunch() { /* init */ }
    override fun obtainEvent(viewEvent: Event) { /* handle */ }
}
```

### DI Module
```kotlin
val xxxDiModule = module {
    component { XxxComponent() }
    scope<XxxComponent> { viewModelOf(::XxxViewModel) }
}
```

### Data Layer
UseCase → Repository (interface) → RepositoryImpl → DataSource → safeRequest { client.get(...) }
```

**Spring Boot + Hexagonal:**
```markdown
## Паттерны проекта

### Use Case (Input Port)
```kotlin
interface XxxUseCase {
    fun execute(request: XxxRequest): XxxResponse
}
```

### Service
```kotlin
@Service
class XxxService(private val repository: XxxRepositoryPort) : XxxUseCase { ... }
```

### Controller
```kotlin
@RestController
@RequestMapping("/api/v1/xxx")
class XxxController(private val useCase: XxxUseCase) { ... }
```
```

**React + TypeScript:**
```markdown
## Паттерны проекта

### Page component
```tsx
export default function XxxPage() {
  const { data, isLoading, error } = useXxx();
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState onRetry={refetch} />;
  return <XxxContent data={data} />;
}
```

### Custom hook
```tsx
export function useXxx() {
  return useQuery({ queryKey: ['xxx'], queryFn: fetchXxx });
}
```
```

**FastAPI + Python:**
```markdown
## Паттерны проекта

### Router
```python
@router.post("/xxx", response_model=XxxResponse)
async def create_xxx(request: XxxRequest, service: XxxService = Depends()):
    return await service.create(request)
```

### Service
```python
class XxxService:
    def __init__(self, repo: XxxRepository):
        self.repo = repo
```
```

**Rust CLI:**
```markdown
## Паттерны проекта

### Command
```rust
#[derive(Parser)]
struct XxxArgs {
    #[arg(short, long)]
    input: PathBuf,
}

fn handle_xxx(args: XxxArgs) -> Result<()> { ... }
```
```

**Vue 3 + Composition API:**
```markdown
## Паттерны проекта

### Page
```vue
<script setup lang="ts">
const { data, pending, error } = await useFetch('/api/xxx')
</script>
```

### Composable
```typescript
export function useXxx() {
  const items = ref<Xxx[]>([])
  async function fetch() { ... }
  return { items, fetch }
}
```
```

Выбери паттерны, соответствующие определённому стеку, и добавь их. Если стек не из списка выше — составь паттерны по аналогии на основе кода проекта.

### `/cpl:gen-server` — паттерны backend (если есть)

Добавь секцию `## Паттерны проекта` с примерами серверного кода: controller/handler, service, repository, DTO.

### `/cpl:code-review` — чеклист ревью

Добавь секцию `## Чеклист проекта` со специфичными для стека проверками:

**Mobile:** lifecycle, memory leaks, конфигурационные изменения, process death, specific imports, DTO isolation
**Backend:** hexagonal boundaries, input validation, SQL injection, N+1, error handling, domain exceptions
**Frontend:** XSS, a11y, bundle size, SSR hydration, SEO meta tags
**CLI:** error codes, help text, stdin/stdout conventions

### `/cpl:ui-spec` — UI паттерны (если есть UI)

Добавь секцию `## Паттерны проекта` с конкретным State Model фреймворка:
- Compose: `data class State(...), sealed interface Action, sealed interface Event`
- React: `useState/useReducer`, component props types
- Vue: `ref/reactive`, composable return types
- SwiftUI: `@Observable class`, `@State/@Binding`

### `/cpl:architect` — архитектурные паттерны

Добавь секцию `## Стек проекта` с перечнем конкретных технологий, версий и принятых паттернов из `CLAUDE.md`.

---

**Важно**: Добавляй паттерны ТОЛЬКО для определённого стека. Не добавляй React-паттерны в Kotlin-проект.
