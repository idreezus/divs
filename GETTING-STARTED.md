# Getting Started with divs

Welcome! This is a quick guide to get you up and running with the divs monorepo.

## What Just Happened?

Your project has been set up as a monorepo with independent versioning for each component. Here's what that means in simple terms:

- **Monorepo** = Multiple components (marquee, future accordion, etc.) in one project
- **Independent versioning** = Each component can have different version numbers
- **Two build modes** = Development (for testing) and Release (for users)

## Your First Steps

### 1. Install Dependencies (Already Done!)

```bash
pnpm install
```

This is already complete. You're ready to go!

### 2. Start Developing

```bash
pnpm dev:marquee
```

This starts "watch mode" - it automatically rebuilds whenever you edit files in `packages/marquee/src/`.

### 3. Test Your Changes

The built files are in `dist/marquee/latest/`. Open `packages/marquee/test.html` in your browser to test.

## Two Build Modes Explained Simply

Think of it like saving a document:

### Development Mode (Auto-save while working)

```bash
pnpm build:marquee
# or
pnpm dev:marquee  # watch mode
```

- Updates `dist/marquee/latest/`
- Changes every time you build
- For testing only
- Like hitting "Save" while working on a draft

### Release Mode (Final published version)

```bash
pnpm release:marquee
```

- Creates `dist/marquee/v1.0.0-beta/` (reads version from package.json)
- Also updates `latest/`
- Frozen and stable
- Like hitting "Publish" on a blog post

## Daily Workflow

### When You're Coding

1. Open your editor
2. Run `pnpm dev:marquee` (auto-rebuilds on save)
3. Edit files in `packages/marquee/src/`
4. Test in your browser using `dist/marquee/latest/`
5. Repeat until satisfied

### When You're Ready to Publish

1. Open `packages/marquee/package.json`
2. Change the version number (e.g., from `"1.0.0-beta"` to `"1.0.1"`)
3. Run `pnpm release:marquee`
4. Upload `dist/` folder to your CDN
5. Done! Users can now load `v1.0.1`

## File Structure

```
divs/
├── packages/
│   └── marquee/
│       ├── src/              ← Edit your code here
│       │   ├── marquee.js
│       │   └── ...
│       ├── package.json      ← Update version here before releasing
│       └── test.html         ← Test your component here
│
└── dist/                     ← Built files (auto-generated)
    └── marquee/
        ├── latest/           ← Development builds (for your testing)
        └── v1.0.0-beta/      ← Release builds (for users)
```

## Important Rules

1. **Edit files in `packages/marquee/src/`** - Never edit files in `dist/`
2. **Test in `latest/`** - Make sure everything works before releasing
3. **Release for users** - Only run `pnpm release:marquee` when ready to publish
4. **Users load from versioned URLs** - Never tell users to load from `latest/`

## Next Steps

### Learn More

- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Quick command reference (keep this handy!)
- **[VERSIONING.md](./VERSIONING.md)** - Complete guide to versioning and releases
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - How to deploy to Cloudflare Pages
- **[README.md](./README.md)** - Project overview

### Try It Out

1. Make a small change to `packages/marquee/src/marquee.js` (add a comment)
2. Run `pnpm dev:marquee`
3. Check that `dist/marquee/latest/marquee.js` has your change
4. That's it! You're building successfully.

### When You Add a New Component

1. Copy the `packages/marquee/` structure
2. Rename to your new component name
3. Update package.json with the new name
4. Add scripts to root package.json (see DEPLOYMENT.md)
5. Build with `pnpm build:component-name`

## Common Questions

**Q: When should I use `build` vs `release`?**
A: Use `build` while developing/testing. Use `release` when ready to publish to users.

**Q: Can I delete the `latest/` folder?**
A: No, it's where development builds go. But users should never load from it.

**Q: What if I forget to update the version before releasing?**
A: The release will use the old version number. Just update package.json and run release again.

**Q: Can components have different version numbers?**
A: Yes! That's the whole point. Marquee might be v1.5.0 while accordion is v3.2.1.

**Q: Should I commit the `dist/` folder to git?**
A: No, it's in .gitignore. You'll rebuild it when deploying.

## Getting Help

If you're confused about something:

1. Check [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) for commands
2. Read [VERSIONING.md](./VERSIONING.md) for workflow details
3. Look at [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help

## You're Ready!

Start developing with:

```bash
pnpm dev:marquee
```

Happy coding!
