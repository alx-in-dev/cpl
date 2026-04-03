#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"

TARGET_DIR="$(pwd)"
PROJECT_NAME=""
PACKAGE_NAME="com.example.app"
PROJECT_TYPE=""
PROJECT_STACK=""
FORCE="false"
FORCE_AI="false"
INLINE="false"
TODAY="$(date +%F)"

usage() {
  cat <<USAGE
cpl (Claude Pipeline) — инициализация проекта

Usage:
  $0 [options]

Options:
  --target-dir PATH      Проект (по умолчанию: текущая директория)
  --project-name NAME    Имя проекта (по умолчанию: basename target-dir)
  --package-name NAME    Базовый package (по умолчанию: com.example.app)
  --type TYPE            Тип проекта: mobile|backend|frontend|fullstack|cli|library
                         (по умолчанию: автоопределение по файлам)
  --stack DESCRIPTION    Стек технологий, например "Kotlin + Compose + Koin"
                         (по умолчанию: определяется командой /cpl:new-project)
  --inline               Хранить ai/, CLAUDE.md внутри проекта (без симлинков)
  --force                Перезаписывать существующие файлы (кроме ai/ артефактов)
  --force-ai             Перезаписывать в том числе ai/ артефакты (опасно!)
  -h, --help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target-dir)
      TARGET_DIR="$2"; shift 2 ;;
    --project-name)
      PROJECT_NAME="$2"; shift 2 ;;
    --package-name)
      PACKAGE_NAME="$2"; shift 2 ;;
    --type)
      PROJECT_TYPE="$2"; shift 2 ;;
    --stack)
      PROJECT_STACK="$2"; shift 2 ;;
    --inline)
      INLINE="true"; shift ;;
    --force)
      FORCE="true"; shift ;;
    --force-ai)
      FORCE_AI="true"; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1 ;;
  esac
done

if [[ -z "$PROJECT_NAME" ]]; then
  PROJECT_NAME="$(basename "$TARGET_DIR")"
fi

# --- Автоопределение типа проекта ---

detect_type() {
  local dir="$1"

  # Mobile
  if [[ -f "$dir/build.gradle.kts" || -f "$dir/build.gradle" ]] && \
     find "$dir" -maxdepth 5 -name "AndroidManifest.xml" -print -quit 2>/dev/null | grep -q .; then
    echo "mobile"; return
  fi

  # Frontend (Node.js + фреймворк)
  if [[ -f "$dir/package.json" ]]; then
    if compgen -G "$dir/next.config.*" >/dev/null 2>&1 || \
       compgen -G "$dir/nuxt.config.*" >/dev/null 2>&1 || \
       compgen -G "$dir/vite.config.*" >/dev/null 2>&1; then
      echo "frontend"; return
    fi
    # Backend Node.js
    if grep -qE '"(express|fastify|koa|hapi|nest)"' "$dir/package.json" 2>/dev/null; then
      echo "backend"; return
    fi
  fi

  # CLI (Rust with [[bin]])
  if [[ -f "$dir/Cargo.toml" ]] && grep -q '\[\[bin\]\]' "$dir/Cargo.toml" 2>/dev/null; then
    echo "cli"; return
  fi

  # Backend (JVM / Go / Rust / Python)
  if [[ -f "$dir/pom.xml" || -f "$dir/go.mod" || -f "$dir/Cargo.toml" || -f "$dir/pyproject.toml" ]]; then
    echo "backend"; return
  fi

  # Gradle без Android → library/backend
  if [[ -f "$dir/build.gradle.kts" || -f "$dir/build.gradle" ]]; then
    echo "library"; return
  fi

  echo ""
}

if [[ -z "$PROJECT_TYPE" ]]; then
  PROJECT_TYPE="$(detect_type "$TARGET_DIR")"
  if [[ -n "$PROJECT_TYPE" ]]; then
    echo "AUTO   type=$PROJECT_TYPE (detected from files)"
  else
    echo "WARN   --type not set and could not auto-detect; /cpl:new-project will determine"
  fi
fi

# --- Определяем где хранить AI-файлы ---

if [[ "$INLINE" == "true" ]]; then
  AI_BASE="$TARGET_DIR"
else
  # Sibling-директория: /path/to/Project → /path/to/ProjectAi
  AI_BASE="$(dirname "$TARGET_DIR")/${PROJECT_NAME}Ai"
fi

mkdir -p "$AI_BASE/ai" "$AI_BASE/ai/history"

# --- Функции ---

render_template() {
  local src="$1"
  local dst="$2"

  if [[ -f "$dst" && "$FORCE" != "true" ]]; then
    echo "SKIP  $dst"
    return
  fi

  local tmp
  tmp="$(mktemp)"

  sed \
    -e "s|__PROJECT_NAME__|$PROJECT_NAME|g" \
    -e "s|__PACKAGE_NAME__|$PACKAGE_NAME|g" \
    -e "s|__TYPE__|$PROJECT_TYPE|g" \
    -e "s|__STACK__|$PROJECT_STACK|g" \
    -e "s|__DATE__|$TODAY|g" \
    "$src" > "$tmp"

  mv "$tmp" "$dst"
  echo "WRITE $dst"
}

make_symlink() {
  local target="$1"   # куда указывает (реальный путь)
  local link="$2"     # где создаётся симлинк

  if [[ -L "$link" ]]; then
    rm "$link"
  elif [[ -d "$link" ]]; then
    local abs_target
    abs_target="$(cd "$(dirname "$link")" && cd "$(dirname "$target")" && pwd)/$(basename "$target")"
    mkdir -p "$abs_target"
    find "$link" -maxdepth 1 -not -name "$(basename "$link")" | while read -r item; do
      local base
      base="$(basename "$item")"
      if [[ ! -e "$abs_target/$base" ]]; then
        cp -R "$item" "$abs_target/$base"
        echo "MERGE $base → $abs_target/"
      else
        if [[ -f "$item" && -f "$abs_target/$base" ]]; then
          echo "KEEP  $abs_target/$base (already exists)"
        elif [[ -d "$item" && -d "$abs_target/$base" ]]; then
          cp -Rn "$item/" "$abs_target/$base/" 2>/dev/null || true
          echo "MERGE $base/ (recursive, no overwrite)"
        fi
      fi
    done
    rm -rf "$link"
  elif [[ -e "$link" ]]; then
    if [[ "$FORCE" == "true" ]]; then
      echo "MOVE  $link → ${link}.bak"
      mv "$link" "${link}.bak"
    else
      echo "SKIP  $link (exists, use --force to replace)"
      return
    fi
  fi

  ln -s "$target" "$link"
  echo "LINK  $link → $target"
}

# --- Генерация файлов ---

# CLAUDE.md
render_template "$TEMPLATES_DIR/CLAUDE.md.tmpl" "$AI_BASE/CLAUDE.md"

# AI artifacts (protected: only overwrite with --force-ai)
_ORIG_FORCE="$FORCE"
if [[ "$FORCE_AI" != "true" ]]; then
  FORCE="false"
fi
for md in "$TEMPLATES_DIR/ai"/*.md.tmpl; do
  name="$(basename "$md" .tmpl)"
  render_template "$md" "$AI_BASE/ai/$name"
done
FORCE="$_ORIG_FORCE"

# History dir marker
touch "$AI_BASE/ai/history/.gitkeep"

# --- Симлинки (если не inline) ---

if [[ "$INLINE" != "true" ]]; then
  AI_REL="../$(basename "$AI_BASE")"

  make_symlink "$AI_REL/ai" "$TARGET_DIR/ai"
  make_symlink "$AI_REL/CLAUDE.md" "$TARGET_DIR/CLAUDE.md"

  # .git/info/exclude — локальный gitignore (не коммитится)
  EXCLUDE_FILE="$TARGET_DIR/.git/info/exclude"
  if [[ -d "$TARGET_DIR/.git" ]]; then
    mkdir -p "$TARGET_DIR/.git/info"

    ENTRIES=("ai" "CLAUDE.md")
    for entry in "${ENTRIES[@]}"; do
      if ! grep -qxF "$entry" "$EXCLUDE_FILE" 2>/dev/null; then
        echo "$entry" >> "$EXCLUDE_FILE"
        echo "EXCLUDE $entry → .git/info/exclude"
      fi
    done
  else
    echo "WARN  .git not found — skip .git/info/exclude"
  fi
fi

# --- Итог ---

echo
echo "Done."
echo "Project:    $PROJECT_NAME"
echo "Target:     $TARGET_DIR"
[[ -n "$PROJECT_TYPE" ]] && echo "Type:       $PROJECT_TYPE"
[[ -n "$PROJECT_STACK" ]] && echo "Stack:      $PROJECT_STACK"
if [[ "$INLINE" != "true" ]]; then
  echo "AI files:   $AI_BASE"
  echo "Symlinks:   ai/, CLAUDE.md → $AI_BASE"
  echo "Excluded:   .git/info/exclude (local, not committed)"
fi
echo
echo "Next: /cpl:new-project or /cpl:gather"
