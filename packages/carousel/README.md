# Carousel

A lightweight, CSS-first carousel library built on native browser scroll snap.

## Features

- Native CSS scroll snap for smooth, GPU-accelerated scrolling
- Uses `scrollIntoView()` for programmatic navigation
- Respects `scroll-padding` and `scroll-margin` for flexible positioning
- Optional keyboard navigation (Arrow keys, Home, End)
- Pagination with auto-generated dots
- Multiple carousels per page
- Responsive with automatic recalculation
- Works with variable-width items
- Framework-agnostic, zero dependencies

## Installation

Include the stylesheet and script:

```html
<link rel="stylesheet" href="path/to/carousel.css" />
<script src="path/to/carousel.min.js"></script>
```

## Basic Usage

### HTML Structure

```html
<div data-carousel="container">
  <div data-carousel="track">
    <div data-carousel="item">Item 1</div>
    <div data-carousel="item">Item 2</div>
    <div data-carousel="item">Item 3</div>
  </div>

  <button data-carousel="prev">Previous</button>
  <button data-carousel="next">Next</button>

  <div data-carousel="pagination">
    <button data-carousel="dot"></button>
  </div>
</div>
```

### CSS

The library handles scroll behavior. You control the visuals:

```css
/* Required: Set item dimensions */
[data-carousel='item'] {
  width: 300px;
}

/* Required: Set spacing between items */
[data-carousel='track'] {
  gap: 16px;
}

/* Optional: Style buttons and dots */
[data-carousel='prev'],
[data-carousel='next'] {
  /* Your button styles */
}

[data-carousel='dot'] {
  /* Your dot styles */
}

[data-carousel='dot'].carousel-active {
  /* Active dot styles */
}
```

The carousel auto-initializes on page load. No JavaScript configuration needed.

## Configuration

### Snap Alignment

Control how items align when scrolled into view:

```html
<!-- Align to start (default) -->
<div data-carousel="container" data-carousel-align="start">
  <!-- Center items -->
  <div data-carousel="container" data-carousel-align="center">
    <!-- Align to end -->
    <div data-carousel="container" data-carousel-align="end"></div>
  </div>
</div>
```

### Keyboard Navigation

Enable arrow key navigation:

```html
<div data-carousel="container" data-carousel-keyboard="true">
  <!-- items -->
</div>
```

When enabled:

- `Arrow Left` / `Arrow Right` navigate between items
- `Home` jumps to first item
- `End` jumps to last item

## Spacing and Positioning

Use CSS `gap` on the track to space items:

```css
[data-carousel='track'] {
  gap: 16px;
}
```

The library respects CSS [`scroll-padding`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding) (container insets) and [`scroll-margin`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin) (per-item offsets) for controlling snap positioning. Use these properties for "peeking" layouts or adjusting snap points.

## Pagination

Provide at least one dot element. The library duplicates it to match the number of items:

```html
<div data-carousel="pagination">
  <button data-carousel="dot"></button>
</div>
```

The library clones dots to match the slide count, normalizes them to `<button>` elements, adds click handlers, and applies the `.carousel-active` class to the current dot.

## Responsive Behavior

Item widths can change at breakpoints:

```css
[data-carousel='item'] {
  width: 350px; /* Desktop */
}

@media (max-width: 768px) {
  [data-carousel='item'] {
    width: 280px; /* Tablet */
  }
}

@media (max-width: 480px) {
  [data-carousel='item'] {
    width: 220px; /* Mobile */
  }
}
```

The library uses `ResizeObserver` to detect changes and automatically recalculates positions and boundaries.

## Variable-Width Items

Items can have different widths:

```html
<div data-carousel="track">
  <div data-carousel="item" style="width: 300px;">Narrow</div>
  <div data-carousel="item" style="width: 500px;">Wide</div>
  <div data-carousel="item" style="width: 400px;">Medium</div>
</div>
```

Active item detection works with mixed widths.

## Multiple Carousels

Run multiple independent carousels on one page:

```html
<div data-carousel="container">
  <!-- First carousel -->
</div>

<div data-carousel="container">
  <!-- Second carousel -->
</div>
```

Each carousel gets a unique ID (`data-carousel-id`) for debugging.

## State Classes

The library applies functional state classes you can style:

| Class                     | Applied To | When                             |
| ------------------------- | ---------- | -------------------------------- |
| `.carousel-active`        | Item       | Item is currently active         |
| `.carousel-active`        | Dot        | Dot represents active item       |
| `.carousel-disabled`      | Button     | Button is disabled (at boundary) |
| `.carousel-scrolling`     | Track      | User is actively scrolling       |
| `.carousel-animating`     | Track      | Programmatic scroll in progress  |
| `.carousel-snap-disabled` | Track      | Scroll snap temporarily disabled |

Example:

```css
/* Fade inactive items */
[data-carousel='item']:not(.carousel-active) {
  opacity: 0.6;
}

/* Hide disabled buttons */
button[data-carousel].carousel-disabled {
  opacity: 0.3;
  pointer-events: none;
}
```

## JavaScript API

### Manual Initialization

```javascript
// Auto-initializes on page load by default
// Or manually initialize:
const carousel = new Carousel(
  document.querySelector('[data-carousel="container"]')
);

// Or using selector:
const carousel = Carousel.init('.my-carousel');
```

### Instance Methods

```javascript
carousel.next(); // Go to next item
carousel.prev(); // Go to previous item
carousel.goTo(2); // Go to specific index (0-based)
carousel.getActiveIndex(); // Returns current index
carousel.refresh(); // Recalculate dimensions and update
carousel.destroy(); // Clean up and remove listeners
```

All methods are chainable:

```javascript
carousel.next().next().refresh();
```

### Events

Listen to carousel events:

```javascript
carousel.on('change', (e) => {
  console.log(`Active item: ${e.index}`);
});

carousel.on('scroll', (e) => {
  console.log(`Scroll position: ${e.scrollLeft}px`);
});

carousel.on('reach-start', () => {
  console.log('At first item');
});

carousel.on('reach-end', () => {
  console.log('At last item');
});

// Remove listener
carousel.off('change', handler);
```

Or use native DOM events:

```javascript
container.addEventListener('carousel:change', (e) => {
  console.log(e.detail); // { carousel, index }
});
```

### Global Registry

Access all carousel instances:

```javascript
// Get all instances
const instances = window.CarouselInstances;

// Get specific instance by ID
const carousel = instances.get('carousel-1');

// Iterate over all
instances.forEach((carousel) => {
  console.log(carousel.id, carousel.getActiveIndex());
});
```

### Dynamic Content

When adding/removing items, call `refresh()`:

```javascript
const track = carousel.track;
const newItem = document.createElement('div');
newItem.setAttribute('data-carousel', 'item');
newItem.textContent = 'New Item';
track.appendChild(newItem);

carousel.refresh(); // Recalculate positions
```

For major structural changes, destroy and reinitialize:

```javascript
carousel.destroy();
const newCarousel = new Carousel(container);
```

## Accessibility

The library doesn't add ARIA roles or labels. You control all accessibility features including semantic HTML, ARIA attributes, and screen reader announcements based on your specific use case.

## Performance

Built-in optimizations:

- Debounced scroll handling (100ms)
- Debounced resize handling (150ms)
- RequestAnimationFrame batching for DOM updates
- Button cooldown (300ms) to prevent rapid clicks

These values are configured in `src/config.js` and can be adjusted:

```javascript
export const TIMING = {
  DEBOUNCE_RESIZE: 150,
  DEBOUNCE_SCROLL: 100,
  BUTTON_COOLDOWN: 300,
  SNAP_DISABLE_DURATION: 50,
};
```

## Browser Support

Requires modern browsers with:

- CSS Scroll Snap
- ResizeObserver
- Smooth scrolling

Includes recent versions of Chrome, Firefox, Safari, and Edge. IE11 is not supported.

## Examples

See the `examples/` directory for complete demos:

- `basic.html` - Simple carousel with prev/next buttons
- `pagination.html` - Pagination dots
- `multiple.html` - Multiple carousels on one page
- `responsive.html` - Responsive item widths
- `keyboard.html` - Keyboard navigation
- `accessible.html` - Accessibility implementation example

## How It Works

This library is designed around native browser capabilities:

- **CSS Scroll Snap** handles alignment automatically
- **scrollIntoView()** provides smooth programmatic navigation
- **scroll-padding** and **scroll-margin** control snap positioning
- **JavaScript** manages state, events, and UI updates

By leveraging native features, the carousel gets GPU acceleration and browser optimizations for free. Less JavaScript, better performance, smoother scrolling.

## FAQ

**Why use this instead of other carousel libraries?**

This library uses native browser scroll behavior instead of JavaScript transforms, making it faster and smoother with less code.

**Can I customize the animation duration?**

The library uses native `scroll-behavior: smooth`, so animation timing is controlled by the browser. For custom timing, you'd need to implement custom scrolling instead of using the native behavior.

**Does it work vertically?**

Not currently. The library is designed for horizontal scrolling only.

**How do I disable buttons at boundaries?**

The library automatically adds the `.carousel-disabled` class and sets the `disabled` attribute when at the start or end. Style accordingly:

```css
button[data-carousel].carousel-disabled {
  opacity: 0.3;
  pointer-events: none;
}
```

**Can I start at a specific item?**

Yes, call `goTo()` after initialization:

```javascript
const carousel = Carousel.init('.my-carousel');
carousel.goTo(2); // Start at third item
```

**What if my carousel is initially hidden?**

The library skips calculations when `container.offsetParent === null`. Call `refresh()` when the carousel becomes visible:

```javascript
// When showing carousel
carousel.refresh();
```

**How do I debug issues?**

Check the console for warnings. The library logs clear messages when required elements are missing. Each carousel also has a `data-carousel-id` attribute for easier debugging in DevTools.
