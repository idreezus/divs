# Deployment Guide

How to deploy components to CDN.

## Quick overview

Components build from `packages/` to `dist/`, then deploy to CDN.

**Current components:**

- **marquee** - Infinite scrolling

## Build types

### Development (testing only)

```bash
pnpm build:marquee
```

- Updates `dist/marquee/latest/` only
- Not for users

### Release (for users)

```bash
pnpm release:marquee
```

- Creates `dist/marquee/v{version}/`
- Reads version from `package.json`
- Frozen and stable

See [VERSIONING.md](./VERSIONING.md) for full workflow.

## What gets built

Each component creates 4 files:

- `{name}.js` - Unminified
- `{name}.min.js` - Minified (production)
- `{name}-diagnostics.js` - Debug tool (unminified)
- `{name}-diagnostics.min.js` - Debug tool (minified)

**Example:**

```
dist/marquee/
├── latest/                 # Development
│   ├── marquee.js
│   ├── marquee.min.js
│   ├── marquee-diagnostics.js
│   └── marquee-diagnostics.min.js
├── v1.0.0-beta/           # Release
└── v1.0.1/                # Another release
```

## Development workflow

```bash
pnpm dev:marquee           # Watch mode
```

Test at `packages/marquee/test.html` which loads from `dist/marquee/latest/`.

Before releasing:

1. Test in `latest/`
2. Check for console errors
3. Test multiple browsers (optional)

## Release workflow

### 1. Update version

Edit `packages/marquee/package.json`:

```json
{
  "version": "1.0.1"
}
```

### 2. Build

```bash
pnpm release:marquee
```

Creates `dist/marquee/v1.0.1/`.

### 3. Deploy

Upload `dist/` to CDN (see options below).

### 4. Done

Users load it:

```html
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.1/marquee.min.js"></script>
```

## How users load components

Example for marquee:

```html
<!-- Dependencies first -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>

<!-- Component -->
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-beta/marquee.min.js"></script>

<!-- Optional: Diagnostics -->
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-beta/marquee-diagnostics.min.js"></script>
```

Available as `window.Marquee` with:

- `Marquee.init()` - Initialize all
- `Marquee.get(element)` - Get instance

## CDN URL pattern

```
https://divs-cdn.idreezus.com/{component}/{version}/{component}.min.js
```

**Examples:**

- `/marquee/v1.0.0-beta/marquee.min.js` - Production
- `/marquee/latest/marquee.min.js` - Testing only
- `/accordion/v1.0.0/accordion.min.js` - Different component

Users should always use versioned URLs, never `latest/`.

## Deploying to Cloudflare Pages

### Option 1: Manual

1. Run `pnpm release`
2. Upload `dist/` to Cloudflare Pages

### Option 2: Automated (recommended)

1. Connect GitHub repo to Cloudflare Pages

2. Build settings:

   - **Build command:** `pnpm install && pnpm release`
   - **Output directory:** `dist`

3. Set `NODE_VERSION` to `18` or higher

4. Cloudflare rebuilds on each push

5. Old version folders persist automatically

**Benefits:**

- Auto HTTPS
- Global CDN
- Git integration
- Custom domains

## Versioning

Components version independently:

```
dist/
├── marquee/v1.2.5/
└── accordion/v3.0.0/
```

- **Versioned folders** (`v1.0.0/`) - Frozen, for users
- **Latest folder** (`latest/`) - Changing, for testing

See [VERSIONING.md](./VERSIONING.md) for full workflow.

## Adding new components

1. Copy `packages/marquee/` to `packages/new-component/`
2. Update `package.json` with new name
3. Add scripts to root `package.json`:

```json
{
  "build:new-component": "pnpm --filter new-component build",
  "dev:new-component": "pnpm --filter new-component build:watch",
  "release:new-component": "pnpm --filter new-component release"
}
```

4. Build: `pnpm dev:new-component`
5. Release: `pnpm release:new-component`

Available at:

```
https://divs-cdn.idreezus.com/new-component/v1.0.0/new-component.min.js
```

## Build all components

```bash
pnpm build        # Updates all latest/
pnpm release      # Releases all
```

## Important notes

- Dependencies (like GSAP) must be loaded globally
- Modern JavaScript (ES6+), no IE11
- Components auto-initialize on page load
- Use `pnpm`, not `npm`
- Never delete old version folders

## Quick commands

| Command                | What it does      |
| ---------------------- | ----------------- |
| `pnpm dev:marquee`     | Watch mode        |
| `pnpm build:marquee`   | Development build |
| `pnpm release:marquee` | Release build     |
| `pnpm build`           | Build all         |
| `pnpm release`         | Release all       |

## Troubleshooting

**Build fails:**
Run `pnpm install`.

**Version folder not created:**
Check version in `package.json`.

**Users see old code:**
CDN cache takes time. Hard refresh (Ctrl+F5).

**Watch mode not detecting changes:**
Edit files in `packages/{component}/src/` only.

## After deployment

1. Test CDN URLs in incognito
2. Update docs with new URLs
3. Notify users if breaking changes

See [VERSIONING.md](./VERSIONING.md) for more.
