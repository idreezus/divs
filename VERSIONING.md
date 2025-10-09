# Versioning Guide

This document explains how versioning works in the divs monorepo and when to use each build command.

## Overview

Each component has two build modes:

1. **Development builds** - For testing and development (updates `latest/` folder only)
2. **Release builds** - For publishing to users (creates versioned folder like `v1.0.0/`)

Think of it like this:

- `latest/` = Your workspace (constantly changing, for testing)
- `v1.0.0/` = A published release (frozen in time, for users)

## Directory Structure

```
dist/
└── marquee/
    ├── latest/              # Development builds go here
    │   ├── marquee.js
    │   ├── marquee.min.js
    │   ├── marquee-diagnostics.js
    │   └── marquee-diagnostics.min.js
    ├── v1.0.0-beta/         # Release build for version 1.0.0-beta
    │   └── (same files)
    └── v1.0.1/              # Release build for version 1.0.1
        └── (same files)
```

## Development Workflow

### Working on a Component

Use the regular build command for day-to-day development:

```bash
# Build marquee (updates latest/ only)
pnpm build:marquee

# Watch mode (rebuilds on file changes, updates latest/ only)
pnpm dev:marquee
```

This updates only `dist/marquee/latest/` - you can test, make changes, rebuild 100 times without cluttering your dist folder.

### Testing Your Changes

Load from the `latest/` folder in your test file:

```html
<script src="https://divs-cdn.idreezus.com/marquee/latest/marquee.min.js"></script>
```

Or if testing locally:

```html
<script src="../dist/marquee/latest/marquee.min.js"></script>
```

## Release Workflow

### When You're Ready to Publish

Follow these steps when you want to create a new stable version for users:

#### Step 1: Update the Version

Edit the component's `package.json`:

```bash
# Open packages/marquee/package.json
# Change "version": "1.0.0-beta" to "version": "1.0.1"
```

#### Step 2: Run the Release Build

```bash
pnpm release:marquee
```

This does two things:

1. Creates/updates `dist/marquee/v1.0.1/` (reads version from package.json)
2. Also updates `dist/marquee/latest/` (so latest always has newest code)

#### Step 3: Deploy to CDN

Upload the `dist/` folder to your CDN (Cloudflare Pages, etc.)

#### Step 4: Users Can Now Load It

Users can safely load the versioned URL:

```html
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.1/marquee.min.js"></script>
```

This URL will never change, even if you continue developing.

## Version Naming Convention

Follow semantic versioning for clarity:

- **Major version** (v2.0.0) - Breaking changes (changes that break existing user code)
- **Minor version** (v1.1.0) - New features (backward compatible)
- **Patch version** (v1.0.1) - Bug fixes (backward compatible)

During early development, use beta/alpha:

- `1.0.0-beta`
- `1.0.0-alpha`
- `1.0.0-rc1` (release candidate)

## Independent Component Versioning

Each component versions independently. For example:

```
dist/
├── marquee/
│   ├── latest/
│   ├── v1.0.0-beta/
│   └── v1.2.5/          # Marquee is at 1.2.5
└── accordion/
    ├── latest/
    └── v3.0.0/          # Accordion is at 3.0.0
```

This is normal and expected. Each component evolves at its own pace.

## Build All Components

To build or release all components at once:

```bash
# Development builds (updates all latest/ folders)
pnpm build

# Release builds (creates versioned folders for all components)
pnpm release
```

## Common Scenarios

### Scenario 1: Daily Development

You're adding a new feature to marquee and testing it frequently.

```bash
# Make changes to code
pnpm dev:marquee     # Watch mode - auto-rebuilds on save
# Test at dist/marquee/latest/
# Make more changes, it rebuilds automatically
# Repeat until satisfied
```

### Scenario 2: Fixing a Bug

You found a bug in the released v1.0.0 and want to publish a fix.

```bash
# Fix the bug in your code
pnpm build:marquee   # Test the fix in latest/
# Verify the fix works
# Edit packages/marquee/package.json - change version to "1.0.1"
pnpm release:marquee # Creates dist/marquee/v1.0.1/
# Deploy to CDN
# Tell users to update their URL to v1.0.1
```

### Scenario 3: Major Version Release

You made breaking changes and want to release v2.0.0.

```bash
# Ensure all changes are complete
# Edit packages/marquee/package.json - change version to "2.0.0"
pnpm release:marquee # Creates dist/marquee/v2.0.0/
# Deploy to CDN
# Users on v1.x.x continue working
# Users who want new features can upgrade to v2.0.0
```

## Important Rules

1. **Never edit files in dist/ directly** - Always rebuild from source
2. **Never delete version folders** - Users may depend on them
3. **Test in latest/ before releasing** - Make sure it works before creating a version folder
4. **Update package.json version before releasing** - The release command reads from there
5. **Document breaking changes** - Tell users if they need to change their code when upgrading

## Quick Reference

| Command                | What It Does                                 | When To Use                    |
| ---------------------- | -------------------------------------------- | ------------------------------ |
| `pnpm build:marquee`   | Updates `latest/` only                       | Daily development, testing     |
| `pnpm dev:marquee`     | Watch mode, updates `latest/`                | Active development sessions    |
| `pnpm release:marquee` | Creates versioned folder + updates `latest/` | Ready to publish to users      |
| `pnpm build`           | Builds all components (latest/ only)         | Testing all components         |
| `pnpm release`         | Releases all components                      | Publishing multiple components |

## Questions?

- **"Should users load from latest/?"** - No, latest/ is for your testing only
- **"Can I delete old version folders?"** - No, users may depend on them
- **"Do I need to release every time I build?"** - No, release only when ready for users
- **"What if I forget to update package.json before releasing?"** - The release will use the old version number, just update it and release again
