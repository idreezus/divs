# Versioning Guide

How versioning works in this monorepo.

## Two build types

**Development builds** - For testing

```bash
pnpm build:marquee
```

- Updates `latest/` only
- Changes constantly
- Not for users

**Release builds** - For users

```bash
pnpm release:marquee
```

- Creates versioned folder (`v1.0.0/`)
- Frozen forever
- Safe for production

## Folder structure

```
dist/marquee/
├── latest/              # Development
├── v1.0.0-beta/         # Release
└── v1.0.1/              # Another release
```

## Development workflow

```bash
pnpm dev:marquee          # Watch mode
```

Edit files in `packages/marquee/src/`. Test using `dist/marquee/latest/`.

## Release workflow

### Step 1: Update version

Edit `packages/marquee/package.json`:

```json
{
  "version": "1.0.1"
}
```

### Step 2: Build release

```bash
pnpm release:marquee
```

Creates `dist/marquee/v1.0.1/` and updates `latest/`.

### Step 3: Deploy

Upload `dist/` to CDN.

### Step 4: Done

Users load from:

```html
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.1/marquee.min.js"></script>
```

This URL never changes.

## Version naming

Use semantic versioning:

- **Major** (v2.0.0) - Breaking changes
- **Minor** (v1.1.0) - New features
- **Patch** (v1.0.1) - Bug fixes

Early development:

- `1.0.0-beta`
- `1.0.0-alpha`
- `1.0.0-rc1`

## Independent versioning

Each component versions separately:

```
marquee/v1.2.5/
accordion/v3.0.0/
```

This is normal. Each component evolves at its own pace.

## Common scenarios

### Daily development

```bash
pnpm dev:marquee          # Auto-rebuilds
# Edit, test, repeat
```

### Bug fix release

```bash
# Fix the bug
pnpm build:marquee        # Test it
# Update version to 1.0.1 in package.json
pnpm release:marquee
# Deploy
```

### Major version

```bash
# Update version to 2.0.0 in package.json
pnpm release:marquee      # Creates v2.0.0/
# Deploy
# Users on v1.x.x keep working
```

## Rules

- Never edit `dist/` directly
- Never delete version folders
- Test in `latest/` before releasing
- Update `package.json` version before releasing

## Quick reference

| Command                | What it does            | When to use     |
| ---------------------- | ----------------------- | --------------- |
| `pnpm dev:marquee`     | Updates `latest/`       | Daily coding    |
| `pnpm release:marquee` | Creates versioned build | Publishing      |
| `pnpm build`           | Builds all (latest/)    | Test everything |
| `pnpm release`         | Releases all            | Publish all     |

## Common questions

**Should users load from `latest/`?**
No, testing only.

**Can I delete old version folders?**
No, users depend on them.

**Forgot to update version before releasing?**
Update `package.json` and release again.
