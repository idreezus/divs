## Features

<Features>

- Declarative HTML structure with data attributes
- Works with horizontal and vertical scrolling
- Dynamic detection via ResizeObserver handles responsive layouts
- Optional navigation buttons with automatic disabled states
- RTL layout support out of the box
- All styling via CSS – no JavaScript styling

</Features>

## Setup

<Steps>

<Step number="1" title="Load the Script">
Copy & paste this script in your Page Settings **Before `</body>` tag**

```html
<!-- Divs ScrollFade Library -->
<script src="https://cdn.jsdelivr.net/gh/idreezus/divs@v1.0.0/dist/scroll-fade/v1.0.0/scroll-fade.min.js"></script>
```

</Step>

<Step number="2" title="Add the Styles">
Copy & paste this in an embed element or your Page Settings **Inside `<head>` tag**

```html
<style>
  /* Wrapper must be positioned for shadows */
  .scroll-wrapper {
    position: relative;
  }

  /* Scrollable list */
  .scroll-list {
    overflow-x: auto;
  }

  /* Hide scrollbar (optional) */
  .scroll-list::-webkit-scrollbar {
    display: none;
  }
  .scroll-list {
    scrollbar-width: none;
  }

  /* Shadow positioning and styling */
  [data-scroll-fade='start'],
  [data-scroll-fade='end'] {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 60px;
    z-index: 10;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  [data-scroll-fade='start'] {
    left: 0;
    background: linear-gradient(to right, white, transparent);
  }

  [data-scroll-fade='end'] {
    right: 0;
    background: linear-gradient(to left, white, transparent);
  }

  /* Hidden state */
  .scroll-fade-hidden {
    opacity: 0;
  }

  /* Disabled button state */
  .scroll-fade-button-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

</Step>

<Step number="3" title="Build the Structure">
Create the wrapper, shadow elements, and scrollable list:

```html
<div class="scroll-wrapper" data-scroll-fade-container>
  <div data-scroll-fade="start"></div>
  <div data-scroll-fade="end"></div>
  <div class="scroll-list" data-scroll-fade-list>
    <div class="scroll-track">
      <div class="item">Item 1</div>
      <div class="item">Item 2</div>
      <div class="item">Item 3</div>
      <!-- More items... -->
    </div>
  </div>
</div>
```

</Step>

</Steps>

---

## How It Works

The library finds your shadow elements and toggles a `.scroll-fade-hidden` class based on scroll position.

- **At start edge**: Start shadow hidden, end shadow visible
- **In the middle**: Both shadows visible
- **At end edge**: Start shadow visible, end shadow hidden
- **Not scrollable**: Both shadows hidden

The library handles all the scroll detection, resize observation, and edge calculations. You provide and style the shadows via CSS.

### Structure

You provide all elements in your markup:

```html
<div data-scroll-fade-container>
  <div data-scroll-fade="start"></div>
  <div data-scroll-fade="end"></div>
  <div data-scroll-fade-list>
    <!-- Your scrollable content -->
  </div>
</div>
```

The library only manages visibility classes – all styling (positioning, sizing, gradients, z-index, transitions) is your responsibility via CSS.

---

## Customization

### Core Attributes

| Attribute                      | Element    | Values                        | Default        | Description                    |
| ------------------------------ | ---------- | ----------------------------- | -------------- | ------------------------------ |
| `data-scroll-fade-container`   | Wrapper    | (presence) or `"false"`       | -              | Required on wrapper element    |
| `data-scroll-fade-list`        | Scrollable | (presence) or `"false"`       | -              | Required on scrollable element |
| `data-scroll-fade="start"`     | Shadow     | `"start"`                     | -              | Start edge shadow element      |
| `data-scroll-fade="end"`       | Shadow     | `"end"`                       | -              | End edge shadow element        |
| `data-scroll-fade-orientation` | List       | `"horizontal"` / `"vertical"` | `"horizontal"` | Scroll axis                    |
| `data-scroll-fade-step`        | List       | Number (px)                   | list size      | Scroll amount for nav buttons  |

### Navigation Buttons

Optional navigation controls placed inside the container:

| Attribute               | Description                       |
| ----------------------- | --------------------------------- |
| `data-scroll-fade-prev` | Scrolls toward start (left/top)   |
| `data-scroll-fade-next` | Scrolls toward end (right/bottom) |

```html
<div data-scroll-fade-container>
  <div data-scroll-fade="start"></div>
  <div data-scroll-fade="end"></div>
  <div data-scroll-fade-list data-scroll-fade-step="300">
    <!-- Scrollable content -->
  </div>
  <button data-scroll-fade-prev>← Previous</button>
  <button data-scroll-fade-next>Next →</button>
</div>
```

Buttons automatically receive the `.scroll-fade-button-disabled` class and `aria-disabled="true"` when at the corresponding edge.

### Vertical Scrolling

For vertical scroll containers, set the orientation on the list element:

```html
<div class="scroll-wrapper-vertical" data-scroll-fade-container>
  <div data-scroll-fade="start"></div>
  <div data-scroll-fade="end"></div>
  <div
    class="scroll-list-vertical"
    data-scroll-fade-list
    data-scroll-fade-orientation="vertical"
  >
    <!-- Content -->
  </div>
</div>
```

```css
.scroll-wrapper-vertical {
  position: relative;
}

.scroll-list-vertical {
  overflow-y: auto;
  max-height: 400px;
}

/* Vertical shadow sizing */
.scroll-wrapper-vertical > [data-scroll-fade='start'],
.scroll-wrapper-vertical > [data-scroll-fade='end'] {
  position: absolute;
  left: 0;
  right: 0;
  height: 40px;
  pointer-events: none;
}

.scroll-wrapper-vertical > [data-scroll-fade='start'] {
  top: 0;
  background: linear-gradient(to bottom, white, transparent);
}

.scroll-wrapper-vertical > [data-scroll-fade='end'] {
  bottom: 0;
  background: linear-gradient(to top, white, transparent);
}
```

### Custom Gradients

The shadows are just positioned divs – style them however you want:

```css
/* Colorful gradients */
[data-scroll-fade='start'] {
  background: linear-gradient(to right, rgba(102, 126, 234, 0.5), transparent);
}

[data-scroll-fade='end'] {
  background: linear-gradient(to left, rgba(236, 72, 153, 0.5), transparent);
}

/* Solid shadows */
[data-scroll-fade='start'] {
  background: white;
  box-shadow: 10px 0 20px rgba(0, 0, 0, 0.1);
}

/* CSS masks for complex effects */
[data-scroll-fade='start'] {
  background: black;
  mask-image: linear-gradient(to right, black, transparent);
}
```

### Disabling Scroll-Fade

To temporarily disable a container, set the attribute value to `"false"`:

```html
<!-- This won't initialize -->
<div data-scroll-fade-container="false">...</div>
```

---

## State Classes

The library applies state classes that you style however you want:

| Class                          | Applied to                                    |
| ------------------------------ | --------------------------------------------- |
| `.scroll-fade-hidden`          | Shadow elements when at their respective edge |
| `.scroll-fade-button-disabled` | Navigation buttons at start/end boundaries    |

---

## JavaScript API

### Instance Access

```javascript
// Get instance from element
const scrollFade = container._scrollFade;

// Or create manually
import { ScrollFade } from './scroll-fade.js';
const scrollFade = new ScrollFade(container);
```

### Instance Methods

```javascript
scrollFade.scrollToStart(); // Smooth scroll to start edge
scrollFade.scrollToEnd(); // Smooth scroll to end edge
scrollFade.refresh(); // Recalculate after content changes
scrollFade.destroy(); // Clean up and remove shadows
```

Methods are chainable (except `destroy`):

```javascript
scrollFade.scrollToStart().refresh();
```

### Events

```javascript
container.addEventListener('scroll-fade:reach-start', () => {
  console.log('Reached start edge');
});

container.addEventListener('scroll-fade:reach-end', () => {
  console.log('Reached end edge');
});

container.addEventListener('scroll-fade:show', (e) => {
  console.log(`Shadow appeared: ${e.detail.edge}`); // 'start' or 'end'
});

container.addEventListener('scroll-fade:hide', (e) => {
  console.log(`Shadow hidden: ${e.detail.edge}`);
});
```

Available events:

| Event                     | Description            | Event Detail           |
| ------------------------- | ---------------------- | ---------------------- |
| `scroll-fade:reach-start` | Scrolled to start edge | `{ scrollFade }`       |
| `scroll-fade:reach-end`   | Scrolled to end edge   | `{ scrollFade }`       |
| `scroll-fade:show`        | Shadow became visible  | `{ scrollFade, edge }` |
| `scroll-fade:hide`        | Shadow became hidden   | `{ scrollFade, edge }` |

Events fire on initialization if the container starts at an edge.

### Dynamic Content

The library uses ResizeObserver to automatically detect when content becomes scrollable or non-scrollable. For major DOM changes, you can manually trigger a refresh:

```javascript
// After adding/removing content
scrollFade.refresh();

// Or destroy and reinitialize
scrollFade.destroy();
new ScrollFade(container);
```

---

## FAQ

<Accordions>

<Accordion title="Why aren't my shadows showing?">
Check these common issues:

1. **Missing `position: relative`** on wrapper – shadows are absolutely positioned
2. **Missing overflow CSS** – list needs `overflow-x: auto` or `overflow-y: auto`
3. **Content doesn't overflow** – if content fits, shadows stay hidden (this is correct behavior)
4. **Missing shadow elements** – you must add `data-scroll-fade="start"` and `data-scroll-fade="end"` elements
5. **Missing shadow styling** – you must add position, sizing, and gradients via CSS

</Accordion>

<Accordion title="Can I use this with CSS scroll-snap?">
Yes! The library works alongside scroll-snap. Just add your scroll-snap properties as usual – the shadow visibility is based on scroll position, not snap points.
</Accordion>

<Accordion title="How do I change the shadow width/height?">
Style the shadow elements via CSS using their `data-scroll-fade` attribute:

```css
[data-scroll-fade='start'],
[data-scroll-fade='end'] {
  width: 100px; /* Wider shadows */
}
```

</Accordion>

<Accordion title="Why do shadows flicker at the edges?">
The library uses a 1px threshold to prevent this. If you're still seeing flicker, ensure you're not animating the container's scroll position with CSS transitions.
</Accordion>

<Accordion title="Does it work with RTL layouts?">
Yes! The library auto-detects RTL using `Intl.Locale.getTextInfo()` with fallbacks to the `dir` attribute and computed styles. Start/end shadows swap positions automatically.
</Accordion>

<Accordion title="Can I have multiple scroll-fade containers on one page?">
Absolutely. Each container is independent. The library auto-initializes all containers with `data-scroll-fade-container` on page load.
</Accordion>

<Accordion title="How do I prevent initialization?">
Set the attribute value to `"false"`:

```html
<div data-scroll-fade-container="false">...</div>
```

</Accordion>

</Accordions>
