# divs CDN Distribution Files

This directory contains bundled versions of all divs components ready for CDN hosting.

## Directory Structure

Each component has its own folder with versioned releases:

```
dist/
├── marquee/
│   ├── latest/              # Development builds (DO NOT use in production)
│   ├── v1.0.0-beta/         # Stable release version
│   └── v1.0.1/              # Newer stable release version
└── [other components]/
    ├── latest/
    └── v{version}/
```

## Understanding the Folders

### latest/ Folder (Development Only)

- **Purpose:** Testing and development
- **Updates:** Changes with every build during development
- **Stability:** Unstable, may have bugs
- **Use:** Internal testing only

**Users should NEVER load from latest/ in production.**

### Versioned Folders (v1.0.0, v1.0.1, etc.)

- **Purpose:** Stable releases for users
- **Updates:** Never changes once created
- **Stability:** Tested and stable
- **Use:** Production websites

**Users should ALWAYS load from versioned folders.**

## Available Files Per Component

Each version folder contains 4 files:

### Main Library

- `{component}.js` - Unminified (for debugging)
- `{component}.min.js` - Minified (for production)

### Diagnostics (Optional)

- `{component}-diagnostics.js` - Unminified debugging tool
- `{component}-diagnostics.min.js` - Minified debugging tool

## Example: Marquee Component

```
dist/marquee/
├── latest/
│   ├── marquee.js
│   ├── marquee.min.js
│   ├── marquee-diagnostics.js
│   └── marquee-diagnostics.min.js
└── v1.0.0-beta/
    ├── marquee.js
    ├── marquee.min.js
    ├── marquee-diagnostics.js
    └── marquee-diagnostics.min.js
```

## Usage Examples

### For Testing (Development)

```html
<script src="https://divs-cdn.idreezus.com/marquee/latest/marquee.min.js"></script>
```

Use this URL only for local testing, never on a live website.

### For Production (Users)

```html
<!-- Load dependencies first -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>

<!-- Load stable component version -->
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-beta/marquee.min.js"></script>
```

This URL is stable and will never change.

## Versioning

Each component versions independently:

- Marquee may be at v1.2.5
- Accordion may be at v3.0.0
- Another component may be at v0.5.0-beta

This is normal and expected in a monorepo.

## Building

This folder is auto-generated. Do not edit files directly.

To rebuild:

```bash
# Development build (updates latest/ only)
pnpm build:marquee

# Release build (creates versioned folder)
pnpm release:marquee
```

See the root [VERSIONING.md](../VERSIONING.md) for complete workflow.

## Deployment

Upload this entire `dist/` folder to your CDN provider (Cloudflare Pages, etc.)

The URL structure will be:

```
https://divs-cdn.idreezus.com/{component}/{version}/{file}
```

See [DEPLOYMENT.md](../DEPLOYMENT.md) for deployment instructions.

## Important Rules

1. **Never delete version folders** - Users depend on them
2. **Never edit dist/ files directly** - Always rebuild from source
3. **Never use latest/ in production** - It's for testing only
4. **Always load from versioned URLs** - They're stable and tested

## Questions?

See the main documentation:

- [VERSIONING.md](../VERSIONING.md) - How versioning works
- [DEPLOYMENT.md](../DEPLOYMENT.md) - How to deploy
- [README.md](../README.md) - Project overview
