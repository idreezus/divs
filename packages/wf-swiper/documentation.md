---
description: SwiperJS integration helper for Webflow with data-attribute configuration
---

# WF Swiper

A helper library for using SwiperJS in Webflow without managing required CSS classes.

## Features

- Configure sliders with HTML attributes instead of JavaScript
- Auto-initializes all sliders on page load
- Supports all SwiperJS modules and configuration options
- Multiple independent sliders with automatic scoping
- Export configuration from existing sliders to reuse elsewhere

## Installation

### Load SwiperJS

The library requires SwiperJS 8 or later to handle slider functionality:

```html
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
```

### Load the Helper Library

Add the helper script after SwiperJS:

```html
<script type="module" src="path/to/wf-swiper.js"></script>
```

### Add Elements &amp; Attributes

Mark the container with `data-swiper` = `"root"` and add the required structure:

```html
<div data-swiper="root" data-swiper-slides-per-view="2" data-swiper-space-between="20">
  <div data-swiper="swiper">
    <div data-swiper="wrapper">
      <div data-swiper="slide">Slide 1</div>
      <div data-swiper="slide">Slide 2</div>
      <div data-swiper="slide">Slide 3</div>
    </div>
  </div>
</div>
```

That's it—the slider initializes when the page loads.

> [!TIP]
> Add configuration attributes to the root element only. All `data-swiper-*` options belong on the outermost container.

## How It Works

This library addresses a specific challenge in Webflow: the visual development environment integrates CSS classes deeply into the designer experience, making it cumbersome to work with SwiperJS's required class names like `.swiper`, `.swiper-wrapper`, and `.swiper-slide`. Adding these classes manually degrades the Webflow authoring experience and makes components less reusable.

The helper library uses semantic `data-swiper` attributes instead of classes. At runtime, the script automatically adds SwiperJS's required classes to the appropriate elements, parses configuration from HTML attributes, and initializes each slider independently. This approach preserves Webflow's visual workflow while providing full access to SwiperJS features.

### Structure Requirements

Four attributes create the basic slider structure:

| Element     | Attribute               | Description                      | Gets Class        |
| ----------- | ----------------------- | -------------------------------- | ----------------- |
| **Root**    | `data-swiper="root"`    | Outermost container for config   | —                 |
| **Swiper**  | `data-swiper="swiper"`  | Main slider container            | `.swiper`         |
| **Wrapper** | `data-swiper="wrapper"` | Slides wrapper                   | `.swiper-wrapper` |
| **Slide**   | `data-swiper="slide"`   | Individual slides (repeatable)   | `.swiper-slide`   |

Each root must contain exactly one swiper and wrapper. Each wrapper must contain at least one slide. Other HTML elements can be nested anywhere between these structural elements.

The root gets a unique `data-swiper-root-id` attribute for scoping (e.g., `swiper-root-1`). SwiperJS's required classes are added at runtime. All sliders are isolated from each other, even with identical attribute names.

### Navigation &amp; Pagination

Add control elements anywhere inside the root to enable navigation, pagination, or scrollbar:

```html
<div data-swiper="root">
  <div data-swiper="swiper">
    <div data-swiper="wrapper">
      <div data-swiper="slide">Slide content</div>
    </div>
  </div>

  <button data-swiper-navigation="prev">Previous</button>
  <button data-swiper-navigation="next">Next</button>
  <div data-swiper-pagination="el"></div>
  <div data-swiper-scrollbar="el"></div>
</div>
```

Controls are scoped to their root container to prevent conflicts between multiple sliders. Control elements can be placed outside the swiper element for flexible layout options. If multiple elements match the same control selector, only the first is used.

### Configuration Methods

Configure sliders in two ways: individual attributes or bulk JSON configuration. Both methods work on the root element only.

#### Individual Attributes

Individual attributes provide visual editing flexibility in Webflow Designer:

```html
<div
  data-swiper="root"
  data-swiper-slides-per-view="3"
  data-swiper-space-between="20"
  data-swiper-loop="true"
  data-swiper-speed="500"
>
  <!-- structure -->
</div>
```

This becomes:

```javascript
{
  slidesPerView: 3,
  spaceBetween: 20,
  loop: true,
  speed: 500
}
```

For nested module parameters, use `data-swiper-{module}-{param}`:

```html
<div
  data-swiper="root"
  data-swiper-autoplay-delay="3000"
  data-swiper-autoplay-disable-on-interaction="false"
  data-swiper-pagination-clickable="true"
  data-swiper-grid-rows="2"
>
  <!-- structure -->
</div>
```

This becomes:

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

Attribute values are converted to appropriate JavaScript types:

| Attribute Value         | JavaScript Value       |
| ----------------------- | ---------------------- |
| `""` or `"true"`        | `true`                 |
| `"false"`               | `false`                |
| `"42"` or `"3.14"`      | Number                 |
| `'{"key":"value"}'`     | Parsed JSON object     |
| Anything else           | String                 |

#### Bulk JSON Configuration

For quick copy-paste from SwiperJS documentation or existing configurations, use `data-swiper-options` with complete JSON:

```html
<div
  data-swiper="root"
  data-swiper-options='{
    "slidesPerView": 3,
    "spaceBetween": 20,
    "loop": true,
    "autoplay": {
      "delay": 3000,
      "disableOnInteraction": false
    },
    "breakpoints": {
      "768": {
        "slidesPerView": 2
      },
      "1024": {
        "slidesPerView": 3
      }
    }
  }'
>
  <!-- structure -->
</div>
```

JSON keys must be camelCase (matching SwiperJS's JavaScript API): `slidesPerView`, not `slides-per-view`. Use single quotes around the attribute value and double quotes inside the JSON. The JSON must be a valid object.

Individual attributes override JSON values, giving designers flexibility to tweak settings visually without editing JSON:

```html
<div
  data-swiper="root"
  data-swiper-options='{"slidesPerView":3,"spaceBetween":20,"loop":true}'
  data-swiper-slides-per-view="2"
>
  <!-- Result: slidesPerView=2 (attribute wins), spaceBetween=20, loop=true -->
</div>
```

> [!IMPORTANT]
> When using bulk JSON, individual `data-swiper-*` attributes take precedence and override JSON values. This enables quick configuration via JSON with visual overrides in Webflow Designer.

## Customization

### Core Options

Top-level SwiperJS parameters configured on the root element:

| Attribute                      | Type    | Default | Description                                        |
| ------------------------------ | ------- | ------- | -------------------------------------------------- |
| `data-swiper-slides-per-view`  | number  | `1`     | Number of slides visible at once                   |
| `data-swiper-space-between`    | number  | `0`     | Space between slides in pixels                     |
| `data-swiper-loop`             | boolean | -       | Enable continuous loop mode                        |
| `data-swiper-speed`            | number  | `300`   | Transition duration in milliseconds                |
| `data-swiper-direction`        | string  | `"horizontal"` | Slider direction: `"horizontal"` or `"vertical"` |
| `data-swiper-effect`           | string  | `"slide"` | Transition effect: `"slide"`, `"fade"`, `"cube"`, `"coverflow"`, `"flip"`, `"cards"`, `"creative"` |
| `data-swiper-autoplay`         | boolean | -       | Enable autoplay (use nested params for control)    |
| `data-swiper-initial-slide`    | number  | `0`     | Index of initial slide                             |
| `data-swiper-centered-slides`  | boolean | -       | Center active slide                                |

### Module Options

The library recognizes these module names for nested parameters:

`a11y`, `autoplay`, `controller`, `cards-effect`, `coverflow-effect`, `creative-effect`, `cube-effect`, `fade-effect`, `flip-effect`, `free-mode`, `grid`, `hash-navigation`, `history`, `keyboard`, `mousewheel`, `navigation`, `pagination`, `parallax`, `scrollbar`, `thumbs`, `virtual`, `zoom`

### Control Elements

Add control elements with these attributes:

| Attribute                       | Maps To             | Description                   |
| ------------------------------- | ------------------- | ----------------------------- |
| `data-swiper-navigation="next"` | `navigation.nextEl` | Next button                   |
| `data-swiper-navigation="prev"` | `navigation.prevEl` | Previous button               |
| `data-swiper-pagination="el"`   | `pagination.el`     | Pagination container          |
| `data-swiper-scrollbar="el"`    | `scrollbar.el`      | Scrollbar container           |

### Breakpoints

Configure responsive behavior with breakpoints as JSON in an individual attribute:

```html
<div
  data-swiper="root"
  data-swiper-breakpoints='{
    "768": {"slidesPerView": 2, "spaceBetween": 16},
    "1024": {"slidesPerView": 3, "spaceBetween": 24}
  }'
>
  <!-- structure -->
</div>
```

Breakpoint keys are viewport widths in pixels. Values are configuration objects applied at that breakpoint and above.

#### Webflow Breakpoint Shorthands

Instead of remembering pixel values, use Webflow's familiar breakpoint names:

| Shorthand | Pixel Value | Webflow Breakpoint |
|-----------|-------------|-------------------|
| `tablet` | 991 | Tablet |
| `mobile-landscape` or `mobile` | 767 | Mobile landscape |
| `mobile-portrait` or `phone` | 479 | Mobile portrait |

**Example:**

```html
<div
  data-swiper="root"
  data-swiper-breakpoints='{
    "tablet": {"slidesPerView": 2, "spaceBetween": 16},
    "mobile": {"slidesPerView": 1, "spaceBetween": 8}
  }'
>
  <!-- structure -->
</div>
```

**Features:**

- **Case-insensitive**: `"Tablet"`, `"TABLET"`, `"tablet"` all work
- **Mixable**: Combine shorthands with custom pixel values like `{"tablet": {...}, "600": {...}}`
- **Aliases**: Use `"mobile"` for `"mobile-landscape"` or `"phone"` for `"mobile-portrait"`
- **Works everywhere**: Both bulk JSON and individual breakpoints attributes

**Works in bulk JSON too:**

```html
<div
  data-swiper="root"
  data-swiper-options='{
    "slidesPerView": 1,
    "breakpoints": {
      "mobile": {"slidesPerView": 2},
      "tablet": {"slidesPerView": 3}
    }
  }'
>
```

> [!NOTE]
> Complex options like breakpoints, free mode configuration, and effect settings work best as JSON in individual attributes or within bulk `data-swiper-options`.

## JavaScript API

Control sliders programmatically through SwiperJS instances stored on root elements. The library auto-initializes on page load, but instances can be accessed for manual control.

### Accessing Instances

```javascript
// Get instance from root element
const root = document.querySelector('[data-swiper="root"]');
const swiper = root.swiperInstance;

// Use SwiperJS methods
swiper.slideNext();
swiper.slidePrev();
swiper.slideTo(2);
swiper.update();
```

### Manual Initialization

Initialize sliders added dynamically after page load:

```javascript
// After adding new sliders to the DOM
window.setupWebflowSwipers();
```

The root ID counter resets on each run for consistent IDs.

### Exporting Configuration

Export configuration from existing sliders in two formats:

#### Interactive Export (Prompts for Format)

```javascript
// Shows prompt asking: "Type 1 for attribute format, 2 for embed code"
wfSwiper.exportConfig('[data-swiper="root"]');

// Works with specific selectors
wfSwiper.exportConfig('[data-swiper-root-id="swiper-root-2"]');

// Or pass element directly
const root = document.querySelector('.my-slider[data-swiper="root"]');
wfSwiper.exportConfig(root);
```

#### Direct Export (Skip Prompt)

**For Webflow Attributes:**

```javascript
// Exports as HTML-escaped JSON for pasting into data-swiper-options
wfSwiper.exportConfigAttr('[data-swiper="root"]');
```

Output format uses `&quot;` instead of `"` to work around Webflow's attribute value restrictions:
```html
{&quot;slidesPerView&quot;: 3, &quot;spaceBetween&quot;: 20}
```

Paste this directly into the `data-swiper-options` attribute in Webflow Designer. The browser automatically converts `&quot;` back to `"` when JavaScript reads the attribute.

**For Custom Code Embeds:**

```javascript
// Exports as JavaScript code for custom embeds
wfSwiper.exportConfigEmbed('[data-swiper="root"]');
```

Output format is ready-to-paste JavaScript with unquoted object keys:
```javascript
// Swiper initialization (paste into custom code embed)
// Update the selector to match your .swiper element
const swiper = new Swiper('.swiper', {
  slidesPerView: 3,
  spaceBetween: 20,
  breakpoints: {
    991: {slidesPerView: 2},
    767: {slidesPerView: 1}
  }
});
```

**What gets exported:**
- All `data-swiper-*` attributes from the element
- Bulk JSON from `data-swiper-options` if present
- Merged into a clean config object
- Breakpoint shorthands converted to pixel values for portability
- Auto-copied to clipboard

## FAQ

<div className="flex flex-col gap-2 mt-4">

<Accordion title="Why use this instead of adding SwiperJS classes directly?">
Webflow integrates CSS classes into the designer interface, making manual class management cumbersome and reducing component reusability. This library uses data attributes that don't interfere with Webflow's visual workflow while providing full SwiperJS functionality.
</Accordion>

<Accordion title="Can I use all SwiperJS modules and effects?">
Yes. The library supports all SwiperJS modules, effects, and configuration options. Use individual attributes for simple settings or bulk JSON for complex configurations like effects and advanced module options.
</Accordion>

<Accordion title="How do I handle multiple sliders on one page?">
Each slider is scoped automatically. Add `data-swiper="root"` to each slider container, and the library assigns unique IDs to prevent conflicts. Controls, navigation, and pagination work independently for each slider.
</Accordion>

<Accordion title="What happens if I have invalid configuration?">
The library validates configuration during initialization and logs warnings for invalid JSON, unknown parameters, or structural issues. Each slider initializes independently, so one problematic slider won't prevent others from working.
</Accordion>

<Accordion title="Can I mix JSON configuration with individual attributes?">
Yes. Start with bulk JSON in `data-swiper-options` for base configuration, then add individual `data-swiper-*` attributes to override specific values. Individual attributes always take precedence, enabling visual tweaking in Webflow Designer.
</Accordion>

<Accordion title="How do I debug slider configuration?">
Access the SwiperJS instance via `root.swiperInstance` and inspect `swiper.params` to see applied configuration. Use `wfSwiper.exportConfig()` to export current configuration in either attribute format (for pasting into Webflow) or embed format (for custom code). Use `wfSwiper.exportConfigAttr()` or `wfSwiper.exportConfigEmbed()` to skip the prompt and export directly.
</Accordion>

<Accordion title="Can I use Webflow breakpoint names instead of pixel values?">
Yes! Use friendly names like `"tablet"` (991px), `"mobile"` (767px), or `"phone"` (479px) in your breakpoints configuration. These shorthands are case-insensitive and can be mixed with custom pixel values. For example: `{"tablet": {...}, "600": {...}}`. This makes breakpoints easier to remember and more aligned with Webflow's design system.
</Accordion>

</div>
