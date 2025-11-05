<p align="center">
  <img src="./assets/logo.png" alt="Codekeeper Logo" width="140" />
</p>

<h1 align="center">Codekeeper</h1>

<p align="center">
  <b>Automatic refactoring + documentation for your codebase.</b><br />
  Watches your repo, updates docs, performs safe refactors, and opens PRs — so you don't have to.
</p>

<p align="center">
  <a href="https://github.com/faizm10/code-keeper/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/faizm10/code-keeper/ci.yml?label=build&style=for-the-badge" alt="Build Status" />
  </a>
  <a href="https://github.com/faizm10/code-keeper/issues">
    <img src="https://img.shields.io/github/issues/faizm10/code-keeper?style=for-the-badge" alt="Open Issues" />
  </a>
  <a href="https://github.com/faizm10/code-keeper/stargazers">
    <img src="https://img.shields.io/github/stars/faizm10/code-keeper?style=for-the-badge" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/faizm10/code-keeper/pulls">
    <img src="https://img.shields.io/github/issues-pr/faizm10/code-keeper?style=for-the-badge" alt="Open PRs" />
  </a>
</p>

---

## ✅ What It Does (Simple)

Whenever you push code, Codekeeper will:

- Detect what changed  
- Update docs (README, API reference, changelog)  
- Optionally perform safe refactors (rename, move files)  
- Run tests to ensure nothing broke  
- Open a pull request with the changes  

No commits directly to main — everything is via PR.

> Think of it like a junior dev that maintains your project automatically.

---

## ✨ Why?

Most repos suffer from:
- Out-of-date docs
- Inconsistent folder structure
- Awkward renames
- Forgotten change logs
- Messy / drifting architecture

Codekeeper keeps your documentation and architecture aligned with your codebase **in real-time**.

---

## 🔧 High-Level Architecture

1. GitHub App receives push / PR events  
2. Analyzer inspects changed code (API surface, exports)  
3. Docs engine updates reference + markdown files  
4. Refactor engine applies safe codemods (AST-driven)  
5. Test runner executes existing tests  
6. PR bot opens a pull request with a summary + checklist  

Everything is containerized with Docker.

---

## 🚧 MVP Features

- GitHub webhook listener  
- Detect changed exported functions/classes  
- Update README + simple API reference  
- Auto-create CHANGELOG entries  
- Safe codemod example (rename symbol + fix imports)  
- Create PR with generated changes  
- Optional: run tests before PR

---

## 📦 Tech Stack

| Area | Tech |
|------|------|
| Core | TypeScript |
| Webhook API | NestJS / Express |
| Git Integration | GitHub App + Octokit |
| Code Analysis | ts-morph |
| Codemods | ts-morph / jscodeshift |
| Doc Generation | TypeDoc + remark |
| Queue (planned) | NATS / Redis |
| Storage (planned) | Postgres + MinIO |
| Containerization | Docker |

---

## 🗂 Planned Structure

```

/apps
gateway/         ← webhook handler
analyzer/        ← code + API change detection
docgen/          ← README / changelog generator
codemods/        ← safe refactor actions
pr-bot/          ← creates PRs

````

---

## 🚀 Getting Started

1. Clone the repo  
2. Install deps

```bash
pnpm install
```

3. Copy example env and fill GitHub App keys
4. Run the service

```bash
pnpm dev
```

> Full onboarding docs coming soon.

---

## 🧭 Roadmap

* Python + Go language support
* More refactor recipes (dead code, file reorgs, layered structure)
* Architecture ADR updates
* Dashboard UI to view health + diffs
* CI integration
* Multi-repo org-level control
