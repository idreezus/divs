# Tabs

An accessible, keyboard-navigable tabs component that just works.

<Features>

- Full keyboard navigation with arrow keys, Home, and End
- ARIA-compliant with proper roles, states, and focus management
- URL syncing for deep-linking to specific tabs
- Autoplay with progress indicator and pause-on-hover/focus
- Supports multiple triggers per panel (e.g., sidebar + content triggers)
- Works with nested tabs without conflicts
- CSS custom properties for powerful styling hooks
- Native DOM events and instance API

</Features>

## Setup

<Steps>
<Step number="1" title="Copy and paste the script">
Paste this script into your Page Settings "Before `</body>` tag".

```html
<!-- Divs Tabs Library -->
<script src="https://cdn.jsdelivr.net/gh/idreezus/divs@main/dist/tabs/latest/tabs.min.js"></script>
```

</Step>

<Step number="2" title="Copy and paste the styles">
Put the required styling on your page. Either an Embed element that's placed anywhere on your page, or your Page Settings "Inside `<head>` tag".

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/idreezus/divs@tabs-v1.0.0/dist/tabs/v1.0.0/tabs.css"
/>
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

This library takes a different approach from traditional tab implementations. Instead of relying on array indices or DOM order, tabs are linked by matching `data-tabs-trigger-id` and `data-tabs-panel-id` attributes.

This value-based linking gives you superpowers:

- Triggers and panels can live anywhere in the DOM (not just as siblings)
- Multiple triggers can control the same panel
- Order doesn't matter – matching is by value, not position
- Deep nesting works without special configuration

In the background, the library handles all the accessibility requirements (ARIA roles, states, keyboard navigation), sets up IntersectionObserver for intelligent autoplay pausing, and exposes CSS custom properties for animations that stay perfectly in sync.

### Structure

Four elements are required:

- `[data-tabs-container]` – the outermost container, used for scoping
- `[data-tabs-list]` – wraps the triggers; receives `role="tablist"` and `aria-orientation` automatically. Its CSS layout is used to auto-detect orientation and text direction
- `[data-tabs-trigger-id="..."]` – the tab trigger buttons
- `[data-tabs-panel-id="..."]` – the content panels

```html
<div data-tabs-container>
  <div data-tabs-list>
    <button data-tabs-trigger-id="overview">Overview</button>
    <button data-tabs-trigger-id="features">Features</button>
    <button data-tabs-trigger-id="pricing">Pricing</button>
  </div>
  <div>
    <div data-tabs-panel-id="overview">Overview content here</div>
    <div data-tabs-panel-id="features">Features content here</div>
    <div data-tabs-panel-id="pricing">Pricing content here</div>
  </div>
</div>
```

> [!IMPORTANT]
> Trigger and panel values are normalized to lowercase and hyphenated. So `"Tab One"`, `"tab-one"`, and `"TAB ONE"` all become `"tab-one"` internally.

## Webflow CMS

The value-based approach works great with Webflow's Collection List structure:

1. `[data-tabs-container]` – goes on an ancestor of the `Collection List Wrapper`, or on the wrapper itself if you don't need navigation buttons inside
2. `[data-tabs-trigger-id]` – goes on trigger elements (pull the value from a CMS field)
3. `[data-tabs-panel-id]` – goes on the `Collection List Item` (use the same CMS field)

Since triggers and panels are matched by value rather than position, you can have your tab triggers in one Collection List and your panels in another – as long as the values match, they'll connect.

## Customization

### Container Configuration

| Attribute             | Values                         | Default       | Description                                    |
| --------------------- | ------------------------------ | ------------- | ---------------------------------------------- |
| `data-tabs-container` | presence (skip with `"false"`) | -             | Required on container element                  |
| `data-tabs-list`      | presence                       | -             | Required on the element wrapping triggers       |
| `data-tabs-default`   | any value                      | first trigger | Initial active tab value                       |
| `data-tabs-url-param` | string                         | -             | URL parameter name for deep linking            |

### Autoplay Configuration

| Attribute                     | Values               | Default   | Description     |
| ----------------------------- | -------------------- | --------- | --------------- |
| `data-tabs-autoplay`          | `"true"` / `"false"` | `"false"` | Enable autoplay |
| `data-tabs-autoplay-duration` | milliseconds         | `5000`    | Time per tab    |
| `data-tabs-pause-hover`       | `"true"` / `"false"` | `"false"` | Pause on hover  |
| `data-tabs-pause-focus`       | `"true"` / `"false"` | `"true"`  | Pause on focus  |

### Content Linking

| Attribute              | Description                              |
| ---------------------- | ---------------------------------------- |
| `data-tabs-trigger-id` | Value that links trigger to its panel    |
| `data-tabs-panel-id`   | Value that links panel to its trigger(s) |

### Navigation Elements

Optional controls that work automatically when placed inside the container:

| Attribute              | Description            |
| ---------------------- | ---------------------- |
| `data-tabs-play-pause` | Toggle autoplay button |

```html
<div data-tabs-container data-tabs-autoplay="true">
  <div data-tabs-list>
    <!-- Triggers here -->
  </div>
  <!-- Panels here -->
  <button data-tabs-play-pause>Pause</button>
</div>
```

### Accessibility

The library follows the [WAI-ARIA Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) and handles all ARIA requirements automatically:

- `role="tablist"` on the `[data-tabs-list]` element
- `role="tab"` on triggers, `role="tabpanel"` on panels
- `aria-selected`, `aria-controls`, `aria-labelledby` linked between tabs and panels
- `tabindex` roving focus: `0` on the active tab, `-1` on all others
- `aria-hidden` on inactive panels
- `aria-orientation` set on the tablist, auto-detected from CSS

No configuration is needed — the library determines everything from the DOM.

### Orientation & Direction Detection

The library reads the CSS `flex-direction` of the `[data-tabs-list]` element to determine orientation:

- `row` or `row-reverse` → **horizontal** (Arrow Left / Arrow Right)
- `column` or `column-reverse` → **vertical** (Arrow Up / Arrow Down)

RTL text direction is also auto-detected via the computed `direction` property. In RTL horizontal mode, Arrow Left moves to the next tab and Arrow Right moves to the previous tab.

Both are re-detected on resize, so responsive layouts that switch between horizontal and vertical work automatically.

### Keyboard Navigation

| Key | Action |
| --- | --- |
| `Tab` | Moves focus into the tablist (lands on the active tab), then into the panel |
| `Arrow Left` / `Arrow Right` | Navigate between tabs (horizontal orientation) |
| `Arrow Up` / `Arrow Down` | Navigate between tabs (vertical orientation) |
| `Home` | Jump to first tab |
| `End` | Jump to last tab |

Arrow keys always wrap (cycle) from last to first and vice versa. Tabs activate on focus (automatic activation per the WAI-ARIA tabs pattern).

## State Classes

The library applies state classes that you can style however you want.

| Class                  | Applied to                                        |
| ---------------------- | ------------------------------------------------- |
| `.tabs-active`         | Active trigger and panel                          |
| `.tabs-transitioning`  | Container during tab transitions                  |
| `.tabs-panel-entering` | Panel that is becoming active                     |
| `.tabs-panel-leaving`  | Panel that is becoming inactive                   |
| `.tabs-playing`        | Container when autoplay is running                |
| `.tabs-at-start`       | Container when tablist is scrolled to its start edge |
| `.tabs-at-end`         | Container when tablist is scrolled to its end edge   |

Here's an example styling the active trigger:

```css
/* Base trigger styles */
.tabs_trigger {
  background: transparent;
  border-bottom: 2px solid transparent;
  transition: border-color 200ms ease;
}

/* Active trigger */
.tabs_trigger.tabs-active {
  border-bottom-color: var(--primary);
}
```

### CSS Custom Properties

| Property                   | Applied to            | Description                                                         |
| -------------------------- | --------------------- | ------------------------------------------------------------------- |
| `--tabs-progress`          | Active trigger        | Autoplay progress (0-1)                                             |
| `--tabs-count`             | Container             | Total number of tabs                                                |
| `--tabs-index`             | Triggers &amp; panels | Zero-based index of each element                                    |
| `--tabs-active-index`      | Container             | Index of currently active tab                                       |
| `--tabs-direction`         | Container             | Navigation direction: `1` (forward), `-1` (backward), `0` (initial) |
| `--tabs-autoplay-duration` | Container             | Autoplay duration with unit (e.g., `5000ms`)                        |

These enable powerful CSS-only effects:

```css
/* Sliding indicator that follows the active tab */
.tabs_indicator {
  transform: translateX(calc(var(--tabs-active-index) * 100%));
  transition: transform 200ms ease;
}

/* Staggered entrance animations for panel content */
.tabs-panel-entering > * {
  animation: fadeUp 300ms ease backwards;
  animation-delay: calc(var(--tabs-index, 0) * 50ms);
}

/* Directional slide based on navigation direction */
.tabs-panel-entering {
  --direction: var(--tabs-direction, 1);
  transform: translateX(calc(var(--direction) * 20px));
  animation: slideIn 200ms ease forwards;
}

/* Progress bar synced to autoplay timer */
.tabs_trigger::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: currentColor;
  width: calc(var(--tabs-progress, 0) * 100%);
}
```

## JavaScript API

### Manual Initialization

```javascript
// Auto-initializes on page load by default
// Or manually instantiate:
const tabs = new Tabs(document.querySelector('[data-tabs-container]'));
```

### Instance Methods

```javascript
tabs.goTo('pricing'); // Go to specific tab by value (stops autoplay)
tabs.next(); // Go to next tab (stops autoplay)
tabs.prev(); // Go to previous tab (stops autoplay)
tabs.play(); // Start autoplay
tabs.stop(); // Stop autoplay
tabs.refresh(); // Re-initialize after DOM changes
tabs.destroy(); // Clean up and remove listeners
tabs.getActiveValue(); // Returns current active value
```

All methods are chainable except `getActiveValue` (returns data) and `destroy` (resets DOM to pre-init state). Note that `goTo()`, `next()`, and `prev()` stop autoplay when called:

```javascript
tabs.goTo('overview').play();
```

### Events

Listen for events using native DOM `addEventListener`:

```javascript
container.addEventListener('tabs:change', (e) => {
  console.log(e.detail); // { tabs, value, previousValue }
});

container.addEventListener('tabs:autoplay-start', (e) => {
  console.log('Autoplay started');
});

container.addEventListener('tabs:autoplay-stop', (e) => {
  console.log(
    `Autoplay stopped (${e.detail.reason}) at ${e.detail.progress * 100}%`
  );
});
```

Available events:

| Event                 | Description              | Event Data                    |
| --------------------- | ------------------------ | ----------------------------- |
| `tabs:change`         | Active tab changed       | `{ value, previousValue }`    |
| `tabs:autoplay-start` | Autoplay started/resumed | `{ value }`                   |
| `tabs:autoplay-stop`  | Autoplay stopped/paused  | `{ value, progress, reason }` |

### Dynamic Content

When adding/removing tabs, call `refresh()`:

```javascript
// After modifying the DOM
tabs.refresh();
```

The refresh method attempts to maintain the current active tab if it still exists.

## URL Deep Linking

Enable URL syncing with the `data-tabs-url-param` attribute:

```html
<div data-tabs-container data-tabs-url-param="section">
  <!-- tabs... -->
</div>
```

Now `?section=pricing` in the URL will activate the "pricing" tab on page load, and clicking tabs will update the URL without a page reload.

Priority order for initial tab: **URL parameter** &gt; **`data-tabs-default`** &gt; **first trigger**

## FAQ

<Accordions>

<Accordion title="How do I set a default tab?">
Use the `data-tabs-default` attribute:

```html
<div data-tabs-container data-tabs-default="pricing"></div>
```

Priority order: URL parameter &gt; `data-tabs-default` &gt; first trigger.
</Accordion>

<Accordion title="Can I have multiple triggers for the same panel?">
Yes! Just use the same value for multiple triggers:

```html
<button data-tabs-trigger-id="overview">Overview (sidebar)</button>
<!-- ... elsewhere in the container ... -->
<button data-tabs-trigger-id="overview">Overview (top nav)</button>
```

Both will activate the same panel and stay in sync.
</Accordion>

<Accordion title="How do I animate the autoplay progress indicator?">
Use the `--tabs-progress` CSS custom property, which updates from 0 to 1 during autoplay:

```css
.tabs_trigger::after {
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
Yes! Each container is scoped independently. Triggers and panels are matched only within their own container, so nested tabs work without any special configuration.
</Accordion>

<Accordion title="What about accessibility?">
Everything is handled automatically — ARIA roles, states, keyboard navigation, and focus management all follow the WAI-ARIA Tabs pattern. Orientation and RTL direction are auto-detected from CSS so keyboard navigation always matches the visual layout. See the [Accessibility](#accessibility) and [Keyboard Navigation](#keyboard-navigation) sections for full details.
</Accordion>

<Accordion title="Why does autoplay stop when I scroll away?">
The library uses IntersectionObserver to pause autoplay when the tabs are less than 50% visible in the viewport. This improves performance and prevents tabs from cycling when users aren't looking at them. Autoplay resumes automatically when the tabs become visible again (unless the user manually paused it).
</Accordion>

<Accordion title="What if the user prefers reduced motion?">
Autoplay is automatically disabled and CSS animations are suppressed via the `prefers-reduced-motion` media query.
</Accordion>

<Accordion title="Should I use buttons or links for triggers?">
Use `<button>` elements for triggers. The library will warn in the console if you use `<a>` tags, since buttons are more semantically appropriate for in-page tab switching. If your tabs navigate to different pages, they're not really tabs – they're navigation links.
</Accordion>

<Accordion title="How do I create a sliding underline indicator?">
Use the `--tabs-active-index` CSS variable to position an indicator element:

```css
.tabs_indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: calc(100% / var(--tabs-count));
  background: var(--primary);
  transform: translateX(calc(var(--tabs-active-index) * 100%));
  transition: transform 200ms ease;
}
```

The indicator will automatically slide to follow the active tab.
</Accordion>

<Accordion title="Can I style panels differently based on direction?">
Yes! Use the `--tabs-direction` CSS variable. It's `1` when navigating forward, `-1` when going backward, and `0` on initial load:

```css
.tabs-panel-entering {
  animation: slideIn 200ms ease;
  --slide-from: calc(var(--tabs-direction, 1) * 30px);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(var(--slide-from));
  }
}
```

</Accordion>

<Accordion title="How do I make autoplay resume after user interaction?">
By default, any user interaction (clicking a tab, using keyboard navigation, calling `next()`/`prev()`/`goTo()`) fully stops autoplay. Only `play()` or the play button restarts it. If you want autoplay to resume after a delay, you can use the events API:

```javascript
const container = document.querySelector('[data-tabs-container]');
const tabs = container._tabs;

container.addEventListener('tabs:autoplay-stop', (e) => {
  if (e.detail.reason !== 'user') return;
  // Resume autoplay after 10 seconds of inactivity
  clearTimeout(window.autoplayTimeout);
  window.autoplayTimeout = setTimeout(() => {
    tabs.play();
  }, 10000);
});
```

</Accordion>

<Accordion title="Why aren't my panels showing/hiding?">
Make sure you've included the required CSS file. The base styles handle panel visibility:

```css
[data-tabs-panel-id] {
  display: none;
}
[data-tabs-panel-id].tabs-active {
  display: block;
}
```

If you're using custom display values (like `flex` or `grid`), override the active state accordingly.
</Accordion>

<Accordion title="Can I have tabs without panels (trigger-only)?">
No – the library validates that every trigger has a matching panel and vice versa. If you need trigger-only behavior (like a button group), you're better off with a simpler custom solution. Tabs are specifically for showing/hiding content panels.
</Accordion>

<Accordion title="How do I debug initialization issues?">
The library logs helpful warnings to the console:

- Missing triggers or panels
- Empty or mismatched values
- `<a>` tags used as triggers (should be `<button>`)
- URL parameters that don't match any tab

Each tabs instance also gets a `data-tabs-id` attribute for easier identification in DevTools.
</Accordion>

<Accordion title="Does autoplay work on mobile?">
Yes, but with smart behavior. Autoplay temporarily pauses when:

- The tabs scroll out of view (IntersectionObserver)
- The user hovers over the container (if `pause-hover` is opted in)
- The user focuses any element inside (if `pause-focus` is enabled)

Autoplay fully stops (requires `play()` to restart) when:

- The user clicks a tab
- The user uses keyboard navigation
- `next()`, `prev()`, or `goTo()` are called

On touch devices, hover pausing doesn't apply, but visibility and focus pausing still work.
</Accordion>

</Accordions>
