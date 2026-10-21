---
name: Git & Release Workflow SOP
description: Standard operating procedures for committing changes and performing release version bumps in the EasyInterview extension.
---

# Git & Release Workflow SOP — EasyInterview : AI Interview Assistant

This skill guides any agent on standard commit workflows and strict release version bumps.

---

## 1. Standard Commit Workflow (Commit Biasa)

Use this workflow for normal development tasks (new features, bug fixes, refactoring, documentation).

### Step 1: Pre-Commit Build Check
Always run and ensure **0 errors**:
```bash
npm run build
```
*(Runs `tsc --noEmit` and `vite build`).*

### Step 2: Check Sensitive Files
Always verify `git status`:
- Ensure user private documents (`*.pdf`, `*.docx`) and private keys are never staged.
- Only stage files relevant to the current task.

### Step 3: Conventional Commit Message
- `feat(...)`: New features
- `fix(...)`: Bug fixes
- `refactor(...)`: Code refactoring without behavior change
- `docs(...)`: Documentation updates
- `chore(...)`: Dependency or config updates

### Step 4: Execute
```bash
git add <target-files>
git commit -m "<type>(<scope>): <short description>"
git push origin main # (when requested by user)
```

---

## 2. Release Version Bump Workflow (Up Version)

Triggered whenever the user says **"up version"**, **"naikkan versi"**, or requests a new release.

### Step 1: Update 4 Mandatory Files Simultaneously
Update the version string across all 4 files:
1. `package.json`: `"version": "x.y.z"`
2. `public/manifest.json`: `"version": "x.y.z"`
3. `src/lib/i18n.ts`: `version: 'vx.y.z'` (Both in `en` and `id` dictionary objects)
4. `package-lock.json`: Synchronize lockfile via:
   ```bash
   npm install --package-lock-only
   ```

### Step 2: Compulsory Local Build Validation
```bash
npm run build
```
Ensure **0 errors** before staging any release files.

### Step 3: Exact Commit & Push Command
```bash
git add package.json package-lock.json public/manifest.json src/lib/i18n.ts
git commit -m "chore: bump version to vx.y.z"
git push origin main
```

### Step 4: Automated CI/CD
Pushing to `main` with a bumped version in `package.json` triggers `.github/workflows/release.yml`, creating a GitHub Release tagged `vx.y.z` and producing:
- `ai-interview-assistant-vx.y.z.zip`
- `ai-interview-assistant-latest.zip`
