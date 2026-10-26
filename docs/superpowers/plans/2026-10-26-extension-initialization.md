# Real Job Extension Initialization Plan

> **For agentic workers:** Use subagent-driven-development for the bounded tasks below. User approved the v0.2 design and explicitly requested project initialization; execute this scaffold in the current repository.

**Goal:** A buildable Chrome MV3 extension with a side panel, working local API-key settings, official application links and a secure foundation for later analysis integration.

**Architecture:** WXT + Vue 3 + TypeScript. No backend, account system, billing, analytics or cloud synchronization. This initialization does not implement paid API calls, BOSS scraping, enterprise ratings or resume matching.

**Tech Stack:** Node 22.13+, npm, WXT 0.21, Vue 3, TypeScript, Vitest, ESLint.

**Spec:** ../../01-product-requirements.md and ../../02-technical-feasibility.md (v0.2).

## Global Constraints

- Free extension; users obtain official credentials independently.
- Key lives only in Chrome session/local storage with TRUSTED_CONTEXTS protection; never sync, logs, URLs, reports or page scripts.
- Default session mode, explicit persistent save, replace/delete removes stale copy in other storage area.
- No real network requests or credentials in this task. LingDT gateway remains unresolved and its configuration/calls are visibly unavailable.
- Permissions only sidePanel and storage for this foundation. No content scripts, BOSS host access or broad network permissions.
- Keep existing requirements/research intact; work on codex/initialize-extension in the current checkout to keep the uncommitted approved documents available. Do not publish, push or commit automatically.
- User authorization covers initialization; routine framework and layout choices are settled here without another approval loop.

## Review Focus

- Storage access-control failure must fail closed and not write secrets (Task 2).
- Changing session/local mode must remove the other stored copy; deletion removes both (Task 2).
- Provider mismatch/invalid secret must fail before writing; metadata never reveals the complete secret (Task 2).
- Ordinary web preview without extension APIs must report unsupported environment rather than pretend to persist credentials (Task 1).
- UI must distinguish the scaffold from functioning AI analysis and must not fabricate a company grade (Task 1).

## Task 1: Buildable extension and usable starter UI

Owner: scaffold/UI worker. Files: package.json, lockfile, WXT/TS/lint/test configuration, .gitignore, entrypoints/**, src/styles/**, public/**. No edits to src/core/** or tests/**.

- [x] Verify WXT official entrypoint/config documentation, set Node requirements and stable npm scripts: dev, build, zip, typecheck, lint, test, check.
- [x] Build MV3 action-to-sidepanel wiring and options page, without network/content permissions.
- [x] Create Chinese sidepanel empty state, company input, API readiness and settings navigation; show that analysis is not connected, do not emit ratings.
- [x] Implement settings with official links, session/local save/delete, masked status, accessible password inputs and errors, disabled LingDT card while gateway unknown.
- [x] Integrate Task 2 interface. All saved inputs clear immediately after success; never fill full persisted Key back into DOM.
- [x] Run typecheck/build and inspect generated manifest. GUI verified by parent after integration.

## Task 2: Credential storage and provider contracts

Owner: core worker. Files: src/core/** and tests/** only.

Produces: providerId = 'deepseek' | 'lingdt'; storageMode = 'session' | 'local'; createKeyStore(storage) with save(providerId,key,mode), remove(providerId), getStatus(providerId). getStatus returns only {configured:boolean,mode:StorageMode|null,maskedKey:string|null}. Export Chrome adapter getKeyStore() for UI, initialized lazily. Provider registry holds official signup/key/docs links and runtimeReady=false for all API adapters (not yet integrated); LingDT endpoint null. No fetch implementation in scaffold.

- [x] Write behavior tests using an in-memory Chrome-storage port: access-control failure, empty/control-character credentials, unknown provider, save/mode change/delete, masked metadata and storage exceptions. Verify meaningful red before implementation.
- [x] Implement minimal typed storage adapter. Access restrictions succeed before reading/writing secrets; no sync. Serialize local mutations in the store and avoid stale full Key state in UI.
- [x] Add typed company/report/task contracts for future integration without pretending a durable job engine exists.
- [x] Run tests, report output and boundaries.

## Task 3: Integration, documentation and independent review

Owner: parent and independent reviewer. Files: README.md, PRODUCT.md, DESIGN.md, this plan and necessary integration fixes.

- [x] Install dependencies, record npm lock, run full check and production build/zip.
- [x] Validate actual extension manifest has only required permissions and packaged local resources.
- [x] Inspect sidepanel and settings at narrow/wide widths; test actual unpacked extension if available, otherwise disclose exact GUI/runtime limitation.
- [x] README covers Node, install/dev/build, Chrome load-unpacked path, manual smoke checks and implemented versus deferred features.
- [x] Independent review of key boundaries, UI and build evidence; fix material findings and rerun affected checks.

## Progress

- Plan created after v0.2 design approval. Existing project has only LICENSE and uncommitted approved docs; no baseline application/tests to run.

## Completion evidence

- npm run check: TypeScript + ESLint + 28 Vitest tests passed (2 test files). npm run zip builds production and creates .output/real-job-0.1.0-chrome.zip.
- Manifest inspected: MV3, Chrome116+, permissions storage/sidePanel only; local background/options/sidepanel/assets; no content scripts or host permissions.
- Sidepanel at360px and options at360px/1024px visually inspected; ordinary webpage preview disables credential actions. Mechanical design detector returned no findings.
- Production UI exercised against a synthetic Chrome storage port: corrupted-record recovery, session save, local migration, input clearing and deletion passed. No real credential or API request used.
- Independent reviewer reported one P2 (delete disabled on corrupt storage); fixed and re-reviewed with no remaining P1/P2.
- Runtime limitation: ego-browser tooling cannot load an unpacked extension through Extensions.loadUnpacked. Native Chrome extension storage permissions and cross-window Web Locks were not live-verified. README contains manual load/smoke instructions. This does not block delivering the requested initialization, but is required before distributing it with real credentials.
- No commit, push or publication performed.
