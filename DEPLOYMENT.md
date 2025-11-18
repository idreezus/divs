# Deployment Guide

Deployment process for components to the CDN. Cloudflare Pages is configured to auto-deploy when changes are merged to main.

## Overview

JavaScript files are created for users to load in Webflow and other platforms via `<script>` tags. This guide covers development and production workflows.

## What Gets Built

Each component creates 4 files:

```
dist/marquee/v1.0.1/
├── marquee.js                  # Unminified
├── marquee.min.js             # Minified (production)
├── marquee-diagnostics.js     # Debug tool (unminified)
└── marquee-diagnostics.min.js # Debug tool (minified)
```

## Development Workflow

**For testing and previewing features:**

1. Create or checkout feature branch: `git checkout -b feature/new-thing`
2. Run `pnpm dev:marquee` locally to test changes
3. When feature is ready, merge to main: `git checkout main && git merge feature/new-thing && git push`
4. Cloudflare automatically builds and deploys → updates `dist/marquee/latest/`

**Use `/latest/` for:**

- Testing unreleased features
- Beta and preview versions
- Internal testing before production release

**Example URL:**

```html
<script src="https://divs-cdn.idreezus.com/marquee/latest/marquee.min.js"></script>
```

**Note:** `/latest/` changes frequently. This URL should not be provided to users for production sites.

## Production Workflow

**To release a stable version:**

### Step 1: Update Version (Mandatory)

Edit `packages/marquee/package.json`:

```json
{
  "version": "1.0.1"
}
```

Semantic versioning guidelines:

- **Patch** (1.0.1) - Bug fixes
- **Minor** (1.1.0) - New features
- **Major** (2.0.0) - Breaking changes

### Step 2: Build and push release

1. Generate the new `dist` folders locally so they can be committed:

```bash
pnpm release:marquee
```

2. Make a **single commit** that includes the `package.json` bump and the new `dist/marquee/v1.0.1/` folder, then push to `main`:

```bash
git add packages/marquee/package.json dist/marquee/v1.0.1
git commit -m "Release marquee v1.0.1"
git push origin main
```

Cloudflare automatically:

1. Runs `pnpm install && pnpm release`
2. Creates/updates `dist/marquee/v1.0.1/` on the CDN
3. Refreshes `dist/marquee/latest/`

Versioned files are then live at:

```html
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.1/marquee.min.js"></script>
```

**Complete.** This URL is frozen permanently and remains accessible for production use.

### Step 3: GitHub Releases (Optional)

**Only required when using jsDelivr CDN instead of Cloudflare.**

Create a GitHub release with a tag on the same commit you pushed in Step 2:

```bash
# Create and push tag
git tag marquee-v1.0.1
git push origin marquee-v1.0.1

# Or create release via GitHub UI
# Tag: marquee-v1.0.1
# Title: Marquee v1.0.1
```

**Tag naming for monorepo:** Use `{component}-v{version}` format (e.g., `marquee-v1.0.1`, `accordion-v2.0.0`)

**Why jsDelivr?**

- Global CDN alternative to Cloudflare
- Works directly from GitHub releases
- No need to manage separate CDN hosting

**jsDelivr URL format:**

```html
<script src="https://cdn.jsdelivr.net/gh/{user}/{repo}@{tag}/dist/{component}/{version}/file.js"></script>
<!-- So basically -->
<script src="https://cdn.jsdelivr.net/gh/idreezus/divs@{package-(version-i-e-the-tag-format)}/dist/{package}/{version}/{file}.js"></script>
```

Always include the `@{component}-v{version}` tag segment; without it, jsDelivr serves whatever is currently on the default branch, so a later change to `dist/...` would silently update existing embeds.

**Note:** jsDelivr requires the GitHub tag to exist. Cloudflare functions independently of GitHub tags.

## CDN URL Patterns

### Cloudflare (Default)

```
https://divs-cdn.idreezus.com/{component}/{version}/{file}
```

**Examples:**

```html
<!-- Production -->
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.1/marquee.min.js"></script>

<!-- Testing the latest -->
<script src="https://divs-cdn.idreezus.com/marquee/latest/marquee.min.js"></script>
```

### jsDelivr (Optional Alternative)

```
https://cdn.jsdelivr.net/gh/{username}/{repo}@{component}-{version}/dist/{component}/{version}/{file}
```

**Examples:**

```html
<script src="https://cdn.jsdelivr.net/gh/idreezus/divs@marquee-v0.1.0/dist/marquee/v0.1.0/marquee.min.js"></script>
```

## How Users Load Components

**Marquee example:**

```html
<!-- 1. Load dependencies first -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>

<!-- 2. Load component (use versioned URL for production) -->
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.1/marquee.min.js"></script>

<!-- 3. Optional: Load diagnostics for debugging -->
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.1/marquee-diagnostics.min.js"></script>
```

Available as `window.Marquee` with methods like `Marquee.init()`, `Marquee.get(element)`, etc.

## Working with Multiple Components

When multiple components exist, each receives its own folder with independent versions:

```
dist/
├── marquee/
│   ├── latest/           # Development builds
│   ├── v1.0.0-beta/      # Old release
│   └── v1.2.5/           # Current release
└── accordion/
    ├── latest/
    └── v3.0.0/
```

**To release all components simultaneously:**

1. Update versions in each `packages/{component}/package.json`
2. Merge to main
3. Cloudflare runs `pnpm release` which builds all components

**Example result:**

- `dist/marquee/v1.2.6/`
- `dist/accordion/v3.0.1/`

Both are deployed simultaneously.
