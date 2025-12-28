# Tabs

An accessible, keyboard-navigable tabs component with autoplay support.

## Features

- Full keyboard navigation with arrow keys, Home, and End
- ARIA-compliant with proper roles, states, and focus management
- URL syncing for deep-linking to specific tabs
- Autoplay with progress indicator and pause-on-hover/focus
- Supports multiple triggers per panel (e.g., sidebar + content triggers)
- Works with nested tabs without conflicts
- Optional prev/next navigation buttons
- Native DOM events and instance API

## Setup

<Steps>
<Step number="1" title="Copy and paste the script">
Paste this script into your Page Settings "Before `</body>` tag".

```html
<!-- Divs Tabs Library -->
<script src="https://cdn.jsdelivr.net/gh/idreezus/divs@tabs-v1.0.0/dist/tabs/v1.0.0/tabs.min.js"></script>
```

</Step>

<Step number="2" title="Copy and paste the styles">
Put the required styling on your page. Either an Embed element that's placed anywhere on your page, or your Page Settings "Inside `<head>` tag".

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/idreezus/divs@tabs-v1.0.0/dist/tabs/v1.0.0/tabs.css">
```

</Step>

<Step number="3" title="That's all folks">
Snag one of the variants below, or continue reading the documentation to learn more.
</Step>
</Steps>

## Variants

### Horizontal Tabs

### Vertical Tabs

### Autoplay Tabs

## How It Works

Tabs are linked by matching `data-tabs-trigger-value` and `data-tabs-panel-value` attributes. Unlike traditional tab implementations that rely on array indices, this value-based linking means:

- Triggers and panels can be anywhere in the DOM (not just siblings)
- Multiple triggers can control the same panel
- Order doesn't matter - matching is by value, not position

### Structure

Three elements are required:

- `[data-tabs="container"]` - the outermost container, used for scoping
- `[data-tabs-trigger-value="..."]` - the tab trigger buttons
- `[data-tabs-panel-value="..."]` - the content panels

```html
<div data-tabs="container">
  <div role="tablist">
    <button data-tabs-trigger-value="one">Tab 1</button>
    <button data-tabs-trigger-value="two">Tab 2</button>
    <button data-tabs-trigger-value="three">Tab 3</button>
  </div>
  <div>
    <div data-tabs-panel-value="one">Content 1</div>
    <div data-tabs-panel-value="two">Content 2</div>
    <div data-tabs-panel-value="three">Content 3</div>
  </div>
</div>
```

> [!IMPORTANT]
> The trigger and panel values are normalized to lowercase and hyphenated. So `"Tab One"`, `"tab-one"`, and `"TAB ONE"` all become `"tab-one"`.

## Data Attributes

### Container Configuration

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-tabs` | `"container"` | - | Required on container element |
| `data-tabs-default` | any value | first trigger | Initial active tab value |
| `data-tabs-group-name` | string | - | URL parameter name for deep linking |
| `data-tabs-orientation` | `"horizontal"` / `"vertical"` | `"horizontal"` | Arrow key navigation direction |
| `data-tabs-activate-on-focus` | `"true"` / `"false"` | `"true"` | Activate tab on arrow key focus |
| `data-tabs-loop` | `"true"` / `"false"` | `"false"` | Loop keyboard navigation |
| `data-tabs-keyboard` | `"true"` / `"false"` | `"true"` | Enable keyboard navigation |

### Autoplay Configuration

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-tabs-autoplay` | `"true"` / `"false"` | `"false"` | Enable autoplay |
| `data-tabs-autoplay-duration` | milliseconds | `5000` | Time per tab |
| `data-tabs-autoplay-pause-hover` | `"true"` / `"false"` | `"true"` | Pause on hover |
| `data-tabs-autoplay-pause-focus` | `"true"` / `"false"` | `"true"` | Pause on focus |

### Content Linking

| Attribute | Description |
| --- | --- |
| `data-tabs-trigger-value` | Value that links trigger to its panel |
| `data-tabs-panel-value` | Value that links panel to its trigger(s) |

### Navigation Elements

Optional controls that work automatically when placed inside the container:

| Attribute | Description |
| --- | --- |
| `data-tabs="prev"` | Previous tab button |
| `data-tabs="next"` | Next tab button |
| `data-tabs="play-pause"` | Toggle autoplay button |

## State Classes

The library applies state classes that you can style however you want.

| Class | Applied to |
| --- | --- |
| `.tabs-active` | Active trigger and panel |
| `.tabs-inactive` | Inactive triggers and panels |
| `.tabs-transitioning` | Container during tab transitions |
| `.tabs-panel-entering` | Panel that is becoming active |
| `.tabs-panel-leaving` | Panel that is becoming inactive |
| `.tabs-button-disabled` | Prev/next buttons at boundaries |
| `.tabs-autoplay-active` | Container when autoplay is running |
| `.tabs-autoplay-paused` | Container when autoplay is paused |
| `.tabs-reduced-motion` | Container when reduced motion is preferred |

### CSS Custom Properties

| Property | Applied to | Description |
| --- | --- | --- |
| `--tabs-progress` | Active trigger | Autoplay progress (0-1) |
| `--tab-count` | Container | Total number of tabs |
| `--tab-index` | Triggers & panels | Zero-based index of each element |
| `--active-index` | Container | Index of currently active tab |
| `--direction` | Container | Navigation direction: `1` (forward), `-1` (backward), `0` (initial) |
| `--autoplay-duration` | Container | Autoplay duration with unit (e.g., `5000ms`) |

These enable powerful CSS-only effects:

```css
/* Staggered entrance animations */
.tabs-panel > * {
  animation-delay: calc(var(--tab-index) * 50ms);
}

/* Sliding indicator based on active tab */
.indicator {
  transform: translateX(calc(var(--active-index) * 100%));
}

/* Directional slide transitions */
.tabs-panel-entering {
  animation: var(--direction, 1) > 0 ? slideFromRight : slideFromLeft;
}

/* Progress bar synced to autoplay */
.progress-bar {
  animation: progress var(--autoplay-duration) linear;
}
```

## JavaScript API

### Manual Initialization

```javascript
// Auto-initializes on page load by default
// Or manually initialize:
const tabs = window.Tabs.init('[data-tabs="container"]');
```

### Instance Methods

```javascript
tabs.goTo('tab-two');    // Go to specific tab by value
tabs.next();             // Go to next tab
tabs.prev();             // Go to previous tab
tabs.play();             // Start autoplay
tabs.pause();            // Pause autoplay
tabs.refresh();          // Re-initialize after DOM changes
tabs.destroy();          // Clean up and remove listeners
tabs.getActiveValue();   // Returns current active value
```

All methods are chainable (except getActiveValue and destroy):

```javascript
tabs.goTo('overview').play();
```

### Events

```javascript
tabs.on('change', (e) => {
  console.log(`Active tab: ${e.value}`);
  console.log(`Previous tab: ${e.previousValue}`);
});

tabs.on('autoplay-start', (e) => {
  console.log('Autoplay started');
});

tabs.on('autoplay-pause', (e) => {
  console.log(`Autoplay paused at ${e.progress * 100}%`);
});

// Remove listener
tabs.off('change', handler);
```

Or use native DOM events:

```javascript
container.addEventListener('tabs:change', (e) => {
  console.log(e.detail); // { tabs, value, previousValue }
});
```

Available events:

| Event | Description | Event Data |
| --- | --- | --- |
| `change` | Active tab changed | `{ value, previousValue }` |
| `autoplay-start` | Autoplay started/resumed | `{ value }` |
| `autoplay-pause` | Autoplay paused | `{ value, progress }` |

### Global API

```javascript
// Get instance by selector or element
const tabs = window.Tabs.get('.my-tabs');

// Get all instances
const allTabs = window.Tabs.getAll();

// Destroy instance
window.Tabs.destroy('.my-tabs');

// Destroy all instances
window.Tabs.destroy();
```

## URL Deep Linking

Enable URL syncing with the `data-tabs-group-name` attribute:

```html
<div data-tabs="container" data-tabs-group-name="section">
  <!-- tabs... -->
</div>
```

Now `?section=pricing` in the URL will activate the "pricing" tab on page load, and clicking tabs will update the URL.

## FAQ

<Accordions>

<Accordion title="How do I set a default tab?">
Use the `data-tabs-default` attribute:

```html
<div data-tabs="container" data-tabs-default="pricing">
```

Priority order: URL parameter > `data-tabs-default` > first trigger.
</Accordion>

<Accordion title="Can I have multiple triggers for the same panel?">
Yes! Just use the same value for multiple triggers:

```html
<button data-tabs-trigger-value="overview">Overview (sidebar)</button>
<!-- ... -->
<button data-tabs-trigger-value="overview">Overview (top nav)</button>
```

Both will activate the same panel and stay in sync.
</Accordion>

<Accordion title="How do I animate the progress indicator?">
Use the `--tabs-progress` CSS custom property:

```css
.tabs-trigger::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: currentColor;
  width: calc(var(--tabs-progress, 0) * 100%);
}
```

</Accordion>

<Accordion title="Does it work with nested tabs?">
Yes! Each container is scoped independently. Triggers and panels are matched only within their own container.
</Accordion>

<Accordion title="What about accessibility?">
The library automatically sets:
- `role="tab"` on triggers
- `role="tabpanel"` on panels
- `aria-selected`, `aria-controls`, `aria-labelledby`
- Proper `tabindex` management
- `aria-orientation` on the container
</Accordion>

</Accordions>
