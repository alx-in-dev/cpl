#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const PKG_ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(PKG_ROOT, "skills");
const REFS_DIR = path.join(PKG_ROOT, "references");
const TMPL_DIR = path.join(PKG_ROOT, "templates");
const HOOKS_DIR = path.join(PKG_ROOT, "lib", "hooks");

const VERSION = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, "package.json"), "utf8")).version;

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flags = {
  local: false,
  uninstall: false,
  init: false,
  force: false,
  targetDir: null,
  projectName: null,
  packageName: "com.example.app",
  type: null,
  stack: null,
  inline: false,
  forceAi: false,
  help: false,
};

let i = 0;
while (i < args.length) {
  const a = args[i];
  switch (a) {
    case "--local": flags.local = true; break;
    case "--global": flags.local = false; break;
    case "--uninstall": flags.uninstall = true; break;
    case "init": flags.init = true; break;
    case "--force": flags.force = true; break;
    case "--force-ai": flags.forceAi = true; break;
    case "--inline": flags.inline = true; break;
    case "-h": case "--help": flags.help = true; break;
    case "--target-dir": flags.targetDir = args[++i]; break;
    case "--project-name": flags.projectName = args[++i]; break;
    case "--package-name": flags.packageName = args[++i]; break;
    case "--type": flags.type = args[++i]; break;
    case "--stack": flags.stack = args[++i]; break;
    default:
      console.error(`Unknown option: ${a}`);
      process.exit(1);
  }
  i++;
}

if (flags.help) {
  console.log(`claude-pipeline v${VERSION}

Usage:
  npx claude-pipeline@latest              Install globally (default)
  npx claude-pipeline@latest --local      Install to ./.claude/
  npx claude-pipeline@latest --uninstall  Remove installed files
  npx claude-pipeline@latest init [opts]  Initialize project with ai/ artifacts

Install options:
  --local              Install to ./.claude/ instead of ~/.claude/
  --uninstall          Remove all installed cpl files
  --force              Overwrite existing files

Init options:
  --target-dir PATH    Target project directory (default: cwd)
  --project-name NAME  Project name (default: basename of target-dir)
  --package-name NAME  Base package (default: com.example.app)
  --type TYPE          mobile|backend|frontend|fullstack|cli|library
  --stack DESCRIPTION  Tech stack, e.g. "Kotlin + Compose + Koin"
  --inline             Store ai/ and CLAUDE.md inside project (no symlinks)
  --force-ai           Overwrite existing ai/ artifacts
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClaudeBase() {
  if (flags.local) {
    return path.join(process.cwd(), ".claude");
  }
  return path.join(os.homedir(), ".claude");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function log(tag, msg) {
  console.log(`  ${tag.padEnd(6)} ${msg}`);
}

function copyFile(src, dst) {
  ensureDir(path.dirname(dst));
  if (fs.existsSync(dst) && !flags.force) {
    log("SKIP", dst);
    return false;
  }
  fs.copyFileSync(src, dst);
  log("WRITE", dst);
  return true;
}

function copyDir(src, dst) {
  ensureDir(dst);
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const dstPath = path.join(dst, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      copyFile(srcPath, dstPath);
    }
  }
}

function rmRecursive(p) {
  if (!fs.existsSync(p)) return;
  if (fs.statSync(p).isDirectory()) {
    for (const entry of fs.readdirSync(p)) {
      rmRecursive(path.join(p, entry));
    }
    fs.rmdirSync(p);
  } else {
    fs.unlinkSync(p);
  }
}

// ---------------------------------------------------------------------------
// Hook helpers: merge/remove autopilot-stop hook in settings.json
// ---------------------------------------------------------------------------

function mergeStopHook(settingsPath, hooksTarget) {
  const hookCmd = `node "${hooksTarget}"`;
  const hookEntry = {
    matcher: "*",
    hooks: [{ type: "command", command: hookCmd, timeout: 5 }],
  };

  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    } catch {
      log("WARN", `Cannot parse ${settingsPath} — hook not registered`);
      return;
    }
  }

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.Stop) settings.hooks.Stop = [];

  // Remove stale cpl autopilot-stop entries, then re-add
  settings.hooks.Stop = settings.hooks.Stop.filter(
    (e) => !e.hooks || !e.hooks.some((h) => h.command && h.command.includes("autopilot-stop.js"))
  );
  settings.hooks.Stop.push(hookEntry);

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
  log("HOOK", `Stop hook → ${settingsPath}`);
}

function removeStopHook(settingsPath) {
  if (!fs.existsSync(settingsPath)) return;
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {
    return;
  }

  if (!settings.hooks || !settings.hooks.Stop) return;

  settings.hooks.Stop = settings.hooks.Stop.filter(
    (e) => !e.hooks || !e.hooks.some((h) => h.command && h.command.includes("autopilot-stop.js"))
  );
  if (settings.hooks.Stop.length === 0) delete settings.hooks.Stop;
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
  log("HOOK", `Stop hook removed from ${settingsPath}`);
}

// ---------------------------------------------------------------------------
// Install: copy skills → commands/cpl/, refs → cpl/refs/, etc.
// ---------------------------------------------------------------------------

function install() {
  const base = getClaudeBase();
  const commandsDir = path.join(base, "commands", "cpl");
  const refsTarget = path.join(base, "cpl", "refs");
  const tmplTarget = path.join(base, "cpl", "tmpl");
  const hooksTarget = path.join(base, "cpl", "hooks");
  const versionFile = path.join(base, "cpl", "VERSION");

  console.log(`\nInstalling claude-pipeline v${VERSION} → ${base}\n`);

  // Remove old commands if they exist (clean install like GSD)
  if (fs.existsSync(commandsDir)) {
    rmRecursive(commandsDir);
    log("CLEAN", "removed old commands/cpl/");
  }

  // Copy skills as commands
  ensureDir(commandsDir);
  const skills = fs.readdirSync(SKILLS_DIR).filter((d) =>
    fs.statSync(path.join(SKILLS_DIR, d)).isDirectory()
  );

  for (const skill of skills) {
    const skillFile = path.join(SKILLS_DIR, skill, "SKILL.md");
    if (!fs.existsSync(skillFile)) continue;
    const dstFile = path.join(commandsDir, `${skill}.md`);
    ensureDir(path.dirname(dstFile));
    fs.copyFileSync(skillFile, dstFile);
    log("CMD", `${skill}.md`);
  }

  // Copy references
  if (fs.existsSync(refsTarget)) {
    rmRecursive(refsTarget);
  }
  copyDir(REFS_DIR, refsTarget);

  // Copy templates
  if (fs.existsSync(tmplTarget)) {
    rmRecursive(tmplTarget);
  }
  copyDir(TMPL_DIR, tmplTarget);

  // Copy hooks
  if (fs.existsSync(HOOKS_DIR)) {
    if (fs.existsSync(hooksTarget)) {
      rmRecursive(hooksTarget);
    }
    copyDir(HOOKS_DIR, hooksTarget);
  }

  // Register Stop hook in settings.json
  const settingsPath = path.join(base, "settings.json");
  const autopilotHookPath = path.join(hooksTarget, "autopilot-stop.js");
  mergeStopHook(settingsPath, autopilotHookPath);

  // Write VERSION
  ensureDir(path.dirname(versionFile));
  fs.writeFileSync(versionFile, VERSION, "utf8");
  log("VER", `v${VERSION}`);

  console.log(`\nDone. ${skills.length} commands installed.`);
  console.log("Use /cpl:do <task> or /cpl:new-project to get started.\n");
}

// ---------------------------------------------------------------------------
// Uninstall
// ---------------------------------------------------------------------------

function uninstall() {
  const base = getClaudeBase();
  const targets = [
    path.join(base, "commands", "cpl"),
    path.join(base, "cpl"),
  ];

  console.log(`\nUninstalling claude-pipeline from ${base}\n`);

  // Remove Stop hook from settings.json before deleting files
  const settingsPath = path.join(base, "settings.json");
  removeStopHook(settingsPath);

  for (const t of targets) {
    if (fs.existsSync(t)) {
      rmRecursive(t);
      log("DEL", t);
    } else {
      log("SKIP", `${t} (not found)`);
    }
  }

  // Remove commands/ dir if empty
  const cmdsDir = path.join(base, "commands");
  if (fs.existsSync(cmdsDir) && fs.readdirSync(cmdsDir).length === 0) {
    rmRecursive(cmdsDir);
    log("DEL", `${cmdsDir} (empty)`);
  }

  console.log("\nDone.\n");
}

// ---------------------------------------------------------------------------
// Init: create ai/ artifacts in target project
// ---------------------------------------------------------------------------

function initProject() {
  const targetDir = flags.targetDir
    ? path.resolve(flags.targetDir)
    : process.cwd();
  const projectName =
    flags.projectName || path.basename(targetDir);
  const packageName = flags.packageName;
  const today = new Date().toISOString().split("T")[0];

  // Auto-detect type
  let projectType = flags.type;
  if (!projectType) {
    projectType = detectProjectType(targetDir) || "";
    if (projectType) {
      log("AUTO", `type=${projectType} (detected from files)`);
    } else {
      log("WARN", "--type not set and could not auto-detect");
    }
  }

  const projectStack = flags.stack || "";

  // Determine AI base location
  let aiBase;
  if (flags.inline) {
    aiBase = targetDir;
  } else {
    aiBase = path.join(
      path.dirname(targetDir),
      `${projectName}Ai`
    );
  }

  ensureDir(path.join(aiBase, "ai", "history"));

  console.log(`\nInitializing project: ${projectName}`);
  console.log(`Target: ${targetDir}`);
  console.log(`AI base: ${aiBase}\n`);

  // Read templates from installed location or package
  const tmplBase = fs.existsSync(path.join(getClaudeBase(), "cpl", "tmpl"))
    ? path.join(getClaudeBase(), "cpl", "tmpl")
    : TMPL_DIR;

  // Render template with variable substitution
  function renderTemplate(src, dst, forceOverwrite) {
    if (fs.existsSync(dst) && !forceOverwrite && !flags.forceAi) {
      log("SKIP", dst);
      return;
    }
    ensureDir(path.dirname(dst));
    let content = fs.readFileSync(src, "utf8");
    content = content
      .replace(/__PROJECT_NAME__/g, projectName)
      .replace(/__PACKAGE_NAME__/g, packageName)
      .replace(/__TYPE__/g, projectType)
      .replace(/__STACK__/g, projectStack)
      .replace(/__DATE__/g, today);
    fs.writeFileSync(dst, content, "utf8");
    log("WRITE", dst);
  }

  // CLAUDE.md
  const claudeMd = path.join(tmplBase, "CLAUDE.md.tmpl");
  if (fs.existsSync(claudeMd)) {
    renderTemplate(claudeMd, path.join(aiBase, "CLAUDE.md"), flags.force);
  }

  // AI artifacts (protected — only overwrite with --force-ai)
  const aiTmplDir = path.join(tmplBase, "ai");
  if (fs.existsSync(aiTmplDir)) {
    for (const file of fs.readdirSync(aiTmplDir)) {
      if (!file.endsWith(".md.tmpl")) continue;
      const name = file.replace(/\.tmpl$/, "");
      renderTemplate(
        path.join(aiTmplDir, file),
        path.join(aiBase, "ai", name),
        flags.forceAi
      );
    }
  }

  // History marker
  const gitkeep = path.join(aiBase, "ai", "history", ".gitkeep");
  if (!fs.existsSync(gitkeep)) {
    fs.writeFileSync(gitkeep, "", "utf8");
  }

  // Symlinks (if not inline)
  if (!flags.inline) {
    const aiRel = `../${path.basename(aiBase)}`;

    createSymlink(
      path.join(aiRel, "ai"),
      path.join(targetDir, "ai")
    );
    createSymlink(
      path.join(aiRel, "CLAUDE.md"),
      path.join(targetDir, "CLAUDE.md")
    );

    // .git/info/exclude
    const gitDir = path.join(targetDir, ".git");
    if (fs.existsSync(gitDir)) {
      const excludeFile = path.join(gitDir, "info", "exclude");
      ensureDir(path.dirname(excludeFile));
      let excludeContent = "";
      if (fs.existsSync(excludeFile)) {
        excludeContent = fs.readFileSync(excludeFile, "utf8");
      }
      for (const entry of ["ai", "CLAUDE.md"]) {
        if (!excludeContent.split("\n").includes(entry)) {
          fs.appendFileSync(excludeFile, `${entry}\n`, "utf8");
          log("EXCLUDE", `${entry} → .git/info/exclude`);
        }
      }
    }
  }

  console.log(`\nDone.`);
  console.log(`Next: /cpl:new-project or /cpl:context\n`);
}

// ---------------------------------------------------------------------------
// Init helpers
// ---------------------------------------------------------------------------

function detectProjectType(dir) {
  // Mobile
  if (
    (fs.existsSync(path.join(dir, "build.gradle.kts")) ||
      fs.existsSync(path.join(dir, "build.gradle"))) &&
    hasFileDeep(dir, "AndroidManifest.xml", 5)
  ) {
    return "mobile";
  }

  // Frontend
  if (fs.existsSync(path.join(dir, "package.json"))) {
    if (
      globExists(dir, "next.config.*") ||
      globExists(dir, "nuxt.config.*") ||
      globExists(dir, "vite.config.*")
    ) {
      return "frontend";
    }
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, "package.json"), "utf8")
      );
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (
        ["express", "fastify", "koa", "hapi", "nest"].some(
          (n) => deps[n]
        )
      ) {
        return "backend";
      }
    } catch {}
  }

  // CLI
  if (
    fs.existsSync(path.join(dir, "Cargo.toml")) &&
    fs.readFileSync(path.join(dir, "Cargo.toml"), "utf8").includes("[[bin]]")
  ) {
    return "cli";
  }

  // Backend
  if (
    ["pom.xml", "go.mod", "Cargo.toml", "pyproject.toml"].some((f) =>
      fs.existsSync(path.join(dir, f))
    )
  ) {
    return "backend";
  }

  // Library
  if (
    fs.existsSync(path.join(dir, "build.gradle.kts")) ||
    fs.existsSync(path.join(dir, "build.gradle"))
  ) {
    return "library";
  }

  return "";
}

function hasFileDeep(dir, name, maxDepth) {
  try {
    function walk(d, depth) {
      if (depth > maxDepth) return false;
      for (const entry of fs.readdirSync(d)) {
        if (entry === "node_modules" || entry === ".git") continue;
        const p = path.join(d, entry);
        if (entry === name) return true;
        if (fs.statSync(p).isDirectory() && walk(p, depth + 1)) return true;
      }
      return false;
    }
    return walk(dir, 0);
  } catch {
    return false;
  }
}

function globExists(dir, pattern) {
  const base = pattern.replace(/\.\*$/, "");
  for (const ext of [".js", ".ts", ".mjs", ".cjs", ""]) {
    if (fs.existsSync(path.join(dir, base + ext))) return true;
  }
  return false;
}

function createSymlink(target, link) {
  if (fs.existsSync(link) || fs.lstatSync(link, { throwIfNoEntry: false })) {
    if (fs.lstatSync(link).isSymbolicLink()) {
      fs.unlinkSync(link);
    } else if (fs.lstatSync(link).isDirectory()) {
      // Merge contents then remove
      const absTarget = path.resolve(path.dirname(link), target);
      ensureDir(absTarget);
      for (const entry of fs.readdirSync(link)) {
        const src = path.join(link, entry);
        const dst = path.join(absTarget, entry);
        if (!fs.existsSync(dst)) {
          if (fs.statSync(src).isDirectory()) {
            copyDir(src, dst);
          } else {
            fs.copyFileSync(src, dst);
          }
          log("MERGE", `${entry} → ${absTarget}/`);
        }
      }
      rmRecursive(link);
    } else {
      if (!flags.force) {
        log("SKIP", `${link} (exists, use --force)`);
        return;
      }
      fs.renameSync(link, link + ".bak");
      log("BACKUP", `${link} → ${link}.bak`);
    }
  }
  fs.symlinkSync(target, link);
  log("LINK", `${link} → ${target}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (flags.uninstall) {
  uninstall();
} else if (flags.init) {
  initProject();
} else {
  install();
}
