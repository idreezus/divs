<Variant title="Gallery / Portrait" id="f7c75997-4127-4d96-9d2c-97f4da766ac7" />

## Features

<Features>

- Flexible item sizing with automatic recalculations across breakpoints
- Simple setup: navigation buttons and keyboard controls work with minimal markup
- Allows for multiple carousels per page without initialization conflicts
- Native CSS gives performant, GPU-accelerated scrolling
- Loop mode for infinite-style navigation
- Timed autoplay with configurable duration and smart pause/resume behavior
- Javascript API and events available for complex builds

</Features>

## Setup

<Steps>
<Step number="1" title="Load the Script">
Copy & paste this script in your Page Settings **Before `</body>` tag**

```html
<!-- Divs Carousel Library -->
<script src="https://cdn.jsdelivr.net/gh/idreezus/divs@v1.1.0/dist/carousel/v1.1.0/carousel.min.js"></script>
```

</Step>

<Step number="2" title="Add the Styles">
Copy & paste this in an embed element or your Page Settings **Inside `<head>` tag**

```html
<style>
  /* Things you could change */
  :root {
    --site-max-width: 80rem; /* your site's container width here */
    --site-padding: 2.5rem; /* your site's padding here */
  }

  @media (max-width: 767px) {
    :root {
      --site-padding: 1.25rem; /* your site's padding on mobile (landscape) and below */
    }
  }

  /*
*	Things for nerds
*/

  /* Variables used in the `.carousel_track` `.carousel_track.is-breakout` classes */
  :root {
    --carousel-scroll-padding: calc(
      (100% - min(var(--site-max-width), 100% - var(--site-padding) * 2)) / 2
    );
    --carousel-scroll-padding-breakout: calc(
      (100vw - min(var(--site-max-width), 100vw - var(--site-padding) * 2)) / 2
    );
  }

  @media (max-width: 767px) {
    :root {
      --carousel-scroll-padding: calc(
        (100% - min(var(--site-max-width), 100% - var(--site-padding) * 2)) / 2
      );
      --carousel-scroll-padding-breakout: calc(
        (100vw - min(var(--site-max-width), 100vw - var(--site-padding) * 2)) /
          2
      );
    }
  }

  /* Hide scrollbar in WebKit browsers */
  [data-carousel='track']::-webkit-scrollbar {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [data-carousel='track'] {
      scroll-behavior: auto !important;
    }
  }

  /* Default alignment when no attributes set */
  [data-carousel-container]:not([data-carousel-align])
    [data-carousel='item'] {
    scroll-snap-align: start;
  }

  [data-carousel-align='start'] [data-carousel='item'] {
    scroll-snap-align: start;
  }

  [data-carousel-align='center'] [data-carousel='item'] {
    scroll-snap-align: center;
  }

  [data-carousel-align='end'] [data-carousel='item'] {
    scroll-snap-align: end;
  }

  /* Screen reader only utility for visually hidden live region */
  .carousel-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
```

</Step>

<Step number="3" title="That's all folks!">
Grab a variant below, or continue reading the documentation if you want to learn more (pls do it's hard to write documentation).
</Step>
</Steps>

---

## How It Works

I started coding a carousel library on top of [SwiperJS](https://swiperjs.com/) for days until I remembered how difficult it always is to work with – especially when it came to controlling the styling. So I threw that library in the trash.

This new library was made to be easy to work with (especially on Webflow) without fighting unexpected Javascript shenanigans. You style things like always and control item sizes and spacing with standard CSS properties.

In the background, `ResizeObserver` detects changes and automatically recalculates positions and boundaries. CSS Scroll Snap handles alignment. `scrollIntoView()` provides the smooth programmatic navigation.

The benefit of leveraging native browser features instead of a library like SwiperJS is that the carousel gets GPU acceleration and performance optimizations for free. And it's just smoother. Less JavaScript, better performance, smoother scrolling.

### Structure

There's three elements required:

- `[data-carousel-container]` – the outermost container, used for scoping a specific instance.
- `[data-carousel-track]` – the horizontal list that houses all the items.
- `[data-carousel-item]` – the individual items.

The purpose of the `[data-carousel-container]` element is three-fold:

- **It allows for automatic unique instance detection**. Translation: you can simply have elements like the previous/next navigation buttons exist within the `[data-carousel-container]` , and the code already knows those buttons are for _that_ specific carousel. It won't randomly start moving another carousel on another part of the page.
- **It works perfectly with Webflow CMS.** How do you get navigation buttons inside Webflow's Collection List if you can't put non-CMS things inside a Collection List? Exactly. Now you can.
- **Flexibility for future features.** Wink.

> [!IMPORTANT]
> You can put whatever you want inside of the `[data-carousel-container]` element. The `[data-carousel-track]` can be nested arbitrarily deep.
>
> The only restraints: there can only be one carousel within a container, and all the `[data-carousel-item]` elements must be **direct children** of the track.

### Webflow CMS

To match up with the Webflow Collection List structure:

1. `[data-carousel-container]` – goes **on** the `Collection List Wrapper` (if you don't care for navigation buttons), or anywhere as an ancestor of the `Collection List Wrapper`.
2. `[data-carousel-track]` – goes on the `Collection List`
3. `[data-carousel-item]` – goes on the (you guessed it!) `Collection List Item`

```html
<div data-carousel-container>
  <div data-carousel="track">
    <div data-carousel="item">Item 1</div>
    <div data-carousel="item">Item 2</div>
    <div data-carousel="item">Item 3</div>
  </div>
  <div>
    <button data-carousel="prev">Previous</button>
    <button data-carousel="next">Next</button>
  </div>
</div>
```

<SpecialHeading tag="h2" className="animate-pulse text-center">
  ## Variants
</SpecialHeading>

<SpecialHeading
tag="h3"
className="-md:mt-6 -lg:mt-8 -mt-4 mb-4 text-center text-muted-foreground md:mb-6"

>

### Content Cards

</SpecialHeading>

<GridItem size="lg" className="flex flex-col gap-16 md:gap-24">

<Variant
  title="Content / Medium (with Details)"
  id="69649380-c16c-42bd-a568-7a04b535f1ae"
/>

<Variant
  title="Content / Small (with Details)"
  id="840380a9-daae-46da-a593-fbae7c2671e7"
/>

<Variant
  title="Content / Large (with Details)"
  id="0802651b-d7f2-495f-a6af-311ae8811695"
/>

<Variant title="Content / Small" id="64029c09-dc65-414e-ac65-bd2caa5a3e04" />

<Variant title="Content / Large" id="6b687e14-792d-41d4-a6ee-7c919b641b6d" />

<Variant title="Content / Medium" id="5d53003d-4336-4286-b063-a162fa623cb6" />

</GridItem>

<SpecialHeading tag="h3" className="py-4 text-center md:py-6">
  ### Feature Cards
</SpecialHeading>

<GridItem size="lg" className="flex flex-col gap-8 md:gap-16 lg:gap-24">

<Variant title="Features / 4 by 5" id="bd91708d-852e-4c18-b998-83f2fe543efe" />

<Variant
  title="Features / Landscape"
  id="6759047b-346d-4bf8-971c-681f9b3e9314"
/>

</GridItem>

<SpecialHeading tag="h3" className="py-4 text-center md:py-6">
  ### Galleries
</SpecialHeading>

<GridItem size="lg" className="flex flex-col gap-8 md:gap-16 lg:gap-24">

<Variant title="Gallery / Portrait" id="f7c75997-4127-4d96-9d2c-97f4da766ac7" />

<Variant
  title="Gallery / Widescreen"
  id="c83aea6b-7875-4c1e-847b-ff86e2fe5cf6"
/>

<Variant title="Gallery / Square" id="e31a3e5f-8be6-4a2b-9ebd-01410d3522d2" />

</GridItem>

<SpecialHeading tag="h3" className="py-4 text-center md:py-6">
  ### Testimonials
</SpecialHeading>

<GridItem size="lg" className="flex flex-col gap-8 md:gap-16 lg:gap-24">

<Variant
  title="Testimonial / Quote"
  id="93078ecd-ab42-4a5f-91d2-9c7c51ce5623"
/>

<Variant title="Testimonial / Card" id="7e961eb6-1266-43e8-8e2b-cd783390de9a" />

</GridItem>

## Customization

### Core Attributes

Configure the carousel with data attributes on the container element:

| Attribute                | Values                           | Default   | Description                   |
| ------------------------ | -------------------------------- | --------- | ----------------------------- |
| `data-carousel-container`| presence (skip with `"false"`)   | -         | Required on container element |
| `data-carousel-track`   | presence (skip with `"false"`)   | -         | Required on track element     |
| `data-carousel-item`    | presence (skip with `"false"`)   | -         | Required on each item element |
| `data-carousel-align`    | `"start"` / `"center"` / `"end"` | `"start"` | Snap alignment of items       |
| `data-carousel-keyboard` | presence (skip with `"false"`)   | -         | Enable keyboard navigation    |
| `data-carousel-loop`     | presence (skip with `"false"`)   | -         | Loop from last item to first (and vice versa) |
| `data-carousel-scroll-by`| `"item"` / `"page"`              | `"item"`  | Navigate by single item or full page of visible items |

### Loop

Enable infinite-style navigation so the carousel wraps around when reaching either end. When loop is active, the previous/next buttons are never disabled.

```html
<div data-carousel-container data-carousel-loop>
  <!-- ... -->
</div>
```

Loop applies to all forms of navigation: buttons, keyboard, scroll markers, autoplay, and the JavaScript API.

### Scroll-by

By default, the carousel advances one item at a time. Set `data-carousel-scroll-by="page"` to advance by the number of items currently visible in the viewport. This is useful for multi-item carousels where you want to scroll a full "page" of content at once.

```html
<div data-carousel-container data-carousel-scroll-by="page">
  <!-- ... -->
</div>
```

The page calculation uses the actual container width, so it works correctly with variable-width items and across breakpoints.

### Navigation Elements

Optional navigation controls that work automatically when placed inside the container:

| Attribute              | Description     |
| ---------------------- | --------------- |
| `data-carousel-prev`    | Previous button |
| `data-carousel-next`    | Next button     |
| `data-carousel-restart` | Restart button (go to first item + play) |

### Scroll Markers

Add scroll markers anywhere inside the carousel container. The library finds all `[data-carousel-marker]` elements and clones the first one to match the number of navigable positions.

> [!NOTE]
> When items are narrower than the container (multi-item carousels), the last few items may share the same scroll position due to the browser's scroll ceiling. The library detects this and groups them into a single "snap position." Marker count reflects navigable positions, not raw item count. A console warning is logged when `loop` or `autoplay` is enabled with unreachable items. To make every item individually reachable, use wider items or add `padding-inline-end` to the track.

```html
<div data-carousel-container>
  <div data-carousel="track">
    <div data-carousel="item">...</div>
    <div data-carousel="item">...</div>
    <div data-carousel="item">...</div>
  </div>
  <div class="my-marker-styles">
    <button data-carousel-marker></button>
  </div>
</div>
```

| Attribute                          | Description                                            |
| ---------------------------------- | ------------------------------------------------------ |
| `data-carousel-marker`             | Individual marker element (first one is used as template) |
| `data-carousel-counter-current`    | Element that displays current item number (1-based)    |
| `data-carousel-counter-total`      | Element that displays total navigable positions        |

For custom counter displays like "2 of 5":

```html
<div class="my-marker-styles">
  <button data-carousel-marker></button>
</div>
<div>
  <span data-carousel-counter-current></span>
  of
  <span data-carousel-counter-total></span>
</div>
```

The library automatically adds `aria-label="Scroll to item X of Y"` and `aria-current="true"` on the active marker for accessibility.

Scroll markers use roving tabindex for keyboard navigation. Only the active marker is in the tab order — pressing Tab skips past inactive markers. When a marker has focus, `Arrow Left` / `Arrow Right` move between markers (wrapping when `data-carousel-loop` is enabled), and `Home` / `End` jump to the first and last marker.

### Keyboard Navigation

When enabled, `Arrow Left` and `Arrow Right` navigate between items. For those with huge keyboards, `Home` jumps to first item and `End` jumps to the last item.

To enable keyboard navigation:

```html
<div data-carousel-container data-carousel-keyboard>
  <!-- Rest of the track/items -->
</div>
```

### Autoplay

Automatically advance items on a timer. Combine with `data-carousel-loop` for continuous cycling. Without loop, autoplay advances through all items, completes the progress animation on the last item, then stops cleanly — the container receives the `.carousel-at-end` class.

```html
<div
  data-carousel-container
  data-carousel-loop
  data-carousel-autoplay
>
  <!-- ... -->
</div>
```

#### Autoplay Attributes

| Attribute                              | Values             | Default  | Description                          |
| -------------------------------------- | ------------------ | -------- | ------------------------------------ |
| `data-carousel-autoplay`               | presence (skip with `"false"`) | -        | Enable timed autoplay               |
| `data-carousel-autoplay-duration`      | number (ms)        | `5000`   | Time per item in milliseconds        |
| `data-carousel-autoplay-pause-hover`   | presence (skip with `"false"`) | -        | Temporarily pause autoplay on track hover |
| `data-carousel-autoplay-pause-focus`   | `"true"` / `"false"` | `"true"`  | Temporarily pause autoplay on track focus |

#### Autoplay with Custom Duration

```html
<div
  data-carousel-container
  data-carousel-loop
  data-carousel-autoplay
  data-carousel-autoplay-duration="3000"
>
  <!-- Advances every 3 seconds -->
</div>
```

#### Play/Pause Button

Add a toggle button inside the container to let users control autoplay. The library manages `aria-pressed` automatically.

```html
<div
  data-carousel-container
  data-carousel-loop
  data-carousel-autoplay
>
  <div data-carousel="track">
    <div data-carousel="item">...</div>
    <div data-carousel="item">...</div>
    <div data-carousel="item">...</div>
  </div>
  <button data-carousel-play-pause>Pause</button>
</div>
```

#### Restart Button

Add a restart button to let users go back to the first item and start autoplay again. Useful for non-loop carousels where autoplay has completed.

```html
<div
  data-carousel-container
  data-carousel-autoplay
>
  <div data-carousel="track">
    <div data-carousel="item">...</div>
    <div data-carousel="item">...</div>
    <div data-carousel="item">...</div>
  </div>
  <button data-carousel-restart>Start Over</button>
</div>
```

Clicking the restart button navigates to the first item and starts autoplay fresh. The `.carousel-at-end` class is removed when autoplay restarts.

#### Pause Behavior

Autoplay uses a **stop-on-action** model. Any intentional user interaction fully stops autoplay. Only the play button (or calling `play()`) restarts it.

**Actions that stop autoplay:**

- **Navigation buttons (prev/next):** Clicking prev/next stops autoplay.
- **Marker clicks:** Clicking a marker stops autoplay.
- **Keyboard navigation:** Arrow keys, Home, and End stop autoplay.
- **Dragging/swiping:** Manually scrolling the track stops autoplay.
- **JavaScript API:** Calling `next()`, `prev()`, `goTo()`, or `stop()` stops autoplay.

**Temporary pauses (autoplay resumes automatically):**

- **Hover:** Mouse enters the track (resumes on mouse leave). Opt-in via `data-carousel-autoplay-pause-hover="true"`. Only the track area triggers this — hovering nav buttons or markers outside the track does not pause.
- **Focus:** A focusable element inside the track receives focus (resumes when focus leaves the track). Configurable via `data-carousel-autoplay-pause-focus`. Focus moving to a nav button outside the track will resume autoplay.
- **Viewport:** The carousel scrolls out of view (resumes when at least 50% is visible again). Uses `IntersectionObserver`.

#### Reduced Motion

When the user's operating system has `prefers-reduced-motion: reduce` enabled, autoplay will **not** start. The container receives the `carousel-reduced-motion` class. Calling `play()` via JavaScript is also blocked.

### Spacing and Positioning

Use CSS `gap` on the `[data-carousel-track]` to control spacing.

The library also works with CSS [`scroll-padding`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding) (container insets) and [`scroll-margin`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin) (per-item offsets) for controlling snap positioning. For the variants on this page, all of them have `scroll-padding` on the track element.

### CSS Custom Properties

The library exposes state as CSS custom properties on the container element. Use these for dynamic styling without JavaScript.

| Property                        | Values     | Set On              | Description                                 |
| ------------------------------- | ---------- | ------------------- | ------------------------------------------- |
| `--carousel-index`              | `1, 2, 3…` | Container           | Current item number (1-based)               |
| `--carousel-total`              | `1, 2, 3…` | Container           | Total navigable positions (may be fewer than item count in multi-item carousels) |
| `--carousel-progress`           | `0` – `1`  | Container           | Scroll progress through the carousel        |
| `--carousel-autoplay-progress`  | `0` – `1`  | Container + active marker | Per-item autoplay timer progress           |
| `--carousel-autoplay-duration`  | e.g. `5000ms` | Container        | Configured autoplay duration                |

Example: a progress bar that fills as you scroll through the carousel.

```css
.carousel-progress-bar {
  width: calc(var(--carousel-progress) * 100%);
  height: 2px;
  background: currentColor;
  transition: width 150ms ease-out;
}
```

Example: an autoplay progress indicator on each marker. Since `--carousel-autoplay-progress` is set on the active marker (and reset to `0` on inactive markers), you can use it directly to build a per-item timer.

```css
.carousel-marker-progress {
  transform: scaleX(var(--carousel-autoplay-progress, 0));
  transform-origin: left;
  transition: none;
}
```

## State Classes

The library applies state classes that you can style however you want.

| Class                         | Applied to                                                            |
| ----------------------------- | --------------------------------------------------------------------- |
| `.carousel-item-active`       | The item that is currently active (i.e. aligned)                      |
| `.carousel-nav-disabled`   | Navigation buttons at start/end boundaries (never applied when looping) |
| `.carousel-scrolling`         | The track while scrolling is active                                   |
| `.carousel-marker-active`     | The active scroll marker                                              |
| `.carousel-playing`           | The container while autoplay is actively running                      |
| `.carousel-at-end`            | The container when autoplay has completed on a non-loop carousel      |
| `.carousel-reduced-motion`    | The container when `prefers-reduced-motion: reduce` is active         |

Here's an example from the prev/next buttons on all the variants on this page:

```css
/* Arrow initial styles */
.carousel_arrow {
  cursor: pointer;
  transition:
    opacity 200ms ease-in-out,
    color 150ms ease-in-out;
}

/* For a disabled arrow */
[data-carousel-container] .carousel_arrow.carousel-nav-disabled {
  cursor: default;
  opacity: 0.5;
}

/* Brighten up the not-disabled arrow on hover */
.carousel_arrow:not(.carousel-nav-disabled):hover {
  color: color-mix(in srgb, currentColor 100%, transparent);
}
```

Example: style the play/pause button based on autoplay state.

```css
/* Show pause icon while playing, play icon when stopped */
.carousel-playing [data-carousel-play-pause] .play-icon {
  display: none;
}
.carousel-playing [data-carousel-play-pause] .pause-icon {
  display: block;
}
```

## JavaScript API

### Manual Initialization

```javascript
// Auto-initializes on page load by default
// Or manually initialize:
const carousel = new Carousel(
  document.querySelector('[data-carousel-container]')
);

// Or using selector:
const carousel = Carousel.init('.my-carousel');
```

### Instance Methods

```javascript
carousel.next(); // Go to next item (stops autoplay)
carousel.prev(); // Go to previous item (stops autoplay)
carousel.goTo(2); // Go to specific index (stops autoplay)
carousel.getActiveIndex(); // Returns current index
carousel.play(); // Start autoplay fresh
carousel.stop(); // Stop autoplay
carousel.refresh(); // Recalculate dimensions and update
carousel.destroy(); // Clean up and remove listeners
```

All methods are chainable (except `getActiveIndex` and `destroy`):

```javascript
carousel.next().next().refresh();
```

#### `play()`

Starts autoplay fresh with a full duration timer. Has no effect when `prefers-reduced-motion: reduce` is active. Requires `data-carousel-autoplay` on the container — logs a warning if called without it.

#### `stop()`

Stops autoplay completely. The `carousel-playing` class is removed and progress resets to 0. Only `play()` or clicking the play/pause button will restart it.

#### `goTo(index)`

Navigates to the given 0-based index. If the index is beyond the last navigable position (in multi-item carousels where the last few items share a scroll position), it is silently clamped. If autoplay is running, it is stopped.

### Events

```javascript
carousel.on('snapchange', (e) => {
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

carousel.on('autoplay-start', (e) => {
  console.log(`Autoplay started at index: ${e.index}`);
});

carousel.on('autoplay-stop', (e) => {
  console.log(`Autoplay stopped at index: ${e.index}, progress: ${e.progress}, reason: ${e.reason}`);
});

// Remove listener
carousel.off('snapchange', handler);
```

Or use native DOM events:

```javascript
container.addEventListener('carousel:snapchange', (e) => {
  console.log(e.detail); // { carousel, index }
});
```

Available events:

| Event            | Description             | Event Data              |
| ---------------- | ----------------------- | ----------------------- |
| `snapchange`     | Active item changed     | `{ index }`             |
| `scroll`         | Track scrolled          | `{ scrollLeft }`        |
| `reach-start`    | Scrolled to first item  | -                       |
| `reach-end`      | Scrolled to last item   | -                       |
| `autoplay-start` | Autoplay started/resumed | `{ index }`                    |
| `autoplay-stop`  | Autoplay stopped/paused  | `{ index, progress, reason }`  |

> [!NOTE]
> `reach-start` and `reach-end` fire based on physical scroll position, even when loop mode is enabled. They reflect the actual scroll edges, not the logical navigation boundaries.

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
newItem.setAttribute('data-carousel-item', '');
newItem.textContent = 'New Item';
track.appendChild(newItem);

carousel.refresh(); // Recalculate positions
```

For major structural changes, destroy and reinitialize:

```javascript
carousel.destroy();
const newCarousel = new Carousel(container);
```

## FAQ

<Accordions>

<Accordion title="Does it work vertically?">Not yet. Wink.</Accordion>

<Accordion title="How do I style my navigation buttons at the edges?">
The library automatically adds the `.carousel-nav-disabled` class when at the start or end. Style that class however you like. When loop mode is enabled, buttons are never disabled.

```css
button[data-carousel-prev].carousel-nav-disabled,
button[data-carousel-next].carousel-nav-disabled {
  opacity: 0.3;
  pointer-events: none;
}
```

</Accordion>

<Accordion title="Can I customize the animation duration?">
  The library uses native `scroll-behavior: smooth`, so animation timing is
  controlled by the browser. For custom timing, you'd need to implement custom
  scrolling instead of using the native behavior.
</Accordion>

<Accordion title="What if my carousel is initially hidden?">
Call `refresh()` when the carousel becomes visible:

```javascript
// When showing carousel
carousel.refresh();
```

</Accordion>

<Accordion title="Why are my buttons not working?">
  Check the console for warnings. The library logs clear messages for the most
  common situations (like missing elements). Each carousel also has a
  `data-carousel-id` attribute for easier debugging in DevTools. If you still
  have questions, feel free to reach out to me.
</Accordion>

<Accordion title="Does autoplay work without loop?">
  Yes. Autoplay advances through all items, completes the progress animation on the last item, then stops. The container receives the `.carousel-at-end` class so you can style a "finished" state. Add a `data-carousel-restart` button to let users go back to item 1 and restart autoplay. For continuous cycling, combine `data-carousel-loop` with `data-carousel-autoplay`.
</Accordion>

<Accordion title="Do navigation buttons stop autoplay?">
  Yes. Any user interaction — prev/next buttons, markers, keyboard, or drag/swipe — stops autoplay. This is by design: autoplay is a "first impression" feature that runs until the user takes control. To restart, click the play/pause button or call `play()` via JavaScript.
</Accordion>

<Accordion title="Why do you call it 'Carousel' instead of 'Slider'?">
  Great question. I called it Slider my whole life (I still do), but I learned
  it's not the right semantics. The browser world (like Chrome and Mozilla devs)
  call it "Carousel" since "Slider" is reserved for things like an [input range
  slider.](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range)
  And I might want to make an input range slider component in the future. So I
  had to lock in and leave the `/slider` URL free.
</Accordion>

</Accordions>
