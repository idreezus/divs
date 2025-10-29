# divs

Component libraries for modern web development. Built for Webflow and other no-code platforms.

## Components

- **marquee** - Seamless infinite scrolling powered by GSAP

## Daily Workflow

### Development

**Start watch mode** (leave running in terminal):

```bash
pnpm dev:marquee
```

This watches `packages/marquee/src/` and automatically rebuilds to `dist/marquee/latest/` whenever saving a file.

**Then:**

1. Open `packages/marquee/test.html` in browser (or use Live Server)
2. Edit files in `packages/marquee/src/`
3. Save → auto-rebuilds → refresh browser to see changes

**Why the build step?** Source code is split across multiple files with ES6 imports. The build process bundles everything into a single file that works with `<script>` tags (like in Webflow).

### Releasing

**Steps to publish a stable version:**

1. Update version in `packages/marquee/package.json` (e.g., `1.0.0` → `1.0.1`)
2. Commit and merge to main:

```bash
git add packages/marquee/package.json
git commit -m "Release marquee v1.0.1"
git push origin main
```

3. Cloudflare builds and deploys to CDN automatically

**How users load it:**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.1/marquee.min.js"></script>
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full development and production workflows, including optional GitHub releases for jsDelivr.

## Build System

### Two build types

**Development** (`latest/`) - For testing while coding

- Command: `pnpm dev:marquee` or `pnpm build:marquee`
- Updates: `dist/marquee/latest/`
- Use: Testing only, changes constantly

**Release** (`v1.0.0/`) - For users in production

- Command: `pnpm release:marquee`
- Creates: `dist/marquee/v1.0.1/` (reads version from package.json)
- Use: Frozen and stable for users

### Folder structure

```
packages/marquee/src/     # Edit here
packages/marquee/test.html # Test here
dist/marquee/
├── latest/               # Development builds
├── v1.0.0-beta/         # Release
└── v1.0.1/              # Another release
```

## Versioning

Each component versions independently using semantic versioning:

- **Major** (v2.0.0) - Breaking changes
- **Minor** (v1.1.0) - New features
- **Patch** (v1.0.1) - Bug fixes

Early versions: `1.0.0-beta`, `1.0.0-alpha`, `1.0.0-rc1`

**Common scenarios:**

| Scenario      | Steps                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Daily coding  | `pnpm dev:marquee` → edit → test → repeat                                                          |
| Bug fix       | Fix code → `pnpm build:marquee` (test) → update version to 1.0.1 → `pnpm release:marquee` → deploy |
| Major version | Update version to 2.0.0 → `pnpm release:marquee` → deploy (users on v1.x.x keep working)           |

## Adding New Components

1. Copy `packages/marquee/` structure to `packages/your-component/`
2. Update `package.json` with new component name
3. Add build scripts to root `package.json`:

```json
"build:your-component": "pnpm --filter your-component build",
"dev:your-component": "pnpm --filter your-component build:watch",
"release:your-component": "pnpm --filter your-component release"
```

4. Build: `pnpm dev:your-component`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for CDN deployment.

## Quick Reference

### Commands

| Command                | What it does                                               | When to use                   |
| ---------------------- | ---------------------------------------------------------- | ----------------------------- |
| `pnpm dev:marquee`     | Watch mode - auto-rebuilds `src/` → `dist/latest/` on save | Daily coding (leave running)  |
| `pnpm build:marquee`   | One-time build to `dist/latest/`                           | Quick test without watch mode |
| `pnpm release:marquee` | Production build - creates `dist/v1.0.1/` folder           | Before deploying to CDN       |
| `pnpm release`         | Production build for ALL components at once                | Multiple components           |

### CDN URLs

**Production:**

```html
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.1/marquee.min.js"></script>
```

**Testing only:**

```html
<script src="https://divs-cdn.idreezus.com/marquee/latest/marquee.min.js"></script>
```

### Rules

- ✅ Edit in `packages/`, never in `dist/`
- ✅ Test in `latest/` before releasing
- ✅ Update version in package.json before releasing
- ❌ Don't delete version folders (users depend on them)
- ❌ Don't give users `latest/` URLs (for testing only)

## Troubleshooting

**Build fails:**
Run `pnpm install`

**Version folder not created:**
Check version in `packages/{component}/package.json`

**Watch mode not detecting changes:**
Edit files in `packages/{component}/src/` only

**Forgot to update version before releasing:**
Update `package.json` and release again

## License

Apache-2.0
