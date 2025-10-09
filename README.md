# divs

A collection of platform-agnostic component libraries designed for modern web development, particularly useful for Webflow users and other no-code platforms.

## Monorepo Structure

This is a pnpm workspace monorepo. Each component lives in its own package under `packages/`:

```
divs/
├── packages/
│   ├── marquee/          - Seamless marquee animation library
│   └── [future components...]
└── dist/
    ├── marquee/          - Built files for CDN delivery
    │   ├── latest/       - Development builds (for testing)
    │   └── v1.0.0-beta/  - Release builds (for users)
    └── [future components...]
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm (install with `npm install -g pnpm`)

### Installation

```bash
pnpm install
```

This installs all dependencies and links the workspace packages.

## Building Components

### Development Builds (Daily Work)

Use these commands while developing and testing:

```bash
# Build marquee (updates latest/ folder only)
pnpm build:marquee

# Watch mode - auto-rebuilds on file changes
pnpm dev:marquee

# Build all components
pnpm build
```

These update only the `latest/` folder - perfect for rapid iteration and testing.

### Release Builds (Publishing to Users)

When you're ready to publish a stable version:

1. Update the version in `packages/marquee/package.json`
2. Run the release command:

```bash
# Release marquee (creates versioned folder + updates latest/)
pnpm release:marquee

# Release all components
pnpm release
```

This creates a versioned folder (like `v1.0.1/`) that users can safely load.

**See [VERSIONING.md](./VERSIONING.md) for detailed versioning workflow and best practices.**

## Components

### Marquee

A seamless marquee animation library powered by GSAP. See `packages/marquee/docs/` for documentation.

**Development URL (testing only):**

```html
<script src="https://divs-cdn.idreezus.com/marquee/latest/marquee.min.js"></script>
```

**Production URL (for users):**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-beta/marquee.min.js"></script>
```

## Adding New Components

1. Create a new package directory:

   ```bash
   mkdir -p packages/your-component
   ```

2. Copy the structure from marquee (package.json, rollup.config.js, src/)

3. Update the component name in package.json

4. Add build scripts to root `package.json`:

   ```json
   "build:your-component": "pnpm --filter your-component build",
   "dev:your-component": "pnpm --filter your-component build:watch",
   "release:your-component": "pnpm --filter your-component release"
   ```

5. Build and release:
   ```bash
   pnpm build:your-component     # Development
   pnpm release:your-component   # Production
   ```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## Key Concepts

- **latest/ folder** - For testing and development, changes frequently
- **Versioned folders (v1.0.0/)** - For users, frozen and stable
- **Development builds** - Fast, only update latest/
- **Release builds** - Create versioned folders for users

Read [VERSIONING.md](./VERSIONING.md) to understand the versioning workflow.

## Deployment

Built files in `dist/` are ready for CDN deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## Documentation

- [VERSIONING.md](./VERSIONING.md) - How versioning and releases work
- [DEPLOYMENT.md](./DEPLOYMENT.md) - How to deploy to CDN
- Component-specific docs are in `packages/{component}/docs/`

## License

Apache-2.0

## Author

Idrees Isse (https://github.com/idreezus)
