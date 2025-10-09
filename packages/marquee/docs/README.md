# GSAP Marquee Library

A lightweight, powerful JavaScript library for creating infinite scrolling marquees powered by GSAP. Perfect for logo walls, testimonials, news tickers, and any content that needs to loop seamlessly.

## Features

- **Zero JavaScript knowledge required** - Configure everything with HTML data attributes
- **Automatic cloning** - Intelligently clones items 3 times by default to fill the container for seamless looping
- **Handles variable dimensions** - Works with items of different sizes automatically
- **Responsive** - Uses percentage-based transforms that adapt to window resizing; helpers re-measure on container and window resize
- **Horizontal and vertical** - Support for both scroll directions; seam gap stabilizes dynamically after layout and breakpoint changes (both orientations)
- **Smooth pause/slow on hover** - Built-in interaction that eases speed changes
- **Accessibility-friendly** - Respects `prefers-reduced-motion` settings, clones are hidden from screen readers
- **Manual control** - Full JavaScript API for programmatic control
- **Lightweight** - Minimal overhead, powered by battle-tested GSAP

## Installation

### Basic Setup (CDN)

Add these scripts to your HTML file:

```html
<!-- Load GSAP from CDN -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>

<!-- Load the marquee library -->
<script type="module" src="path/to/marquee.js"></script>
```

### Required CSS (Beginner-Friendly)

Add this CSS to ensure marquees display correctly:

```css
[data-marquee] {
  display: flex;
  overflow: hidden;
  /* Use container gap for spacing between items */
  gap: 20px;
}

/* For vertical marquees */
[data-marquee='vertical'] {
  flex-direction: column;
  height: 400px; /* Set your desired height */
}
```

The library automatically applies `flex-shrink: 0` to items.

Important spacing tip:

- Prefer container `gap` for spacing. Avoid using margins on items. Margins can make items appear to “teleport” before they fully leave the container because the loop boundary is computed differently. Using `gap` avoids that issue and matches the loop seam spacing automatically. Seam gaps are derived from measured geometry after resizes and breakpoint changes by the helpers (no wrapper configuration needed).

## How It Works

The library automatically handles the complexity of infinite scrolling:

1. **Automatic Cloning**: When initialized, the library clones your items 3 times by default. This ensures there are always enough items to create a seamless infinite loop, regardless of your container size. Items are cloned in sequence: [1,2,3,4,5] becomes [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5].

2. **Seamless Looping**: As items scroll off one side, they're repositioned to the other side using GSAP's powerful animation engine.

3. **Responsive**: Uses percentage-based transforms, so everything adapts when the window resizes.

4. **Accessibility**: Cloned items are marked with `aria-hidden="true"` so screen readers only announce the original content.

You don't need to worry about any of this - just add your items and the library does the rest!

## Quick Start

### Basic Horizontal Marquee

```html
<div data-marquee="true">
  <div data-marquee-item="true">Logo 1</div>
  <div data-marquee-item="true">Logo 2</div>
  <div data-marquee-item="true">Logo 3</div>
  <div data-marquee-item="true">Logo 4</div>
  <div data-marquee-item="true">Logo 5</div>
</div>
```

### Vertical Marquee

```html
<div data-marquee="vertical">
  <div data-marquee-item="true">Testimonial 1</div>
  <div data-marquee-item="true">Testimonial 2</div>
  <div data-marquee-item="true">Testimonial 3</div>
</div>
```

### With Options

```html
<div
  data-marquee="true"
  data-marquee-speed="2"
  data-marquee-reverse
  data-marquee-effect="pause"
>
  <div data-marquee-item="true">Item 1</div>
  <div data-marquee-item="true">Item 2</div>
  <div data-marquee-item="true">Item 3</div>
</div>
```

## Configuration Options

All options are set using data attributes on the container element.

### `data-marquee`

- **Values:** `"true"` or `"vertical"`
- **Required:** Yes
- **Description:** Initializes the marquee. Use `"true"` for horizontal scrolling or `"vertical"` for vertical scrolling.

```html
<div data-marquee="true">...</div>
<div data-marquee="vertical">...</div>
```

### `data-marquee-item`

- **Values:** `"true"`
- **Required:** Yes (on child elements)
- **Description:** Marks which elements should be animated in the loop.

```html
<div data-marquee-item="true">Content here</div>
```

### `data-marquee-speed`

- **Values:** Any positive number
- **Default:** `1`
- **Description:** Speed multiplier where 1 equals approximately 100 pixels per second. Use `2` for double speed, `0.5` for half speed, etc.

```html
<div data-marquee="true" data-marquee-speed="2">...</div>
```

### `data-marquee-reverse`

- **Values:** Boolean (attribute presence)
- **Default:** `false`
- **Description:** Reverses the scroll direction. For horizontal: right-to-left instead of left-to-right. For vertical: bottom-to-top instead of top-to-bottom.

```html
<div data-marquee="true" data-marquee-reverse>...</div>
```

### Interaction on Hover

Enable smooth pause or slow when hovering. Nothing happens by default unless an effect is set.

#### `data-marquee-effect`

- **Values:** `"pause"` | `"slow"`
- **Default:** not set (no hover effect)
- **Description:** Selects what happens when hovering the marquee.

#### `data-marquee-effect-trigger`

- **Values:** `"container"` | `"items"`
- **Default:** `"container"`
- **Description:** Where hovering applies. `container` means anywhere over the marquee. `items` means only when hovering an item.

#### `data-marquee-ramp-ratio`

- **Values:** number ≥ 0 (fraction of normal speed)
- **Defaults:** pause → `0.1`, slow → `0.25`
- **Description:** Target speed fraction during hover. In `pause` mode, this is a mid-ramp target before fully pausing.

#### `data-marquee-pause-duration`

- **Values:** seconds (number ≥ 0)
- **Default:** `0.4`
- **Description:** Total time to reach a full pause after hover begins. If a mid-ramp is used, it occurs within this time.

#### `data-marquee-slow-duration-in`

- **Values:** seconds (number ≥ 0)
- **Default:** `0.4`
- **Description:** Time to ease into the slow speed on hover.

#### `data-marquee-slow-duration-out`

- **Values:** seconds (number ≥ 0)
- **Default:** `0.3`
- **Description:** Time to ease back to normal when leaving hover.

#### `data-marquee-slow-ease-in` / `data-marquee-slow-ease-out`

- **Values:** GSAP ease names (e.g., `power2.out`)
- **Defaults:** `power2.out` (in), `power2.inOut` (out)
- **Description:** Eases used for the slow effect and pause ramp.

Notes:

- Leaving hover mid-ramp cancels the ramp and resumes toward the baseline speed (no “late pause”).
- In `pause` mode, the timeline only pauses if the pointer is still hovering at the end of the ramp.
- Reduced motion: the library respects `prefers-reduced-motion` and uses a lower baseline speed; hover only reduces further and restores to that baseline after leaving.
- Touch devices typically have no hover; this feature won’t activate on touch.

### `data-marquee-repeat`

- **Values:** Any integer
- **Default:** `-1` (infinite)
- **Description:** Number of times to repeat the animation. Use `-1` for infinite looping, or a positive number for a specific count.

```html
<div data-marquee="true" data-marquee-repeat="3">...</div>
```

### `data-marquee-auto-clone`

- **Values:** `"false"` to disable
- **Default:** Enabled (clones 3 times)
- **Description:** Controls automatic cloning of items. By default, the library clones each item 3 times to ensure seamless looping. Set to `"false"` to disable cloning if you have enough items to fill your container.

```html
<!-- Disable auto-cloning -->
<div data-marquee="true" data-marquee-auto-clone="false">...</div>
```

### `data-marquee-clone-count`

- **Values:** Any positive integer
- **Default:** `3`
- **Description:** Number of times to clone each item. Higher values create more copies (useful for very wide containers or very small items). Lower values (1 or 2) can be used if you have many items already.

```html
<!-- Clone each item 5 times instead of 3 -->
<div data-marquee="true" data-marquee-clone-count="5">...</div>
```

## Manual Control via JavaScript

The library exposes a global `window.Marquee` object for programmatic control.

### Get Marquee Instance

```javascript
const element = document.getElementById('my-marquee');
const marquee = window.Marquee.get(element);
```

### Play

```javascript
marquee.play();
```

### Pause

```javascript
marquee.pause();
```

### Destroy

```javascript
// Cleans up timeline and event listeners
marquee.destroy();
```

### Reinitialize All Marquees

```javascript
// Useful if you dynamically add marquees to the page
window.Marquee.init();
```

## Complete Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Marquee Example</title>

    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script type="module" src="path/to/marquee.js"></script>

    <style>
      [data-marquee] {
        display: flex;
        overflow: hidden;
        padding: 20px;
        gap: 20px; /* Use gap instead of margins */
        background: #f0f0f0;
      }

      [data-marquee-item] {
        padding: 20px;
        /* No margins here */
        background: white;
        border-radius: 8px;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <div
      data-marquee="true"
      data-marquee-speed="1.5"
      data-marquee-effect="pause"
      id="logo-marquee"
    >
      <div data-marquee-item="true">
        <img src="logo1.png" alt="Company 1" />
      </div>
      <div data-marquee-item="true">
        <img src="logo2.png" alt="Company 2" />
      </div>
      <div data-marquee-item="true">
        <img src="logo3.png" alt="Company 3" />
      </div>
      <div data-marquee-item="true">
        <img src="logo4.png" alt="Company 4" />
      </div>
    </div>

    <button
      onclick="window.Marquee.get(document.getElementById('logo-marquee')).pause()"
    >
      Pause
    </button>
    <button
      onclick="window.Marquee.get(document.getElementById('logo-marquee')).play()"
    >
      Play
    </button>
  </body>
</html>
```

## Webflow Integration

Follow these steps to use the marquee library in Webflow:

### Step 1: Add GSAP Script

1. Go to your Webflow project settings
2. Navigate to **Custom Code** → **Head Code**
3. Add:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
```

### Step 2: Add Marquee Library

1. Host the library files (`marquee.js` and `seamlessLoop.js`) on a CDN or your own server
2. In **Custom Code** → **Before `</body>` tag**, add:

```html
<script type="module">
  import {
    horizontalLoop,
    verticalLoop,
  } from 'https://your-cdn.com/seamlessLoop.js';

  // Paste the entire contents of marquee.js here
  // (or import it if hosted separately)
</script>
```

Alternatively, you can paste the entire library code directly into the Before `</body>` section.

### Step 3: Structure Your Marquee in Webflow Designer

1. Add a **Div Block** for the container
2. Add custom attribute: `data-marquee` = `true`
3. Set CSS: `display: flex`, `overflow: hidden`
4. Inside, add child **Div Blocks** for each item
5. Add custom attribute to each: `data-marquee-item` = `true`

### Step 4: Add Options (Optional)

Add additional attributes to the container:

- `data-marquee-speed` = `2`
- `data-marquee-reverse` (just the name, no value)
- `data-marquee-effect="pause"` or `data-marquee-effect="slow"`

### Step 5: Publish

The marquee will automatically initialize when the page loads.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires ES6 module support. For older browsers, consider using a transpiler or the IIFE version.

## Accessibility

The library automatically respects the `prefers-reduced-motion` media query. When users have this setting enabled, animations slow down significantly to prevent motion sickness.

## Common Issues

### Items are compressing or overlapping

- Ensure container has `display: flex` and `overflow: hidden`
- The library automatically applies `flex-shrink: 0` to items

### I see too many items / items are duplicated

- The library automatically clones items 3 times by default for seamless looping
- This is normal behavior and required for the infinite scroll effect
- To reduce clones, use `data-marquee-clone-count="1"` or `data-marquee-clone-count="2"`
- To disable cloning entirely, use `data-marquee-auto-clone="false"`
- Clones are marked with `aria-hidden="true"` for accessibility

### Marquee not initializing

- Verify GSAP is loaded before the marquee library
- Check console for errors
- Ensure `data-marquee-item="true"` is on child elements

### Animation is jumpy

- Items must be measurable when the library initializes (not `display: none`)
- If loading images, consider waiting for them to load before initializing

### Multiple marquees interfering

- Each marquee is independent and stored separately
- Check that you're getting the correct element when using manual control

## Advanced Usage

### Dynamically Added Marquees

If you add marquees to the page after initial load:

```javascript
// Add your marquee HTML to the page
document.body.insertAdjacentHTML('beforeend', marqueeHTML);

// Reinitialize
window.Marquee.init();
```

### Custom Styling for Hover State

```css
[data-marquee][data-marquee-effect]:hover {
  cursor: pointer;
  opacity: 0.9;
}
```

### Responsive Speed

Use CSS media queries with inline styles:

```html
<div data-marquee="true" data-marquee-speed="2" style="--marquee-speed: 2">
  ...
</div>
```

The helpers now auto-refresh on container/window resize, so manual adjustments are rarely needed. Vertical marquees also re-derive seam padding on each refresh unless an explicit `paddingBottom` is provided.

## Performance Tips

- Keep the number of items reasonable (5-15 items typically works well)
- Use CSS `will-change: transform` on items for better performance
- Avoid complex animations inside marquee items
- Consider using `IntersectionObserver` to pause marquees when off-screen

## License

This library uses GSAP, which has its own licensing terms. Please review the [GSAP license](https://greensock.com/licensing/) for commercial use.

## Credits

Built on top of the GSAP seamlessLoop helper functions by GreenSock.
