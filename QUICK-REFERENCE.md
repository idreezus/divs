# Quick Reference

Command cheat sheet for daily work.

## Commands

### Development

```bash
pnpm dev:marquee        # Watch mode
pnpm build:marquee      # Single build
```

Test at: `dist/marquee/latest/`

### Release

```bash
# 1. Update version in packages/marquee/package.json
# 2. Build release
pnpm release:marquee
# 3. Deploy dist/ to CDN
```

## Key terms

| Term      | What it is               | For          |
| --------- | ------------------------ | ------------ |
| `latest/` | Development builds       | Testing      |
| `v1.0.0/` | Release builds           | Users        |
| `build`   | Updates `latest/` only   | Daily coding |
| `release` | Creates versioned folder | Publishing   |

## Folders

```
packages/marquee/src/     # Edit here
dist/marquee/latest/      # Development builds
dist/marquee/v1.0.0/      # Release builds
```

## URLs

**Production:**

```html
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-beta/marquee.min.js"></script>
```

**Testing only:**

```html
<script src="https://divs-cdn.idreezus.com/marquee/latest/marquee.min.js"></script>
```

## Workflows

### Add a feature

```bash
pnpm dev:marquee          # Auto-rebuilds
# Edit packages/marquee/src/
# Test using latest/
# When done, release (see below)
```

### Release

```bash
# 1. Update version in packages/marquee/package.json
pnpm release:marquee      # Creates dist/marquee/v1.0.1/
# 2. Deploy dist/ to CDN
```

## Multiple components

```bash
pnpm build                # Build all
pnpm release              # Release all
pnpm build:marquee        # Build one
```

## Rules

- ✅ Test in `latest/` before releasing
- ✅ Update version before release
- ❌ Don't edit `dist/` directly
- ❌ Don't delete version folders
- ❌ Don't use `latest/` in production

## More docs

- [VERSIONING.md](./VERSIONING.md) - Version workflow
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to CDN
- [GETTING-STARTED.md](./GETTING-STARTED.md) - First-time setup
