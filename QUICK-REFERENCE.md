# Quick Reference Card

Keep this handy for daily development.

## Daily Commands

### Working on Marquee

```bash
# Start development (watch mode - auto-rebuilds)
pnpm dev:marquee

# Single build
pnpm build:marquee

# Test at: dist/marquee/latest/
```

### When Ready to Release

```bash
# 1. Edit packages/marquee/package.json - update version number
# 2. Build the release
pnpm release:marquee

# 3. Deploy dist/ folder to CDN
```

## Key Concepts

| Term      | Meaning                  | For                 |
| --------- | ------------------------ | ------------------- |
| `latest/` | Development builds       | Your testing        |
| `v1.0.0/` | Stable releases          | Users in production |
| `build`   | Updates latest/ only     | Daily development   |
| `release` | Creates versioned folder | Publishing to users |

## Folder Structure

```
packages/marquee/       # Source code (edit here)
  ├── src/              # Your component code
  ├── package.json      # Update version here before release
  └── rollup.config.js  # Build configuration

dist/marquee/           # Built files (auto-generated)
  ├── latest/           # For testing
  └── v1.0.0-beta/      # For users
```

## Build Modes

| Mode    | Command                | Updates                   | Use When            |
| ------- | ---------------------- | ------------------------- | ------------------- |
| Dev     | `pnpm build:marquee`   | `latest/`                 | Testing changes     |
| Watch   | `pnpm dev:marquee`     | `latest/`                 | Active coding       |
| Release | `pnpm release:marquee` | `v{version}/` + `latest/` | Publishing to users |

## URLs for Users

**Development (testing only):**

```html
<script src="https://divs-cdn.idreezus.com/marquee/latest/marquee.min.js"></script>
```

**Production (stable):**

```html
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-beta/marquee.min.js"></script>
```

## Versioning Quick Guide

1. Make changes in `packages/marquee/src/`
2. Test with `pnpm dev:marquee` (loads from latest/)
3. When ready: update version in `packages/marquee/package.json`
4. Release with `pnpm release:marquee`
5. Deploy `dist/` to CDN

## Common Workflows

### Adding a Feature

```bash
# Edit code in packages/marquee/src/
pnpm dev:marquee           # Auto-rebuilds on save
# Test in browser using latest/
# When satisfied, create release (see below)
```

### Fixing a Bug

```bash
# Fix code in packages/marquee/src/
pnpm build:marquee         # Test the fix
# If good, bump version and release
```

### Creating a Release

```bash
# 1. Open packages/marquee/package.json
#    Change: "version": "1.0.0-beta"
#    To:     "version": "1.0.1"

pnpm release:marquee       # Creates dist/marquee/v1.0.1/

# 2. Deploy dist/ folder to your CDN
```

## Multiple Components

```bash
# Build all
pnpm build

# Release all
pnpm release

# Specific component
pnpm build:marquee
pnpm release:accordion
```

## Remember

- ✅ Test in `latest/` before releasing
- ✅ Update version in package.json before release
- ✅ Users load from versioned URLs
- ❌ Never edit dist/ files directly
- ❌ Never delete version folders
- ❌ Never use latest/ in production

## Need Help?

- [VERSIONING.md](./VERSIONING.md) - Complete versioning guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [README.md](./README.md) - Project overview
