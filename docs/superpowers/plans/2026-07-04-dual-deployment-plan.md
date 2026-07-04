# Dual Deployment (Vercel & GitHub Pages) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore deployment to GitHub Pages while keeping Vercel deployment, supporting clean URLs and SPAs on both.

**Architecture:** Use `process.env.GITHUB_ACTIONS` to set Vite `base` and PWA options dynamically, dynamically resolve the basename in React Router via `import.meta.env.BASE_URL`, and copy `index.html` to `404.html` on GitHub Pages to handle client-side routing fallback.

**Tech Stack:** React, Vite, React Router DOM, Vite PWA Plugin, GitHub Actions.

---

### Task 1: Dynamic Vite Configuration

**Files:**
- Modify: `vite.config.js`

- [ ] **Step 1: Modify `vite.config.js`**
  Open [vite.config.js](file:///Users/yonig/Desktop/projects/Ozora-2026/vite.config.js) and update the `base` and PWA `scope` / `start_url` properties to dynamically resolve depending on the `process.env.GITHUB_ACTIONS` environment variable.

  Replace:
  ```javascript
        scope: '/',
        start_url: '/',
  ```
  With:
  ```javascript
        scope: process.env.GITHUB_ACTIONS === 'true' ? '/ozora-2026/' : '/',
        start_url: process.env.GITHUB_ACTIONS === 'true' ? '/ozora-2026/' : '/',
  ```

  And replace:
  ```javascript
    base: '/',
  ```
  With:
  ```javascript
    base: process.env.GITHUB_ACTIONS === 'true' ? '/ozora-2026/' : '/',
  ```

- [ ] **Step 2: Run PWA test to verify configuration is still valid**
  Run: `npm run test`
  Expected: All tests pass.

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add vite.config.js
  git commit -m "config: resolve Vite base and PWA scope dynamically for dual deployment"
  ```

---

### Task 2: Dynamic Router Basename

**Files:**
- Modify: `src/router.jsx`

- [ ] **Step 1: Modify `src/router.jsx`**
  Open [router.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/router.jsx) and define `basename` dynamically using Vite's `import.meta.env.BASE_URL`, stripping the trailing slash if it is not `/`.

  Replace:
  ```javascript
  export const router = createBrowserRouter(routes);
  ```
  With:
  ```javascript
  const base = import.meta.env.BASE_URL;
  const basename = base === '/' ? '/' : base.replace(/\/$/, '');

  export const router = createBrowserRouter(routes, { basename });
  ```

- [ ] **Step 2: Run tests to verify router modification**
  Run: `npm run test`
  Expected: All tests pass.

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add src/router.jsx
  git commit -m "feat: set router basename dynamically based on Vite base URL"
  ```

---

### Task 3: Restore GitHub Actions Workflow with 404 Fallback

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**
  Create the folder `.github/workflows/` if it doesn't exist, and create [deploy.yml](file:///Users/yonig/Desktop/projects/Ozora-2026/.github/workflows/deploy.yml) with the following content:

  ```yaml
  name: Deploy to GitHub Pages

  on:
    push:
      branches: [main]
    workflow_dispatch:

  permissions:
    contents: read
    pages: write
    id-token: write

  concurrency:
    group: pages
    cancel-in-progress: false

  jobs:
    build-and-deploy:
      runs-on: ubuntu-latest
      environment:
        name: github-pages
        url: ${{ steps.deployment.outputs.page_url }}
      steps:
        - uses: actions/checkout@v4

        - uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: npm

        - run: npm ci
        - run: npm run build
        
        # SPA 404 Fallback routing for GitHub Pages
        - run: cp dist/index.html dist/404.html

        - uses: actions/configure-pages@v5

        - uses: actions/upload-pages-artifact@v3
          with:
            path: dist

        - id: deployment
          uses: actions/deploy-pages@v4
  ```

- [ ] **Step 2: Test building locally**
  Run: `npm run build`
  Expected: The build completes successfully and produces the `dist/` directory.

- [ ] **Step 3: Verify the SPA 404 fallback mechanism locally**
  Run: `cp dist/index.html dist/404.html && ls -la dist/404.html`
  Expected: `dist/404.html` exists and is identical to `dist/index.html`.

- [ ] **Step 4: Commit changes**
  Run:
  ```bash
  git add .github/workflows/deploy.yml
  git commit -m "ci: restore GitHub Pages deployment workflow with 404 fallback"
  ```
