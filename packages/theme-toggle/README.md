<GridItem size="lg" className="mt-4 rounded-lg border aspect-video overflow-hidden">
  <video autoPlay playsInline loop muted preload="none">
    <source src="https://divs-assets.idreezus.com/site/themetoggles-vid-final.mp4" type="video/mp4" />
  </video>
</GridItem>

## Features

<Features>

- Simple setup: add data attributes to buttons and you're done
- No flash of wrong theme on page load with inline anti-flash script
- All toggles styled with normal CSS – the script adds no inline styles
- Works with system preference out of the box for first-time visitors
- Extend beyond light/dark to any number of custom themes
- Multiple toggle groups on a page stay in sync automatically

</Features>

## Setup

<Steps>

<Step number="1" title="Set Up Your Theming">
The scripts below are unopinionated; they don't style your site's theming for you. In other words, I don't know what colors you like – **you need to set up theming yourself.**

> [!NOTE/Confused? Unsure how to set up theming?]
> I might make a YouTube video on how to set up themes on Webflow with variable modes. If you'd like that, reach out to me on [Twitter](https://x.com/idreezus) or [LinkedIn](https://www.linkedin.com/in/idreesisse/).

</Step>

<Step number="2" title="Add the Head Script">
Copy & paste this script in your Page Settings **Inside `<head>` tag** at the very top:

```html
<script>
  (function () {
    'use strict';

    // Anti-flash: inline in <head> before stylesheets
    (() => {
      const STORAGE_KEY = 'theme';
      let stored = null;

      try {
        stored = localStorage.getItem(STORAGE_KEY);
      } catch (e) {}

      // User's choice: stored value or default to "system"
      const theme = stored || 'system';

      // Calculate effective theme
      const effectiveTheme =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;

      // Set class on <body> for effective theme (CSS targeting)
      document.body.classList.add(effectiveTheme);

      // Set data-theme attribute for user's choice (can be "system")
      document.body.setAttribute('data-theme', theme);
    })();
  })();
</script>
```

</Step>

<Step number="3" title="Add the Body Script">
Copy & paste this script in your Page Settings **Before `</body>` tag**

```html
<script src="https://cdn.jsdelivr.net/gh/idreezus/divs@v1.0.0/dist/theme-toggle/v1.0.0/theme-toggle.min.js"></script>
```

</Step>

<Step number="4" title="Add Theme Buttons">
**If you're copying/pasting variants below, you can skip this step** – they come preconfigured.

Otherwise, mark your buttons with data attributes:

```html
<!-- For one button that cycles through all themes -->
<button data-theme-toggle>Toggle Theme</button>

<!-- For explicit theme buttons -->
<button data-theme-value="light">Light</button>
<button data-theme-value="dark">Dark</button>
<button data-theme-value="system">System/OS Default</button>
```

</Step>

</Steps>

---

## How It Works

The script handles automatic theme detection from a user's system preferences. If the user selects a different theme on your site, the script handles "remembering" that preference for the future (by using the browser's `localStorage`).

There are two attributes added to the `<body>` element:

1. **A CSS class** on the `<body>` element that marks the actual visual theme (e.g. `.light`, `.dark`, `.sepia`, etc – but never "system").
2. The `[data-theme]` attribute that denotes what the user selected (e.g. `[data-theme='system']`, `[data-theme='light']`, `[data-theme='dark']`, etc.)

This is what enables CSS states and animations without any JavaScript like "show a different icon when the user chose system preference" or "move the toggle to the right when it's dark mode".

### Preventing FOUC

The inline `<head>` script reads `localStorage` (or defaults to "system"), then immediately sets the theme class on the `<body>`. This prevents the flash of wrong-themed content or FOUC as they call it.

### How Preferences Persist

First-time visitors (no `localStorage`) default to whatever their system preference is (like a Mac's dark mode or light mode). If they don't have any system preferences set, it falls back to light mode as the default.

When a user clicks an explicit theme toggle:

- `data-theme` changes to their choice (e.g., "dark")
- Theme no longer follows OS preference
- Choice is saved to `localStorage`

To return to system preference, the user can simply click a "System" theme button – i.e. one with `[data-theme-value='system']`.

---

## Variants

> [!CAUTION/IMPORTANT: Before you start!]
> The variants below have buttery smooth animations. But this website's theming is overlapping with the variants, causing the theme toggle animations to appear to have framerate drops.
> **This does not happen when you copy/paste to Webflow all** – they look as smooth as the video above.
>
> Trust me, bro.

<GridItem className="flex flex-col gap-4 md:gap-8 lg:gap=16">

<Variant title="Animated Icon" id="ba075821-4289-4ec3-8453-3bd9dff0949e" />

<Variant title="Compact Pill + System Option" id="977dcf6b-d497-496d-a17f-6dd380c59960" />

<Variant title="Compact Pill" id="3f03c1ce-add0-4936-b0b8-f30d26c50887" />

<Variant title="iOS Style with One Label" id="37862d64-9d3d-4f8d-91ae-0bfa01f5eb39" />

<Variant title="iOS Style with Icon" id="999215a3-7347-4b72-a5cd-fe62c47e4cc2" />

<Variant title="iOS Style with Labels" id="429154d0-7f0a-44cf-ade2-b31800ae8c20" />

<Variant title="Pill with Slider + System Option" id="554226e0-061f-4697-b30e-1b625cd9ba5d" />

<Variant title="Pill with Slider" id="da509337-be8d-45a7-a574-0d0a5c066a67" />

<Variant title="Slash Icon Only" id="ec73d11b-f4f2-4ae1-bb9b-ffdfe4d8a00f" />

<Variant title="Slash Text No Icon" id="5e7087f5-fbf9-4a02-8cfa-c6374b9af9f2" />

<Variant title="Slash Text with Icon" id="4e69e250-3ef6-4c0e-9ff3-4c93ba6d8819" />

<Variant title="Text with Icon" id="59a66c28-b9d0-4b5e-be6c-a1516641894c" />

<Variant title="Text Only" id="d166b0be-70f8-427e-a249-23f8d3b1097b" />

<Variant title="Text + Icon Button" id="eb8e5da1-ab00-4a8d-bfe8-86f7780260e3" />

<Variant title="Ghost Icon" id="7cfc0591-9f88-4156-bde6-16882f4b39c0" />

</GridItem>

## Customization

### Button Attributes

| Attribute           | Value                        | Description                                |
| ------------------- | ---------------------------- | ------------------------------------------ |
| `data-theme-toggle` |                              | Cycles through all themes except "system"  |
| `data-theme-value`  | `light`, `dark`, `system`... | Sets theme to the specified value on click |

### Smooth Theme Transitions

Add CSS transitions for smooth theme changes:

```css
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### Styling Active Buttons

Use CSS to style active buttons based on the current state.

**Two-button toggle (Light/Dark only):**

```css
/* Highlight the light mode button when light mode is active */
.light .theme-button.is-light {
  background: var(--primary);
  color: white;
}

/* Highlight the dark mode button when dark mode is active */
.dark .theme-button.is-dark {
  background: var(--primary);
  color: white;
}
```

**Three-button toggle (Light/Dark/System):**

When you have a "System" button, check the `data-theme` attribute instead:

```css
/* Highlight the light mode button when light mode is active */
[data-theme='light'] .theme-button.is-light {
  background: var(--primary);
  color: white;
}

/* Highlight the dark mode button when dark mode is active */
[data-theme='dark'] .theme-button.is-dark {
  background: var(--primary);
  color: white;
}

/* Highlight the system mode button when system mode is active */
[data-theme='system'] .theme-button.is-system {
  background: var(--primary);
  color: white;
}
```

### Detecting System Choices

Show different UI elements based on the user's choice:

```css
/* Show when user chose system preference */
[data-theme='system'] .system-indicator {
  display: block;
}

/* Show when user made explicit choice */
[data-theme='light'] .user-choice-indicator,
[data-theme='dark'] .user-choice-indicator {
  display: block;
}
```

### Multi-Theme Support

Extend beyond light/dark to any number of themes:

**1. Extend the themes array:**

```javascript
ThemeManager.themes = ['light', 'dark', 'sepia', 'high-contrast'];
```

**2. Add CSS for new themes:**

```css
.sepia {
  --bg: #f4ecd8;
  --text: #5c4b37;
}

.high-contrast {
  --bg: #000000;
  --text: #ffffff;
  --primary: #ffff00;
}
```

**3. Add buttons:**

```html
<button data-theme-value="light">Light</button>
<button data-theme-value="dark">Dark</button>
<button data-theme-value="sepia">Sepia</button>
<button data-theme-value="high-contrast">High Contrast</button>
<button data-theme-value="system">Auto</button>
```

---

## JavaScript API

**Properties**

```javascript
ThemeManager.current; // Effective theme (e.g., "light", "dark") - never "system"
ThemeManager.theme; // User's choice (can be "system", "light", "dark", etc.)
ThemeManager.themes; // Array of available themes
ThemeManager.initialized; // Boolean indicating init state
```

**Methods**

```javascript
// Set theme explicitly
ThemeManager.setTheme('dark');

// Set to follow system preference
ThemeManager.setTheme('system');

// Get current effective theme
ThemeManager.getTheme(); // "dark"

// Get user's choice
ThemeManager.getUserTheme(); // "system", "dark", "light", etc.

// Resolve any theme to effective value
ThemeManager.getEffectiveTheme('system'); // "light" or "dark"

// Cycle to next theme (skips "system")
ThemeManager.toggleTheme();

// Re-scan DOM for new buttons (useful for SPAs)
ThemeManager.refresh();

// Clean up all event listeners
ThemeManager.destroy();

// Re-initialize after destroy
ThemeManager.init();
```

**SPA Usage**

For single-page applications where buttons may be added dynamically:

```javascript
// After adding new buttons to the DOM
ThemeManager.refresh();

// Before unmounting/cleanup
ThemeManager.destroy();

// Re-initialize on new page
ThemeManager.init();
```

---

**Events**

Listen for theme changes with the `themechange` event:

```javascript
window.addEventListener('themechange', (e) => {
  console.log('Theme:', e.detail.theme); // Effective theme
  console.log('Previous:', e.detail.previous); // Previous effective theme
  console.log('User chose:', e.detail.userTheme); // User's choice
  console.log('Changed:', e.detail.effectiveChanged); // Did visual theme change?
});
```

**Event Detail Properties**

| Property            | Type      | Description                             |
| ------------------- | --------- | --------------------------------------- |
| `theme`             | `string`  | Current effective theme                 |
| `previous`          | `string`  | Previous effective theme                |
| `userTheme`         | `string`  | User's choice (can be "system")         |
| `previousUserTheme` | `string`  | Previous user's choice                  |
| `effectiveChanged`  | `boolean` | `true` if the visual appearance changed |

---

## FAQ

<Accordions>

<Accordion title="Why do I need two scripts?">
The script in the `<head>` must run before CSS loads to prevent theme flicker. The main script handles everything else and can load at the end of `<body>`. They're separate because inline `<head>` scripts should be minimal.
</Accordion>

<Accordion title="What's the difference between class and data-theme?">
The class on `<body>` (e.g., `dark`) is the **effective theme** – what's visually shown. The `data-theme` attribute is the **user's choice** – what they selected. When the user chooses "system", the class will be "light" or "dark" (based on OS), but `data-theme` will be "system".
</Accordion>

<Accordion title="Can I use this with server-side rendering?">
Kinda. The anti-flash script reads from `localStorage` client-side, so there's a brief moment where the server-rendered theme might not match. For true SSR support, you'd need to read the theme preference from a cookie on the server. The library itself is client-side only.
</Accordion>

<Accordion title="What happens in private browsing mode?">
The library wraps `localStorage` access in try/catch. In private browsing modes that block `localStorage`, it falls back to system preference and won't persist choices across page loads.
</Accordion>

<Accordion title="How do I add more themes beyond light and dark?">
Set `ThemeManager.themes` to an array with your theme names, add corresponding CSS for each theme targeting the class (e.g., `.sepia`), and add buttons with `data-theme-value="X"` for each theme.
</Accordion>

</Accordions>
