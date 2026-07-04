# Dual Deployment Design Spec (Vercel & GitHub Pages)

This document outlines the design for restoring deployment to GitHub Pages while maintaining the active deployment on Vercel.

## Background
The Ozora 2026 Timetable Companion was migrated to Vercel to support clean URLs via `createBrowserRouter`. During this transition, GitHub Pages configuration (`base: '/ozora-2026/'` and the routing structure) and `.github/workflows/deploy.yml` were removed or changed to root-level `/`.

To support both deployment environments simultaneously, we need a dynamic configuration that automatically detects the target platform during the build.

## Proposed Design

### 1. Dynamic Vite Base & PWA Scope
We will modify [vite.config.js](file:///Users/yonig/Desktop/projects/Ozora-2026/vite.config.js) to dynamically resolve paths depending on whether the build is executed within a GitHub Action.

- **GitHub Pages Build:** Runs inside GitHub Actions (`process.env.GITHUB_ACTIONS === 'true'`). It will use `/ozora-2026/` as the base path, PWA scope, and start URL.
- **Vercel / Local Build:** Runs in Vercel or locally. It will use `/` as the base path, PWA scope, and start URL.

```javascript
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const base = isGithubActions ? '/ozora-2026/' : '/';
```

### 2. Client-side Routing Basename
We will update [router.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/router.jsx) to automatically fetch its `basename` from Vite's `import.meta.env.BASE_URL`:

```javascript
const basename = import.meta.env.BASE_URL;

export const router = createBrowserRouter(routes, {
  basename: basename === '/' ? '/' : basename.replace(/\/$/, '')
});
```

### 3. GitHub Actions Workflow restoration
We will restore [.github/workflows/deploy.yml](file:///Users/yonig/Desktop/projects/Ozora-2026/.github/workflows/deploy.yml) with a step that copies `dist/index.html` to `dist/404.html` so client-side routing is supported on GitHub Pages without breaking on page reload.

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

## Verification Plan

### Automated Verification
- Verify that local tests pass using `npm run test`.
- Validate Vite configuration using a simulation or unit test if possible.

### Manual Verification
- Run a production build locally (`npm run build`) and check the `dist/` outputs.
- Verify that local development works correctly using `npm run dev`.
