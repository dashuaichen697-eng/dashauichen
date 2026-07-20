# AI Project Isolation Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Safely split the mixed AI application workspace into three independently governed products and add enforceable preflight, documentation, deployment, and inventory controls.

**Architecture:** Preserve the current repository as a migration source and create three sibling product directories with independent Git metadata. Each product owns its source, dependencies, environment contract, Vercel link, and documentation; a parent-level registry and read-only preflight command verify the one-product/one-repository/one-deployment mapping.

**Tech Stack:** Git, GitHub CLI, Vercel CLI, Bash, Node.js, React/Vite, Next.js, Markdown.

## Global Constraints

- Never delete or overwrite the current uncommitted migration-source files.
- Use `michael-<product-slug>` for directory, package, GitHub Repository, and Vercel Project names.
- One GitHub Repository maps to exactly one Vercel Project and one production domain.
- Each project owns an independent `.env.example`; never copy real secret values.
- Run `npm run build` before any production deployment.
- Stop product development whenever repository or Vercel identity does not match the project manifest.
- Do not change unrelated product behavior during the migration.

---

### Task 1: Build and Test the Governance Preflight

**Files:**
- Create: `governance/project-contract.example.env`
- Create: `governance/preflight.sh`
- Create: `governance/tests/preflight.test.sh`
- Create: `PROJECTS.md`

**Interfaces:**
- Consumes: project directory metadata, `package.json`, Git `origin`, `.vercel/project.json`.
- Produces: `governance/preflight.sh <project-directory> [development|preview|production]`, returning zero only when required identity checks pass.

- [ ] **Step 1: Write failing shell tests**

Create fixtures in a temporary directory for a valid project, a mismatched package name, a mismatched Git remote, and a mismatched Vercel project. Assert the valid fixture exits `0` and each mismatch exits non-zero without printing environment values.

- [ ] **Step 2: Run the tests and verify RED**

Run: `bash governance/tests/preflight.test.sh`

Expected: FAIL because `governance/preflight.sh` does not exist.

- [ ] **Step 3: Implement the minimal preflight**

The script reads `.project-contract.env`, checks required directories/files, package name, Git remote repository basename, Vercel `projectName`, and deployment environment. It prints only names and PASS/FAIL results.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `bash governance/tests/preflight.test.sh`

Expected: all preflight cases pass.

- [ ] **Step 5: Create the project registry**

Initialize the three required products with purpose, intended GitHub/Vercel/domain identity, and `迁移中` status. Unknown live URLs must be explicitly labeled `待创建` rather than invented.

- [ ] **Step 6: Commit the governance controls**

```bash
git add governance PROJECTS.md
git commit -m "chore: add project isolation preflight"
```

### Task 2: Extract `michael-life-rpg`

**Files:**
- Create: `michael-life-rpg/` from the RPG-owned root application files.
- Create: `michael-life-rpg/.project-contract.env`
- Create: `michael-life-rpg/.env.example`
- Create: `michael-life-rpg/deployment.md`
- Create: `michael-life-rpg/changelog.md`
- Modify: `michael-life-rpg/package.json`
- Modify: `michael-life-rpg/README.md`

**Interfaces:**
- Consumes: current root RPG pages, shared RPG components/hooks/utilities, Vite configuration, and RPG static assets.
- Produces: an independent Vite project named `michael-life-rpg` with no carton-mark, packing-list, logistics, or CRM routes.

- [ ] **Step 1: Copy the migration source without deleting it**

Use `rsync` with an explicit include list for RPG-owned files. Exclude `.git`, `.vercel`, `node_modules`, build outputs, CRM directories, logistics release packages, and carton/packing-list modules.

- [ ] **Step 2: Add the required project structure and docs**

Write the package identity, environment example, deployment record, changelog, and project contract. README must include introduction, features, local run, deployment, and environment variables.

- [ ] **Step 3: Initialize and verify the isolated repository**

```bash
git -C michael-life-rpg init -b main
bash governance/preflight.sh michael-life-rpg development
npm --prefix michael-life-rpg install
npm --prefix michael-life-rpg run lint
npm --prefix michael-life-rpg run test
npm --prefix michael-life-rpg run build
```

Expected: preflight reports only missing remote/Vercel as not-yet-connected states during local migration; lint, test, and build exit `0`.

- [ ] **Step 4: Commit only the RPG project**

```bash
git -C michael-life-rpg add .
git -C michael-life-rpg commit -m "chore: initialize isolated life RPG"
```

### Task 3: Extract `michael-box-label-generator`

**Files:**
- Create: `michael-box-label-generator/` from carton-mark owned modules and static assets.
- Create: `michael-box-label-generator/src/`
- Create: `michael-box-label-generator/public/`
- Create: `michael-box-label-generator/package.json`
- Create: `michael-box-label-generator/README.md`
- Create: `michael-box-label-generator/.env.example`
- Create: `michael-box-label-generator/deployment.md`
- Create: `michael-box-label-generator/changelog.md`
- Create: `michael-box-label-generator/.project-contract.env`

**Interfaces:**
- Consumes: `CartonMarkTool`, carton-mark utilities/tests, and only the assets required by that feature.
- Produces: an independent Vite application named `michael-box-label-generator`; it contains no RPG state, packing-list workflow, or CRM code.

- [ ] **Step 1: Write an isolation test**

Add a Node test that confirms the standalone entry renders the carton-mark application and that the source tree does not import RPG, packing-list, or CRM modules.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm --prefix michael-box-label-generator test`

Expected: FAIL because the standalone entry has not been created.

- [ ] **Step 3: Copy the carton-mark modules and create the minimal app shell**

Reuse the working carton-mark implementation and its existing tests. Create only the Vite entry, styles, manifest, and configuration needed to run the feature independently.

- [ ] **Step 4: Add governance documentation and validate**

```bash
bash governance/preflight.sh michael-box-label-generator development
npm --prefix michael-box-label-generator install
npm --prefix michael-box-label-generator run lint
npm --prefix michael-box-label-generator run test
npm --prefix michael-box-label-generator run build
```

Expected: isolation test and existing carton-mark tests pass; build exits `0`.

- [ ] **Step 5: Initialize and commit the independent repository**

```bash
git -C michael-box-label-generator init -b main
git -C michael-box-label-generator add .
git -C michael-box-label-generator commit -m "chore: initialize isolated box label generator"
```

### Task 4: Extract `michael-brazil-crm`

**Files:**
- Create: `michael-brazil-crm/` from `brazil-logistics-partner-system/`.
- Create: `michael-brazil-crm/src/README.md`
- Create: `michael-brazil-crm/deployment.md`
- Create: `michael-brazil-crm/changelog.md`
- Create: `michael-brazil-crm/.project-contract.env`
- Modify: `michael-brazil-crm/package.json`
- Modify: `michael-brazil-crm/README.md`
- Modify: `michael-brazil-crm/.env.example`

**Interfaces:**
- Consumes: the existing Next.js CRM application, Supabase schema/setup docs, and CRM-specific deployment configuration.
- Produces: an independent Next.js project named `michael-brazil-crm`; no RPG or box-label assets are included.

- [ ] **Step 1: Copy the CRM source without build/cache/secrets**

Use `rsync` excluding `.git`, `.vercel`, `.next`, `node_modules`, `.env`, logs, and test output. Preserve application code, public assets, SQL, and documentation.

- [ ] **Step 2: Normalize identity and required docs**

Change the package/project identity without changing CRM behavior. Preserve framework-standard `app/` and add `src/README.md` explaining the layout.

- [ ] **Step 3: Initialize and validate**

```bash
git -C michael-brazil-crm init -b main
bash governance/preflight.sh michael-brazil-crm development
npm --prefix michael-brazil-crm install
npm --prefix michael-brazil-crm run lint
npm --prefix michael-brazil-crm run build
```

Expected: lint and build exit `0` without requiring production secrets; mock fallback remains available.

- [ ] **Step 4: Commit the independent CRM repository**

```bash
git -C michael-brazil-crm add .
git -C michael-brazil-crm commit -m "chore: initialize isolated Brazil CRM"
```

### Task 5: Create GitHub and Vercel Resources

**Files:**
- Modify: each project's `.project-contract.env`
- Modify: each project's `deployment.md`
- Modify: `PROJECTS.md`

**Interfaces:**
- Consumes: authenticated `gh` and Vercel sessions, the three verified local repositories.
- Produces: three GitHub repositories, three Vercel projects, and three independently verified production URLs.

- [ ] **Step 1: Verify authentication without exposing tokens**

```bash
gh auth status
npx vercel whoami
```

If either session is unavailable, stop only the affected remote operation and mark it `待授权`; keep local results intact.

- [ ] **Step 2: Create or connect GitHub repositories**

For each product, first query whether the exact repository exists. Create it only when absent, add the matching `origin`, and push `main`. Never reuse `dashauichen` as an origin.

- [ ] **Step 3: Create or connect Vercel projects**

For each product, query the exact project name before creation, link only its own directory, and confirm `.vercel/project.json` matches the contract. Configure secrets separately; do not copy secret values between projects.

- [ ] **Step 4: Preview and production verification**

Run preflight, lint/test/build, deploy preview, verify product identity, then deploy production. Record HTTP status, page title/product marker, Vercel project, Git commit, and final domain.

- [ ] **Step 5: Update registry and deployment records**

Replace `待创建` only with verified URLs. Set status to `已上线` only when remote, build, deployment, and domain checks all pass; otherwise state the precise remaining blocker.

### Task 6: Final Isolation Audit

**Files:**
- Modify: `PROJECTS.md`

**Interfaces:**
- Consumes: all three project contracts and live deployment evidence.
- Produces: a final evidence table and frozen-source decision.

- [ ] **Step 1: Run every preflight and build gate**

```bash
bash governance/preflight.sh michael-life-rpg production
bash governance/preflight.sh michael-box-label-generator production
bash governance/preflight.sh michael-brazil-crm production
```

Repeat each project's lint, test where present, and build commands.

- [ ] **Step 2: Verify repository and deployment uniqueness**

Confirm the three origin URLs, Vercel project IDs, and production domains are pairwise distinct.

- [ ] **Step 3: Verify live product identity**

Request each production domain and confirm HTTP success plus the correct product marker. A redirect is acceptable only when its final URL belongs to the same project.

- [ ] **Step 4: Record the source repository disposition**

After all new production paths pass, mark `dashauichen` as `冻结迁移源`. Do not delete it or rewrite its history in this task.

- [ ] **Step 5: Report verified results and external blockers**

Separate completed local work, verified remote work, and user-owned follow-ups. Do not claim creation, binding, or deployment without fresh command evidence.
