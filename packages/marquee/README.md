# GSAP Marquee

A seamless, responsive marquee animation library powered by GSAP. Perfect for creating smooth horizontal and vertical scrolling content that adapts to any screen size.

## Features

- **Truly Seamless** - No visible jumps or gaps at the loop point
- **Responsive** - Automatically adapts to window resizes and content changes
- **CSS-Driven Direction** - Use flexbox properties for responsive layouts
- **Hover Effects** - Built-in pause and slow effects
- **Auto-Cloning** - Automatically duplicates content for continuous loops
- **Lightweight** - Clean, modular codebase with no dependencies beyond GSAP

## Quick Start

### 1. Load GSAP

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
```

### 2. Load the Marquee Library

```html
<script type="module" src="path/to/marquee.js"></script>
```

### 3. Add HTML

```html
<div data-marquee="true" class="my-marquee">
  <div data-marquee-item="true">Item 1</div>
  <div data-marquee-item="true">Item 2</div>
  <div data-marquee-item="true">Item 3</div>
  <div data-marquee-item="true">Item 4</div>
</div>
```

### 4. Add CSS

```css
.my-marquee {
  display: flex;
  flex-direction: row; /* horizontal scrolling */
  overflow: hidden;
  gap: 20px;
}

/* For vertical scrolling, use: */
.my-marquee.vertical {
  flex-direction: column;
  height: 400px;
}
```

That's it! The marquee will automatically initialize when the page loads.

## Responsive Direction Changes

The marquee direction is controlled by CSS `flex-direction`, making it perfect for responsive designs:

```css
.my-marquee {
  display: flex;
  flex-direction: row; /* horizontal on desktop */
  overflow: hidden;
  gap: 20px;
}

@media (max-width: 768px) {
  .my-marquee {
    flex-direction: column; /* vertical on mobile */
    height: 400px;
  }
}
```

The library automatically detects direction changes on window resize and rebuilds the animation seamlessly.

**Note:** Direction changes are detected automatically during resize events. If you need to manually trigger a direction refresh, use `window.Marquee.refresh(element)`.

## Hover Effects

Add interactive hover effects with simple attributes:

### Pause on Hover

```html
<div
  data-marquee="true"
  data-marquee-hover-effect="pause"
  class="my-marquee">
  <!-- items -->
</div>
```

### Slow on Hover

```html
<div
  data-marquee="true"
  data-marquee-hover-effect="slow"
  data-marquee-hover-speed="0.3"
  class="my-marquee">
  <!-- items -->
</div>
```

### Per-Item Hover

```html
<div
  data-marquee="true"
  data-marquee-hover-effect="pause"
  data-marquee-hover-trigger="items"
  class="my-marquee">
  <!-- items -->
</div>
```

## Configuration Options

### Core Attributes

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-marquee` | `"true"` | - | **Required** - Marks container for initialization |
| `data-marquee-item` | `"true"` | - | **Required** - Marks items to animate |
| `data-marquee-speed` | number | `0.7` | Speed multiplier where 1.0 ≈ 100px/second (higher = faster) |
| `data-marquee-reverse` | `"true"` | - | Reverses animation direction |
| `data-marquee-repeat` | number | `-1` | Number of times to loop. `-1` = infinite, `0` = play once, `5` = loop 5 times |

### Cloning Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-marquee-auto-clone` | `"true"` / `"false"` | `"true"` | Auto-clone items for seamless loops |
| `data-marquee-clones` | number | Auto-calculated | Number of clone sets (1-10). Auto-calculates if not set. |

### Hover Effect Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-marquee-hover-effect` | `"pause"` / `"slow"` | - | Type of hover effect |
| `data-marquee-hover-trigger` | `"container"` / `"items"` | `"container"` | Where hover is detected |
| `data-marquee-hover-speed` | 0-1 | `0.3` (slow)<br>`0.1` (pause) | Target speed during hover |
| `data-marquee-hover-duration` | seconds | `0.4` | Duration to ramp to pause |
| `data-marquee-hover-in` | seconds | `0.7` | Slow effect ramp in duration |
| `data-marquee-hover-out` | seconds | `0.25` | Slow effect ramp out duration |
| `data-marquee-hover-ease-in` | GSAP ease | `"power1.out"` | Ramp in easing function |
| `data-marquee-hover-ease-out` | GSAP ease | `"power1.out"` | Ramp out easing function |

## JavaScript API

Control marquees programmatically:

```javascript
// Initialize all marquees (called automatically on load)
window.Marquee.init();

// Initialize with custom selector
window.Marquee.init('.custom-selector');

// Get a single marquee instance
const marquee = window.Marquee.get(element);

// Control single instance
marquee.play();
marquee.pause();
marquee.destroy();

// Get all instances (returns array)
const allMarquees = window.Marquee.getAll();
const specificMarquees = window.Marquee.getAll('.my-marquees');

// Check if element has a marquee
const hasMarquee = window.Marquee.has(element);

// Control multiple marquees
window.Marquee.pauseAll();              // Pause all
window.Marquee.playAll('.my-marquees'); // Play specific ones
window.Marquee.destroyAll();            // Destroy all

// Manual direction refresh (for responsive breakpoints)
window.Marquee.refresh(element);        // Refresh one
window.Marquee.refreshAll();            // Refresh all

// Methods are chainable (except getters)
window.Marquee
  .pauseAll('.slow')
  .playAll('.fast')
  .refreshAll();
```

## CSS Requirements

For optimal performance, your marquee container needs:

```css
[data-marquee] {
  display: flex;           /* Required */
  overflow: hidden;        /* Required */
  gap: 20px;              /* Recommended for spacing */
}
```

Items should use:

```css
[data-marquee-item] {
  flex-shrink: 0;         /* Prevents items from compressing */
}
```

The library automatically applies `flex-shrink: 0` and `will-change: transform` for you.

## Examples

### Basic Logo Carousel

```html
<div data-marquee="true" class="logo-carousel">
  <img data-marquee-item="true" src="logo1.png" alt="Brand 1">
  <img data-marquee-item="true" src="logo2.png" alt="Brand 2">
  <img data-marquee-item="true" src="logo3.png" alt="Brand 3">
  <img data-marquee-item="true" src="logo4.png" alt="Brand 4">
</div>

<style>
  .logo-carousel {
    display: flex;
    overflow: hidden;
    gap: 40px;
    padding: 20px 0;
  }

  .logo-carousel img {
    height: 60px;
    width: auto;
  }
</style>
```

### Vertical Testimonials

```html
<div
  data-marquee="true"
  data-marquee-speed="0.5"
  data-marquee-hover-effect="pause"
  class="testimonials">
  <div data-marquee-item="true" class="testimonial">
    <p>"Amazing product!"</p>
    <cite>- Jane Doe</cite>
  </div>
  <div data-marquee-item="true" class="testimonial">
    <p>"Highly recommend!"</p>
    <cite>- John Smith</cite>
  </div>
</div>

<style>
  .testimonials {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 400px;
    gap: 30px;
  }

  .testimonial {
    padding: 30px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
</style>
```

### Reversed Marquee

```html
<div
  data-marquee="true"
  data-marquee-reverse="true"
  data-marquee-speed="2"
  class="fast-reverse">
  <div data-marquee-item="true">Fast Item 1</div>
  <div data-marquee-item="true">Fast Item 2</div>
  <div data-marquee-item="true">Fast Item 3</div>
</div>
```

## Accessibility

The library automatically handles accessibility:

- Cloned items are marked with `aria-hidden="true"` so screen readers only announce original content
- Respects `prefers-reduced-motion` by slowing animation to 10% speed
- Original semantic structure is preserved

## Browser Support

Works in all modern browsers that support:
- ES6 modules
- CSS Flexbox
- GSAP 3.x

## Troubleshooting

### Marquee not initializing

Check the console for error messages. Common issues:

- **"GSAP is required but not found"** - Load GSAP before the marquee library: `<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>`
- **"No containers found"** - Ensure containers have `data-marquee="true"`
- **"No items found"** - Add `data-marquee-item="true"` to child elements: `<div data-marquee-item="true">Content</div>`
- **"Failed to create timeline"** - Items may be hidden, have zero dimensions, or invalid CSS

### CSS Warnings

The library validates your CSS and provides warnings:

- **"Container should have display: flex"** - Add `display: flex` to your CSS or let the library apply it
- **"Container should have overflow: hidden"** - Add `overflow: hidden` to prevent content overflow
- **"Detected flex-direction row-reverse"** - Use `data-marquee-reverse="true"` instead of CSS reverse directions

### Direction not changing at breakpoints

Direction changes are detected automatically on resize. If not working:

- Ensure your CSS `flex-direction` changes at the breakpoint
- Check that the container is actually resizing
- Manually trigger with `window.Marquee.refresh(element)` if needed

### Gap at loop point

The library auto-calculates gap spacing, but you can help it by:

- Using CSS `gap` property instead of margins
- Ensuring consistent spacing between items
- Avoiding complex nested layouts

### Jerky animation

- Ensure `overflow: hidden` is set on the container
- Avoid animating other properties on the same elements
- Check for CSS transitions that might conflict
- Reduce clone count if you have many items: `data-marquee-clones="2"`

## Advanced Usage

### Custom Initialization

```javascript
// Wait for specific conditions before initializing
document.addEventListener('DOMContentLoaded', () => {
  // Your custom logic here

  window.Marquee.init();
});
```

### Rebuilding After Content Changes

```javascript
const container = document.querySelector('[data-marquee]');
const instance = window.Marquee.get(container);

// Destroy old instance
instance.destroy();

// Modify content
container.innerHTML = '...'; // Add new items

// Reinitialize
window.Marquee.init();
```

### Multiple Speeds

```html
<!-- Fast top marquee -->
<div data-marquee="true" data-marquee-speed="3" class="marquee">
  <!-- items -->
</div>

<!-- Slow bottom marquee, reversed -->
<div
  data-marquee="true"
  data-marquee-speed="0.5"
  data-marquee-reverse="true"
  class="marquee">
  <!-- items -->
</div>
```

## Technical Details

### How It Works

1. **Direction Detection** - Reads `flex-direction` from computed styles, auto-detects changes on resize
2. **Smart Cloning** - Auto-calculates optimal clone count based on container/item sizes
3. **Gap Calculation** - Measures spacing between items using DOM geometry (median of gaps)
4. **GSAP Timeline** - Creates optimized animation with proper seam padding
5. **Responsive Updates** - Internal ResizeObserver and direction change detection handle all updates

### Performance

- Uses GSAP's highly optimized animation engine
- GPU-accelerated transforms (translate/transform)
- Automatic cleanup prevents memory leaks
- Minimal DOM manipulation after initialization

### Architecture

```
src/
├── core/              - Instance management and timeline logic
├── interaction/       - Hover effect handlers
├── api/              - Public API surface
├── config/           - Configuration and parsing
└── utils/            - GSAP loop helpers
```

## License

[Your License Here]

## Credits

Built with [GSAP](https://greensock.com/gsap/) by GreenSock.
