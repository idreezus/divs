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

The library automatically detects direction changes and rebuilds the animation seamlessly.

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
  data-marquee-hover-speed-ratio="0.3"
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
| `data-marquee-speed` | number | `0.7` | Speed multiplier (higher = faster) |
| `data-marquee-reverse` | `"true"` | - | Reverses animation direction |

### Cloning Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-marquee-auto-clone` | `"true"` / `"false"` | `"true"` | Auto-clone items for seamless loops |
| `data-marquee-clone-count` | number | `2` | Number of clone sets to create |

### Hover Effect Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-marquee-hover-effect` | `"pause"` / `"slow"` | - | Type of hover effect |
| `data-marquee-hover-trigger` | `"container"` / `"items"` | `"container"` | Where hover is detected |
| `data-marquee-hover-speed-ratio` | 0-1 | `0.3` (slow)<br>`0.1` (pause) | Target speed during hover |
| `data-marquee-hover-pause-duration` | seconds | `0.4` | Duration to ramp to pause |
| `data-marquee-hover-duration-in` | seconds | `0.7` | Slow effect ramp in duration |
| `data-marquee-hover-duration-out` | seconds | `0.25` | Slow effect ramp out duration |
| `data-marquee-hover-ease-in` | GSAP ease | `"power1.out"` | Ramp in easing function |
| `data-marquee-hover-ease-out` | GSAP ease | `"power1.out"` | Ramp out easing function |

## JavaScript API

Control marquees programmatically:

```javascript
// Get a marquee instance
const marquee = window.Marquee.get(element);

// Control playback
marquee.play();
marquee.pause();

// Destroy instance
marquee.destroy();

// Initialize all marquees (called automatically on load)
window.Marquee.init();

// Initialize with custom selector
window.Marquee.init('.custom-selector');
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

- **"GSAP is required but not found"** - Load GSAP before the marquee library
- **"No containers found"** - Ensure containers have `data-marquee="true"`
- **"No items found"** - Add `data-marquee-item="true"` to child elements

### Gap at loop point

The library uses intelligent gap detection, but you can help it by:

- Using CSS `gap` property instead of margins
- Ensuring consistent spacing between items
- Avoiding complex nested layouts

### Jerky animation

- Ensure `overflow: hidden` is set on the container
- Avoid animating other properties on the same elements
- Check for CSS transitions that might conflict

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

1. **Direction Detection** - Reads `flex-direction` from computed styles
2. **Auto-Cloning** - Duplicates items to ensure seamless loops
3. **Gap Calculation** - Measures spacing between items using DOM geometry
4. **GSAP Timeline** - Creates optimized animation with proper seam padding
5. **Responsive Updates** - Internal ResizeObserver handles window resizes

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
