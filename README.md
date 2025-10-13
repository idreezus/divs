# divs

Component libraries for modern web development. Built for Webflow and other no-code platforms.

## What is this?

This is a monorepo containing multiple components. Each component:

- Lives in `packages/`
- Builds to `dist/` for CDN hosting
- Versions independently

**Current components:**

- **marquee** - Seamless infinite scrolling

## Quick Start

### Install dependencies

```bash
pnpm install
```

If you don't have pnpm: `npm install -g pnpm`

## Build commands

### While developing

```bash
# Watch mode - auto-rebuilds on save
pnpm dev:marquee

# Single build
pnpm build:marquee
```

This updates `dist/marquee/latest/` for testing.

### When publishing

1. Update version in `packages/marquee/package.json`
2. Run release:

```bash
pnpm release:marquee
```

This creates `dist/marquee/v1.0.1/` for users.

See [VERSIONING.md](./VERSIONING.md) for the full workflow.

## Components

### Marquee

Seamless infinite scrolling. Powered by GSAP. Docs in `packages/marquee/docs/`.

**How users load it:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-beta/marquee.min.js"></script>
```

## Key concepts

- `latest/` - Development builds, for testing only
- `v1.0.0/` - Release builds, frozen and stable for users
- Each component versions independently

## Adding new components

1. Copy `packages/marquee/` structure to `packages/your-component/`
2. Update `package.json` with new component name
3. Add build scripts to root `package.json`:

```json
"build:your-component": "pnpm --filter your-component build",
"dev:your-component": "pnpm --filter your-component build:watch",
"release:your-component": "pnpm --filter your-component release"
```

4. Build: `pnpm dev:your-component`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment steps.

## More docs

- [GETTING-STARTED.md](./GETTING-STARTED.md) - First-time setup guide
- [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Command cheat sheet
- [VERSIONING.md](./VERSIONING.md) - Versioning workflow
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to CDN

## License

Apache-2.0
