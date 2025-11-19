# Carousel

A smooth scrolling slider that leverages native CSS for easy setup and styling.

## Features

- Works with any item sizes, even if different widths
- Navigation buttons work just by placing them in the container
- Optional keyboard navigation with a single data attribute
- Automatic recalculations for sizes & spacing that change on breakpoints
- Allows for multiple carousels per page without initialization conflicts
- Native CSS gives performant, GPU-accelerated scrolling
- Javascript API and events available for complex builds

## Setup

<Steps>
<Step number="1" title="Copy and paste the script">
Paste this script into your Page Settings "Before `</body>` tag".

```html
<!-- Divs Carousel Library -->
<script src="https://cdn.jsdelivr.net/gh/idreezus/divs@carousel-v1.0.0/dist/carousel/v1.0.0/carousel.min.js"></script>
```

</Step>

<Step number="2" title="Copy and paste the styles">
Put the required styling on your page. Either an Embed element that's placed anywhere on your page, or your Page Settings "Inside `<head>` tag".
</Step>

<Step number="3" title="That's all folks">
Snag one of the variants below, or continue reading the documentation if you want learn more.
</Step>
</Steps>

## Variants

### Content Cards

### Galleries

### Testimonials

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

## Webflow CMS

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

> [!NOTE]
> Pagination is coming very soon. Just doing some bug testing.

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

## State Classes

The library applies state classes that you can style however you want.

| Class                         | Applied to                                                            |
| ----------------------------- | --------------------------------------------------------------------- |
| `.carousel-item-active`       | The item that is currently active (i.e. aligned)                      |
| `.carousel-button-disabled`   | Navigation buttons at start/end boundaries                            |
| `.carousel-scrolling`         | The track while a user or programmatic scrolling is active            |
| `.carousel-snap-disabled`     | The track to temporarily disable scroll-snap during button navigation |
| `.carousel-animating`         | The track during programmatic scroll animations                       |
| `.carousel-pagination-active` | The active pagination dot                                             |

Here's an example from the prev/next buttons on all the variants on this page:

```css
/* Arrow initial styles */
.carousel_arrow {
  cursor: pointer;
  transition: opacity 200ms ease-in-out, color 150ms ease-in-out;
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

<Accordion title="Why do you call it 'Carousel' instead of 'Slider'?">
Great question. I called it Slider my whole life (I still do), but I learned it's not the right semantics. The browser world (like Chrome and Mozilla devs) call it "Carousel" since "Slider" is reserved for things like an [input range slider.](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range) And I might want to make an input range slider component in the future. So I had to lock in and leave the `/slider` URL free.
</Accordion>

<Accordion title="Does it work vertically?">
Not yet. Wink.
</Accordion>

<Accordion title="How do I style my navigation buttons at the boundaries?">
The library automatically adds the `.carousel-button-disabled` class when at the start or end. Style that class however you like.

```css
button[data-carousel].carousel-button-disabled {
  opacity: 0.3;
  pointer-events: none;
}
```

</Accordion>

<Accordion title="Can I customize the animation duration?">
The library uses native `scroll-behavior: smooth`, so animation timing is controlled by the browser. For custom timing, you'd need to implement custom scrolling instead of using the native behavior.
</Accordion>

<Accordion title="What if my carousel is initially hidden?">
Call `refresh()` when the carousel becomes visible:

```javascript
// When showing carousel
carousel.refresh();
```

</Accordion>

<Accordion title="How do I debug issues?">
Check the console for warnings. The library logs clear messages for the most common situations (like missing elements). Each carousel also has a `data-carousel-id` attribute for easier debugging in DevTools. If you still have questions, feel free to reach out to me.
</Accordion>

</Accordions>
