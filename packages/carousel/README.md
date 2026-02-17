<Variant title="Gallery / Portrait" id="f7c75997-4127-4d96-9d2c-97f4da766ac7" />

## Features

<Features>

- Flexible item sizing with automatic recalculations across breakpoints
- Simple setup: navigation buttons and keyboard controls work with minimal markup
- Allows for multiple carousels per page without initialization conflicts
- Native CSS gives performant, GPU-accelerated scrolling
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

  [data-carousel='track'].carousel-snap-disabled {
    scroll-snap-type: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [data-carousel='track'] {
      scroll-behavior: auto !important;
    }
  }

  /* Default alignment when no attributes set */
  [data-carousel='container']:not([data-carousel-align])
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

- `[data-carousel="container"]` – the outermost container, used for scoping a specific instance.
- `[data-carousel="track"]` – the horizontal list that houses all the items.
- `[data-carousel="item"]` – the individual slides.

The purpose of the `[data-carousel="container"]` element is three-fold:

- **It allows for automatic unique instance detection**. Translation: you can simply have elements like the previous/next navigation buttons exist within the `[data-carousel="container"]` , and the code already knows those buttons are for _that_ specific carousel. It won't randomly start moving another carousel on another part of the page.
- **It works perfectly with Webflow CMS.** How do you get navigation buttons inside Webflow's Collection List if you can't put non-CMS things inside a Collection List? Exactly. Now you can.
- **Flexibility for future features.** Wink.

> [!IMPORTANT]
> You can put whatever you want inside of the `[data-carousel="container"]` element. The `[data-carousel="track"]` can be nested arbitrarily deep.
>
> The only restraints: there can only be one carousel within a container, and all the `[data-carousel="item"]` elements must be **direct children** of the track.

### Webflow CMS

To match up with the Webflow Collection List structure:

1. `[data-carousel="container"]` – goes **on** the `Collection List Wrapper` (if you don't care for navigation buttons), or anywhere as an ancestor of the `Collection List Wrapper`.
2. `[data-carousel="track"]` – goes on the `Collection List`
3. `[data-carousel="item"]` – goes on the (you guessed it!) `Collection List Item`

```html
<div data-carousel="container">
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
| `data-carousel`          | `"container"`                    | -         | Required on container element |
| `data-carousel`          | `"track"`                        | -         | Required on track element     |
| `data-carousel`          | `"item"`                         | -         | Required on each item element |
| `data-carousel-align`    | `"start"` / `"center"` / `"end"` | `"start"` | Snap alignment of items       |
| `data-carousel-keyboard` | `"true"` / `"false"`             | `"false"` | Enable keyboard navigation    |

### Navigation Elements

Optional navigation controls that work automatically when placed inside the container:

| Attribute              | Description     |
| ---------------------- | --------------- |
| `data-carousel="prev"` | Previous button |
| `data-carousel="next"` | Next button     |

### Pagination

Add pagination dots anywhere inside the carousel container. The library finds all `[data-carousel-dot]` elements and clones the first one to match the total item count.

```html
<div data-carousel="container">
  <div data-carousel="track">
    <div data-carousel="item">...</div>
    <div data-carousel="item">...</div>
    <div data-carousel="item">...</div>
  </div>
  <div class="my-pagination-styles">
    <button data-carousel-dot></button>
  </div>
</div>
```

| Attribute                          | Description                                            |
| ---------------------------------- | ------------------------------------------------------ |
| `data-carousel-dot`                | Individual dot element (first one is used as template) |
| `data-carousel-pagination-current` | Element that displays current slide number (1-based)   |
| `data-carousel-pagination-total`   | Element that displays total slide count                |

For custom pagination displays like "2 of 5":

```html
<div class="my-pagination-styles">
  <button data-carousel-dot></button>
</div>
<div>
  <span data-carousel-pagination-current></span>
  of
  <span data-carousel-pagination-total></span>
</div>
```

The library automatically adds `aria-label="Go to slide X of Y"` and `aria-current="true"` on the active dot for accessibility.

### Keyboard Navigation

When enabled, `Arrow Left` and `Arrow Right` navigate between items. For those with huge keyboards, `Home` jumps to first item and `End` jumps to the last item.

To enable keyboard navigation:

```html
<div data-carousel="container" data-carousel-keyboard="true">
  <!-- Rest of the track/items -->
</div>
```

### Spacing and Positioning

Use CSS `gap` on the `[data-carousel="track"]` to control spacing.

The library also works with CSS [`scroll-padding`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding) (container insets) and [`scroll-margin`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin) (per-item offsets) for controlling snap positioning. For the variants on this page, all of them have `scroll-padding` on the track element.

### CSS Custom Properties

The library exposes state as CSS custom properties on the container element. Use these for dynamic styling without JavaScript.

| Property              | Values     | Description                          |
| --------------------- | ---------- | ------------------------------------ |
| `--carousel-index`    | `1, 2, 3…` | Current slide number (1-based)       |
| `--carousel-total`    | `1, 2, 3…` | Total number of slides               |
| `--carousel-progress` | `0` – `1`  | Scroll progress through the carousel |

Example: a progress bar that fills as you scroll through the carousel.

```css
.carousel-progress-bar {
  width: calc(var(--carousel-progress) * 100%);
  height: 2px;
  background: currentColor;
  transition: width 150ms ease-out;
}
```

## State Classes

The library applies state classes that you can style however you want.

| Class                       | Applied to                                                            |
| --------------------------- | --------------------------------------------------------------------- |
| `.carousel-item-active`     | The item that is currently active (i.e. aligned)                      |
| `.carousel-button-disabled` | Navigation buttons at start/end boundaries                            |
| `.carousel-scrolling`       | The track while a user or programmatic scrolling is active            |
| `.carousel-snap-disabled`   | The track to temporarily disable scroll-snap during button navigation |
| `.carousel-animating`       | The track during programmatic scroll animations                       |
| `.carousel-dot-active`      | The active pagination dot                                             |

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
[data-carousel='container'] .carousel_arrow.carousel-button-disabled {
  cursor: default;
  opacity: 0.5;
}

/* Brighten up the not-disabled arrow on hover */
.carousel_arrow:not(.carousel-button-disabled):hover {
  color: color-mix(in srgb, currentColor 100%, transparent);
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

Available events:

| Event         | Description            | Event Data       |
| ------------- | ---------------------- | ---------------- |
| `change`      | Active item changed    | `{ index }`      |
| `scroll`      | Track scrolled         | `{ scrollLeft }` |
| `reach-start` | Scrolled to first item | -                |
| `reach-end`   | Scrolled to last item  | -                |

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

## FAQ

<Accordions>

<Accordion title="Does it work vertically?">Not yet. Wink.</Accordion>

<Accordion title="How do I style my navigation buttons at the edges?">
The library automatically adds the `.carousel-button-disabled` class when at the start or end. Style that class however you like.

```css
button[data-carousel].carousel-button-disabled {
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

<Accordion title="Why do you call it 'Carousel' instead of 'Slider'?">
  Great question. I called it Slider my whole life (I still do), but I learned
  it's not the right semantics. The browser world (like Chrome and Mozilla devs)
  call it "Carousel" since "Slider" is reserved for things like an [input range
  slider.](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range)
  And I might want to make an input range slider component in the future. So I
  had to lock in and leave the `/slider` URL free.
</Accordion>

</Accordions>
