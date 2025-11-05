---
description: Seamless GSAP-powered marquee animations for modern interfaces
---

# Marquee

A marquee animation library for smooth scrolling content in horizontal and vertical layouts.

## Features

- Seamless loops with no visible gaps or jumps
- Auto-pauses when off-screen to save resources
- Switches direction at breakpoints via CSS
- Built-in pause and slow hover effects
- Smart content cloning for continuous scrolling

## Installation

### Load GSAP

The marquee library requires GSAP 3.x to handle animation timelines and transforms:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
```

### Load the Library

Add the marquee script after GSAP:

```html
<script type="module" src="path/to/marquee.js"></script>
```

### Add Elements &amp; Attributes

Mark your container with `data-marquee` = `"true"` and each item with `data-marquee-item` = `"true"`:

```html
<div data-marquee="true" class="my-marquee">
  <div data-marquee-item="true">Item 1</div>
  <div data-marquee-item="true">Item 2</div>
  <div data-marquee-item="true">Item 3</div>
  <div data-marquee-item="true">Item 4</div>
</div>
```

### Add Styles

For horizontal scrolling, use `display: flex` with `overflow: hidden`:

```css
.my-marquee {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  gap: 20px;
}
```

For vertical scrolling, switch to `flex-direction: column` and add a height constraint (`height` or `max-height`):

```css
.my-marquee.vertical {
  flex-direction: column;
  max-height: 400px;
}
```

That's it—the marquee initializes when the page loads.

> [!TIP]
> Use CSS `gap` instead of margins for spacing. The library measures gaps to ensure seamless loops without visible seams.

## Examples

## How It Works

This library is designed to work with visual development tools like Webflow, where you build layouts using CSS properties through a visual interface. You control the marquee's appearance and direction using standard CSS—`flex-direction` for orientation, `gap` for spacing—while the library handles the animation complexity behind the scenes.

GSAP powers the animation timelines because it provides GPU-accelerated transforms and precise playback control, ensuring smooth motion across all devices. Flexbox makes responsive direction changes simple: change `flex-direction` at a breakpoint, and the library detects the switch and rebuilds the animation to match your new layout.

### Responsive Directions

Direction is controlled entirely through CSS `flex-direction`, making responsive layouts straightforward:

```css
.my-marquee {
  display: flex;
  flex-direction: row; /* horizontal by default */
  overflow: hidden;
}

/* At a specific breakpoint, switch to vertical */
@media (max-width: 768px) {
  .my-marquee {
    flex-direction: column;
    height: 400px;
  }
}
```

The library detects direction changes during window resize events and rebuilds the animation. Previous playback position is preserved proportionally, so users don't experience jarring jumps when resizing their browser or rotating their device.

### Hover Effects

Add interactive hover effects with simple attributes on your container element.

#### Pause Effect

Ramps speed down to a complete stop when hovering:

```html
<div data-marquee="true" data-marquee-hover-effect="pause" class="my-marquee">
  <!-- items -->
</div>
```

#### Slow Effect

Reduces speed to a slower sustained pace during hover:

```html
<div
  data-marquee="true"
  data-marquee-hover-effect="slow"
  data-marquee-hover-speed="0.3"
  class="my-marquee"
>
  <!-- items -->
</div>
```

#### Per-Item Triggering

By default, hovering anywhere on the container triggers the effect. If you want individual item hover instead (for example, to highlight specific cards or create a product showcase where only one item pauses at a time):

```html
<div
  data-marquee="true"
  data-marquee-hover-effect="pause"
  data-marquee-hover-trigger="items"
  class="my-marquee"
>
  <!-- items -->
</div>
```

All hover effects use smooth easing curves and customizable timing. The pause effect uses a two-stage ramp for a more natural deceleration.

### Spacing &amp; CSS Gaps

The library measures spacing between items to ensure seamless loops. For reliable results, use the CSS `gap` property on your container:

```css
.my-marquee {
  display: flex;
  gap: 2rem; /* Consistent spacing between items */
}
```

While the library attempts to measure margins and padding, `gap` provides the most consistent and predictable spacing. The spacing calculation uses the median gap between items, which feeds into clone positioning and timeline duration to prevent visible seams at the loop point.

### Auto-Cloning

Items are cloned to create continuous loops. The system calculates how many clone sets are needed based on:

- Container dimensions (width for horizontal, height for vertical)
- Total content size
- Spacing between items

Clone count is capped at 10 sets maximum for performance. Cloned elements are marked with `aria-hidden` = `"true"` so screen readers announce original content once.

#### Disabling Auto-Clone

If you want to manage cloning manually:

```html
<div data-marquee="true" data-marquee-auto-clone="false" class="my-marquee">
  <!-- manually duplicate your items here -->
</div>
```

#### Custom Clone Count

Override the automatic calculation:

```html
<div data-marquee="true" data-marquee-clones="3" class="my-marquee">
  <!-- items -->
</div>
```

> [!WARNING]
> Disabling auto-clone requires you to manually duplicate content enough times to fill the container and create a seamless loop. Use this only if you need precise control over the DOM structure.

## Customization

### Core Attributes

All configuration happens through `data-marquee-*` attributes on the container element:

| Attribute              | Values   | Default | Description                                                                 |
| ---------------------- | -------- | ------- | --------------------------------------------------------------------------- |
| `data-marquee`         | `"true"` | -       | Required to initialize the marquee                                          |
| `data-marquee-item`    | `"true"` | -       | Required on each child element to animate                                   |
| `data-marquee-speed`   | number   | `0.7`   | Speed multiplier where 1.0 ≈ 100px/second (higher = faster)                 |
| `data-marquee-reverse` | `"true"` | -       | Reverses the animation direction                                            |
| `data-marquee-repeat`  | number   | `-1`    | Number of loop cycles. `-1` = infinite, `0` = play once, `5` = loop 5 times |

### Hover Effects

Fine-tune hover interactions with these attributes:

| Attribute                     | Values                    | Default                         | Description                                     |
| ----------------------------- | ------------------------- | ------------------------------- | ----------------------------------------------- |
| `data-marquee-hover-effect`   | `"pause"` / `"slow"`      | -                               | Type of hover effect                            |
| `data-marquee-hover-trigger`  | `"container"` / `"items"` | `"container"`                   | Where hover is detected                         |
| `data-marquee-hover-speed`    | 0-1                       | `0.3` (slow)<br />`0.1` (pause) | Target speed during hover as fraction of normal |
| `data-marquee-hover-duration` | seconds                   | `0.4`                           | Total ramp duration for pause effect            |
| `data-marquee-hover-in`       | seconds                   | `0.7`                           | Slow effect ramp-in duration                    |
| `data-marquee-hover-out`      | seconds                   | `0.25`                          | Slow effect ramp-out duration                   |
| `data-marquee-hover-ease-in`  | GSAP ease                 | `"power1.out"`                  | Ramp-in easing function                         |
| `data-marquee-hover-ease-out` | GSAP ease                 | `"power1.out"`                  | Ramp-out easing function                        |

### Performance

#### IntersectionObserver

By default, marquees pause when scrolled out of the viewport to improve performance. Control this behavior with:

| Attribute                   | Values               | Default  | Description                |
| --------------------------- | -------------------- | -------- | -------------------------- |
| `data-marquee-intersection` | `"true"` / `"false"` | `"true"` | Pause when out of viewport |

#### Cloning Performance

Reduce clone count if you have many large items or complex layouts:

| Attribute                 | Values               | Default         | Description                    |
| ------------------------- | -------------------- | --------------- | ------------------------------ |
| `data-marquee-auto-clone` | `"true"` / `"false"` | `"true"`        | Enable automatic cloning       |
| `data-marquee-clones`     | number (1-10)        | Auto-calculated | Number of clone sets to append |

## JavaScript API

Control marquees programmatically through the global `window.Marquee` object. The library auto-initializes on page load, but you can also manage instances manually.

#### Initialization

```javascript
// Initialize all marquees (called on DOMContentLoaded)
window.Marquee.init();

// Initialize with custom selector
window.Marquee.init('.custom-marquee-class');
```

#### Getting Instances

```javascript
// Get single instance
const marquee = window.Marquee.get(element);

// Get all instances (returns array)
const allMarquees = window.Marquee.getAll();

// Check if element has a marquee
const hasMarquee = window.Marquee.has(element);
```

#### Control Methods

All batch methods are chainable:

```javascript
// Instance control
const marquee = window.Marquee.get(element);
marquee.play();
marquee.pause();
marquee.destroy();

// Batch control
window.Marquee.pauseAll();
window.Marquee.playAll('.my-marquees');
window.Marquee.destroyAll('.old-marquees');

// Manual direction refresh (useful after dynamic CSS class changes)
window.Marquee.refresh(element);
window.Marquee.refreshAll();

// Chaining
window.Marquee.pauseAll('.slow').playAll('.fast').refreshAll();
```

#### Dynamic Content Updates

When adding or removing items after initialization, destroy and reinitialize:

```javascript
const container = document.querySelector('[data-marquee]');
const instance = window.Marquee.get(container);

// Destroy existing instance
instance.destroy();

// Update content
container.innerHTML = '...'; // Add new items with data-marquee-item="true"

// Reinitialize
window.Marquee.init();
```

> [!IMPORTANT]
> If you change CSS classes that affect `flex-direction` outside of a resize event, manually trigger `window.Marquee.refresh(element)` to rebuild the animation with the new direction.

## Accessibility

The library includes built-in accessibility features to ensure marquees work well for all users. Cloned items are marked with `aria-hidden` = `"true"` so screen readers announce the original content once, preventing repetitive announcements. The library respects the `prefers-reduced-motion` media query by reducing animation speed to 10% for users who have indicated a preference for reduced motion. All semantic HTML structure is preserved, ensuring assistive technologies can navigate and understand the content regardless of animation state.

## FAQ

<div className="flex flex-col gap-2 mt-4">

<Accordion title="Why is my spacing inconsistent or showing gaps at the loop point?">
The library works best with the CSS `gap` property. While it attempts to measure margins and padding, `gap` provides the most reliable spacing calculation. Ensure you're using consistent spacing between all items—mixed spacing values can occasionally cause measurement issues that create small gaps at the loop point.
</Accordion>

<Accordion title="Can I switch between horizontal and vertical at different breakpoints?">
Yes. The marquee direction is controlled entirely by CSS `flex-direction`, so you can change it at any breakpoint. For example, use `flex-direction: row` on desktop and switch to `flex-direction: column` at a mobile breakpoint. The library detects the change during resize and rebuilds the animation to match the new layout.
</Accordion>

<Accordion title="Why isn't my vertical marquee working?">
Vertical marquees require a height constraint on the container. Use either `height` or `max-height` in CSS—as long as the total height of all cloned content exceeds the container's height, the marquee will work. Without a height constraint, the flex container expands to fit all content, leaving nothing to scroll.
</Accordion>

<Accordion title="Does the library handle errors gracefully?">
Yes. The library validates configuration during initialization and logs clear warning messages to the console when issues are detected—missing GSAP, invalid selectors, items with zero dimensions, or incorrect CSS properties. Failed instances are caught individually, so one problematic marquee won't prevent others from initializing. Each error message includes context about what went wrong and how to fix it.
</Accordion>

<Accordion title="What happens if I dynamically change the marquee's CSS class?">
If the CSS class change affects `flex-direction`, manually trigger `window.Marquee.refresh(element)` to rebuild the animation. The library detects direction changes during window resize events, but dynamic class changes outside of resize require manual refresh.
</Accordion>

<Accordion title="What browsers are supported?">
All modern browsers that support ES6 modules, CSS Flexbox, and GSAP 3.x. This includes Chrome, Firefox, Safari, and Edge (Chromium). IE11 is not supported due to ES6 module requirements and lack of modern CSS features.
</Accordion>

</div>
