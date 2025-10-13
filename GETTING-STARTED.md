# Getting Started

Quick setup guide for the divs monorepo.

## What is this?

This project holds multiple components in one repo. Each component:

- Has its own version number
- Builds separately
- Ships independently

**Two build types:**

- **Development** (`latest/`) - For testing while you code
- **Release** (`v1.0.0/`) - For users in production

## First steps

### 1. Install

```bash
pnpm install
```

### 2. Start coding

```bash
pnpm dev:marquee
```

Watch mode rebuilds automatically when you edit files in `packages/marquee/src/`.

### 3. Test

Built files land in `dist/marquee/latest/`. Test using `packages/marquee/test.html`.

## How builds work

Think of it like saving a document:

**Development builds** = Hitting "Save" on a draft

```bash
pnpm dev:marquee
```

- Updates `dist/marquee/latest/`
- For testing only
- Changes constantly

**Release builds** = Hitting "Publish"

```bash
pnpm release:marquee
```

- Creates `dist/marquee/v1.0.0/` (reads version from package.json)
- Frozen forever
- Safe for users

## Daily workflow

### While coding

1. Run `pnpm dev:marquee`
2. Edit files in `packages/marquee/src/`
3. Test in browser using `dist/marquee/latest/`
4. Repeat

### When publishing

1. Update version in `packages/marquee/package.json`
2. Run `pnpm release:marquee`
3. Upload `dist/` to CDN
4. Done

## Folder structure

```
packages/marquee/src/     ← Edit here
packages/marquee/test.html ← Test here
dist/marquee/latest/      ← Development builds
dist/marquee/v1.0.0/      ← Release builds
```

## Rules

- Edit in `packages/`, never in `dist/`
- Test in `latest/` before releasing
- Users load from versioned URLs only (`v1.0.0/`), never `latest/`

## Try it

1. Edit `packages/marquee/src/marquee.js` (add a comment)
2. Run `pnpm dev:marquee`
3. Check `dist/marquee/latest/marquee.js` has your change

## Common questions

**When to use `build` vs `release`?**
Use `build` for testing. Use `release` for publishing.

**Can I delete `latest/`?**
No. But users shouldn't load from it.

**Forgot to update version before releasing?**
Update `package.json` and release again.

**Should I commit `dist/` to git?**
No, it's in `.gitignore`.

## More help

- [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Command cheat sheet
- [VERSIONING.md](./VERSIONING.md) - Version workflow
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to CDN
