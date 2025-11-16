# Webflow Swiper Helper

A lightweight JavaScript helper that makes it easy to use [Swiper](https://swiperjs.com/) sliders in Webflow without fighting the designer's class system.

## Why Use This?

**The Problem:**
Webflow integrates CSS classes strongly to the designer experience, making it annoying to work with Swiper's required class names (`.swiper`, `.swiper-wrapper`, `.swiper-slide`, etc.). Manually adding these classes degrades the Webflow experience and makes elements less reusable and more annoying to work with.

**The Solution:**
This helper lets you use semantic `data-swiper="..."` attributes instead of classes. The script:

- Automatically adds Swiper's required classes at runtime
- Parses configuration directly from HTML attributes
- Auto-initializes all sliders on page load
- Supports multiple independent sliders with scoped selectors
- Works with all Swiper modules (navigation, pagination, scrollbar, etc.)

---

## Quick Start

### 1. Include Scripts

Add these scripts before your closing `</body>` tag:

```html
<!-- Swiper's official bundle -->
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

<!-- This helper script -->
<script src="path/to/webflow-swiper.js"></script>
```

### 2. Basic Example

```html
<div
  data-swiper="root"
  data-swiper-slides-per-view="2"
  data-swiper-space-between="20"
>
  <div data-swiper="swiper">
    <div data-swiper="wrapper">
      <div data-swiper="slide">Slide 1</div>
      <div data-swiper="slide">Slide 2</div>
      <div data-swiper="slide">Slide 3</div>
    </div>
  </div>
  <button data-swiper-navigation="prev">←</button>
  <button data-swiper-navigation="next">→</button>
  <div data-swiper-pagination="el"></div>
</div>
```

That's it! The slider will auto-initialize when the page loads.

---

## How It Works

### Author Workflow

1. **Wrap in a root** – Add `data-swiper="root"` to your outermost container
2. **Add structure** – Mark up the required Swiper elements with attributes
3. **Configure on the root** – Add all `data-swiper-*` options to the root element
4. **Add controls** – Optional: Add navigation buttons, pagination, scrollbar
5. **Publish** – The script handles the rest automatically

**No JavaScript required.** Everything is configured through HTML attributes.

---

## Attribute Reference

### Required Structure

These four attributes create the basic Swiper structure:

| Element     | Attribute               | Description                                | Gets Class        |
| ----------- | ----------------------- | ------------------------------------------ | ----------------- |
| **Root**    | `data-swiper="root"`    | Outermost container. All config goes here. | —                 |
| **Swiper**  | `data-swiper="swiper"`  | Swiper's main container                    | `.swiper`         |
| **Wrapper** | `data-swiper="wrapper"` | Slides wrapper                             | `.swiper-wrapper` |
| **Slide**   | `data-swiper="slide"`   | Individual slides (repeatable)             | `.swiper-slide`   |

**Rules:**

- Each root must contain **exactly one** swiper and wrapper
- Each wrapper must contain **at least one** slide
- You can nest other HTML elements anywhere between these

**What happens automatically:**

- The root gets a unique `data-swiper-root-id` for scoping (e.g., `swiper-root-1`)
- Swiper's required classes are added to the structural elements at runtime
- All sliders are isolated from each other, even with identical attribute names

---

### Optional Controls

Add these anywhere inside the root to enable navigation, pagination, or scrollbar:

| Control         | Attribute                       | Maps To             |
| --------------- | ------------------------------- | ------------------- |
| **Next Button** | `data-swiper-navigation="next"` | `navigation.nextEl` |
| **Prev Button** | `data-swiper-navigation="prev"` | `navigation.prevEl` |
| **Pagination**  | `data-swiper-pagination="el"`   | `pagination.el`     |
| **Scrollbar**   | `data-swiper-scrollbar="el"`    | `scrollbar.el`      |

**Notes:**

- Controls are automatically scoped to their root (no conflicts between sliders)
- You can place controls outside the swiper element (e.g., for custom layouts)
- If multiple elements match, only the first is used (with a warning)
- Module elements stay unchanged—only selectors passed to Swiper are scoped

---

## Configuration Options

All Swiper configuration happens via `data-swiper-*` attributes on the **root element**. The helper automatically converts kebab-case to camelCase and parses values.

### Basic Options

Add any Swiper parameter as `data-swiper-{parameter-name}`:

```html
<div
  data-swiper="root"
  data-swiper-slides-per-view="3"
  data-swiper-space-between="20"
  data-swiper-loop="true"
  data-swiper-speed="500"
>
  <!-- ... -->
</div>
```

**Becomes:**

```javascript
{
  slidesPerView: 3,
  spaceBetween: 20,
  loop: true,
  speed: 500
}
```

### Module Options

For nested module parameters, use `data-swiper-{module}-{param}`:

```html
<div
  data-swiper="root"
  data-swiper-autoplay-delay="3000"
  data-swiper-autoplay-disable-on-interaction="false"
  data-swiper-pagination-clickable="true"
  data-swiper-grid-rows="2"
>
  <!-- ... -->
</div>
```

**Becomes:**

```javascript
{
  autoplay: {
    delay: 3000,
    disableOnInteraction: false
  },
  pagination: {
    clickable: true
  },
  grid: {
    rows: 2
  }
}
```

### Supported Modules

These module names are recognized for nested parameters:

`a11y`, `autoplay`, `controller`, `cards-effect`, `coverflow-effect`, `creative-effect`, `cube-effect`, `fade-effect`, `flip-effect`, `free-mode`, `grid`, `hash-navigation`, `history`, `keyboard`, `mousewheel`, `navigation`, `pagination`, `parallax`, `scrollbar`, `thumbs`, `virtual`, `zoom`

### Value Conversion

Attribute values are automatically converted to the appropriate JavaScript type:

| Attribute Value          | JavaScript Value |
| ------------------------ | ---------------- |
| `""` (empty) or `"true"` | `true`           |
| `"false"`                | `false`          |
| `"null"`                 | `null`           |
| `"undefined"`            | `undefined`      |
| `"42"` or `"3.14"`       | Number           |
| Anything else            | String           |

---

## Complete Example

Here's a full-featured slider with autoplay, pagination, and navigation:

```html
<div
  data-swiper="root"
  data-swiper-slides-per-view="2"
  data-swiper-space-between="24"
  data-swiper-loop="true"
  data-swiper-autoplay-delay="3000"
  data-swiper-pagination-clickable="true"
  data-swiper-navigation-enabled="true"
>
  <div data-swiper="swiper">
    <div data-swiper="wrapper">
      <div data-swiper="slide">Slide A</div>
      <div data-swiper="slide">Slide B</div>
      <div data-swiper="slide">Slide C</div>
      <div data-swiper="slide">Slide D</div>
    </div>
  </div>

  <!-- Controls can be anywhere inside root -->
  <button data-swiper-navigation="prev">← Previous</button>
  <button data-swiper-navigation="next">Next →</button>
  <div data-swiper-pagination="el"></div>
</div>
```

---

## Debugging

### Browser Console

Access the Swiper instance from any root element:

```javascript
// Get the first slider on the page
const root = document.querySelector('[data-swiper="root"]');
const swiper = root.swiperInstance;

// Now you can call Swiper methods
swiper.slideNext();
swiper.slidePrev();
swiper.update();
```

### Inspecting Configuration

Check what options were applied:

```javascript
console.log(swiper.params);
```

### Root ID

Each root gets a unique ID you can inspect:

```javascript
const rootId = root.getAttribute('data-swiper-root-id');
console.log(rootId); // "swiper-root-1"
```

---

## Advanced Usage

### Manual Initialization

If you're dynamically adding sliders after page load:

```javascript
// After adding new sliders to the DOM
window.setupWebflowSwipers();
```

**Note:** The root ID counter resets on each run, so IDs stay consistent.

### Customizing Attribute Names

Edit `SWIPER_CONFIG` in `webflow-swiper.js`:

```javascript
const SWIPER_CONFIG = {
  attributePrefix: 'data-slider', // Change from 'data-swiper'
  attributes: {
    root: 'container', // Use data-slider="container" instead
    swiper: 'main',
    wrapper: 'track',
    slide: 'item',
  },
  // ...
};
```

### Adding Custom Modules

To support additional Swiper modules:

1. **Add to module config** (`SWIPER_MODULE_ATTRIBUTE_SELECTORS`):

```javascript
const SWIPER_MODULE_ATTRIBUTE_SELECTORS = {
  // Existing modules...
  customModule: {
    someParam: 'value',
  },
};
```

2. **Add to attribute keys** (`SWIPER_MODULE_ATTRIBUTE_KEYS`):

```javascript
const SWIPER_MODULE_ATTRIBUTE_KEYS = [
  // Existing modules...
  'custom-module',
];
```

Now you can use `data-swiper-custom-module-some-param="..."` in your HTML.

---

## Technical Details

### How It Works (Runtime Flow)

When the page loads, the script:

1. **Resets counters** – Ensures consistent root IDs on each run
2. **Finds roots** – Queries all `[data-swiper="root"]` elements
3. **Validates structure** – Checks for exactly one swiper/wrapper, at least one slide
4. **Assigns root ID** – Adds unique `data-swiper-root-id` to each root
5. **Adds classes** – Applies `.swiper`, `.swiper-wrapper`, `.swiper-slide` to structural elements
6. **Parses config** – Converts `data-swiper-*` attributes to JavaScript options
7. **Builds scoped selectors** – Creates selectors like `[data-swiper-root-id="swiper-root-1"] [data-swiper-navigation="next"]`
8. **Initializes Swiper** – Calls `new Swiper()` with merged options
9. **Stores instance** – Saves to `root.swiperInstance` for debugging

### Scoping Mechanism

To prevent conflicts between multiple sliders:

- Each root gets: `data-swiper-root-id="swiper-root-1"`
- Module selectors become: `[data-swiper-root-id="swiper-root-1"] [data-swiper-navigation="next"]`
- Swiper uses these scoped selectors to find the correct elements
- Module elements themselves are **not modified** (no extra attributes added)

This ensures that even if you have identical button markup in multiple sliders, each Swiper instance only finds its own controls.

### Validation Rules

The script enforces strict structural requirements:

| Requirement                      | What Happens If Violated           |
| -------------------------------- | ---------------------------------- |
| Exactly 1 swiper per root        | Error logged, slider skipped       |
| Exactly 1 wrapper per swiper     | Error logged, slider skipped       |
| At least 1 slide per wrapper     | Error logged, slider skipped       |
| Multiple pagination/nav elements | Warning logged, first element used |

---

## Requirements

- **Swiper.js** – Version 8 or later (tested with v11)
- **Browsers** – Modern browsers with ES6 support
- **Webflow** – Any plan (uses standard HTML attributes)

---

## License

This helper script is provided as-is for use with Webflow and Swiper.js projects.
