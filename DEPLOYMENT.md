# Deployment Guide

This document explains how to build and deploy the divs component library to CDN hosting (e.g., Cloudflare Pages).

## Monorepo Structure

This is a pnpm workspace monorepo containing multiple component libraries. Each component lives in `packages/{component-name}/` and builds to `dist/{component-name}/`.

Current components:

- **marquee** - Seamless marquee animation library

## Understanding Build Modes

There are two types of builds:

### 1. Development Builds (Testing Only)

```bash
pnpm build:marquee
```

- Updates only `dist/marquee/latest/`
- For rapid iteration and testing
- Use this during daily development
- Users should NOT load from `latest/` in production

### 2. Release Builds (For Users)

```bash
pnpm release:marquee
```

- Creates/updates `dist/marquee/v{version}/` (reads version from package.json)
- Also updates `dist/marquee/latest/`
- Use this when ready to publish to users
- Creates a stable, frozen version that users can depend on

**For detailed versioning workflow, see [VERSIONING.md](./VERSIONING.md)**

## What Gets Built

Each component creates 4 files per version:

### Main Library Bundle

- **{component-name}.js** - Unminified version for debugging
- **{component-name}.min.js** - Production-ready minified version

### Diagnostics Bundle (Optional)

- **{component-name}-diagnostics.js** - Developer debugging tool (unminified)
- **{component-name}-diagnostics.min.js** - Minified version

### Example: Marquee Output

```
dist/
└── marquee/
    ├── latest/              # Development builds
    │   ├── marquee.js
    │   ├── marquee.min.js
    │   ├── marquee-diagnostics.js
    │   └── marquee-diagnostics.min.js
    ├── v1.0.0-beta/         # Stable release
    │   └── (same files)
    └── v1.0.1/              # New stable release
        └── (same files)
```

## Development Workflow

### Daily Development

```bash
# Start watch mode (rebuilds on file changes)
pnpm dev:marquee

# Test your changes by loading from latest/
# File: packages/marquee/test.html
# URL: ../../../dist/marquee/latest/marquee.min.js
```

The `latest/` folder updates automatically with each build. Test thoroughly here before releasing.

### Testing Before Release

Before creating a release, ensure:

1. All features work correctly in `latest/`
2. No console errors
3. Test in multiple browsers if possible
4. Run diagnostics if available

## Release Workflow

### Creating a New Release

Follow these steps when ready to publish a new version:

#### 1. Update Version Number

Edit `packages/marquee/package.json`:

```json
{
  "name": "marquee",
  "version": "1.0.1",  // Change this
  ...
}
```

#### 2. Run Release Build

```bash
pnpm release:marquee
```

This creates `dist/marquee/v1.0.1/` with all 4 files.

#### 3. Deploy to CDN

Upload the entire `dist/` folder to your CDN provider (see options below).

#### 4. Announce to Users

Users can now load the new version:

```html
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.1/marquee.min.js"></script>
```

## How Users Load Your Libraries

Users add script tags to their HTML. Example for marquee:

```html
<!-- Load GSAP first (required dependency) -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>

<!-- Load marquee library from your CDN -->
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-beta/marquee.min.js"></script>

<!-- Optional: Load diagnostics for debugging -->
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-beta/marquee-diagnostics.min.js"></script>
```

The library is available as `window.Marquee` with these methods:

- `Marquee.init()` - Initialize all marquees
- `Marquee.get(element)` - Get a specific marquee instance

## CDN URL Structure

Components follow this URL pattern:

```
https://divs-cdn.idreezus.com/{component-name}/{version}/{component-name}.min.js
```

Examples:

- `https://divs-cdn.idreezus.com/marquee/v1.0.0-beta/marquee.min.js` - Stable release
- `https://divs-cdn.idreezus.com/marquee/latest/marquee.min.js` - For testing only
- `https://divs-cdn.idreezus.com/accordion/v1.0.0/accordion.min.js` - Different component

**Important:** Users should always load from versioned URLs (like `v1.0.0`), never from `latest/`.

## Deploying to Cloudflare Pages

### Option 1: Manual Upload

1. Build releases:

   ```bash
   pnpm release
   ```

2. Upload the `dist/` directory to Cloudflare Pages manually

3. Files are available at: `https://divs-cdn.idreezus.com/{component}/{version}/{file}`

### Option 2: Automated Deployment (Recommended)

1. Connect your GitHub repository to Cloudflare Pages

2. Configure build settings:

   - **Build command:** `pnpm install && pnpm release`
   - **Output directory:** `dist`
   - **Root directory:** `/` (leave empty)

3. Set environment variables (if needed):

   - `NODE_VERSION`: `18` or higher

4. Cloudflare automatically rebuilds on each push to main branch

5. Version folders persist across deployments (Cloudflare Pages doesn't delete old files by default)

### Cloudflare Pages Benefits

- Automatic HTTPS
- Global CDN distribution
- Unlimited bandwidth (on paid plans)
- Git integration
- Custom domains

## Versioning Strategy

Each component maintains independent versions:

- **Specific versions** (`v1.0.0-beta/`, `v1.0.1/`) - Frozen, safe for production
- **Latest version** (`latest/`) - Always changing, for testing only

Users who want stability use specific version URLs. These never change, even when you continue developing.

**See [VERSIONING.md](./VERSIONING.md) for complete versioning workflow.**

## Independent Component Versioning

Components version independently. This is normal:

```
dist/
├── marquee/
│   ├── v1.2.5/          # Marquee at version 1.2.5
│   └── latest/
└── accordion/
    ├── v3.0.0/          # Accordion at version 3.0.0
    └── latest/
```

Each component evolves at its own pace.

## Adding New Components

To add a new component to the monorepo:

1. Create `packages/{component-name}/` directory

2. Copy structure from an existing component (like marquee)

3. Update component name in package.json

4. Configure rollup.config.js (should read version dynamically like marquee does)

5. Add scripts to root `package.json`:

   ```json
   {
     "scripts": {
       "build:component-name": "pnpm --filter component-name build",
       "dev:component-name": "pnpm --filter component-name build:watch",
       "release:component-name": "pnpm --filter component-name release"
     }
   }
   ```

6. Develop with `pnpm dev:component-name`

7. Release with `pnpm release:component-name`

Your component will be available at:

```
https://divs-cdn.idreezus.com/{component-name}/v1.0.0/{component-name}.min.js
```

## Build All Components

To build or release multiple components at once:

```bash
# Development builds (updates all latest/ folders)
pnpm build

# Release builds (creates versioned folders for all components)
pnpm release
```

This is useful when you've updated multiple components and want to deploy them together.

## File Sizes

Current sizes (marquee v1.0.0-beta):

- Main library minified: ~16KB
- Diagnostics minified: ~7KB
- Total (with diagnostics): ~23KB

These are reasonable sizes for marketing websites, especially since GSAP is loaded separately.

## Important Notes

1. **External dependencies** - Components expect dependencies (like GSAP) to be loaded globally
2. **No transpilation** - Code uses modern JavaScript (ES6+)
3. **Browser support** - Works in all modern browsers (no IE11)
4. **Auto-initialization** - Components typically initialize automatically on page load
5. **Diagnostics are optional** - Only include if users need debugging tools
6. **Workspace commands** - Use `pnpm` not `npm` for all operations
7. **Version folders persist** - Never delete old version folders, users depend on them

## Quick Command Reference

| Command                | Purpose                | Updates                         |
| ---------------------- | ---------------------- | ------------------------------- |
| `pnpm build:marquee`   | Development build      | `latest/` only                  |
| `pnpm dev:marquee`     | Watch mode             | `latest/` only                  |
| `pnpm release:marquee` | Release build          | `v{version}/` + `latest/`       |
| `pnpm build`           | Build all components   | All `latest/` folders           |
| `pnpm release`         | Release all components | All version folders + `latest/` |

## Troubleshooting

### Build fails with "Cannot find module"

- Run `pnpm install` to ensure all dependencies are installed

### Version folder not created after release

- Check that you updated the version in `packages/{component}/package.json`
- Ensure BUILD_MODE environment variable is being set correctly

### Users see old code after deployment

- CDN cache may need time to clear
- Tell users to hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Some CDNs have cache purge options

### Rollup watch mode not detecting changes

- Ensure you're editing files in `packages/{component}/src/`
- Check that the path in rollup.config.js input is correct

## Next Steps

After deployment:

1. Test the CDN URLs in a clean browser (incognito mode)
2. Update documentation with the correct CDN URLs
3. Notify users of the new version (if breaking changes)
4. Monitor for any issues
5. Continue development using `pnpm dev:marquee`

See [VERSIONING.md](./VERSIONING.md) for long-term versioning strategy and best practices.
