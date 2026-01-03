## Features

<Features>

- Built on native HTML `<dialog>` for automatic accessibility and focus management
- Simple setup: add data attributes to triggers and modals, done
- Replacement modals for multi-step flows (wizards, signups, confirmations)
- URL deep linking opens modals on page load from query params
- Automatic scroll lock with preserved scroll position
- Backdrop click and Escape key close modals automatically
- Close button injection if you don't provide one

</Features>

## Setup

<Steps>
<Step number="1" title="Load the Script">
Copy & paste this script in your Page Settings **Before `</body>` tag**

```html
<!-- Divs Modal Library -->
<script src="https://cdn.jsdelivr.net/gh/idreezus/divs@v1.0.0/dist/modal/v1.0.0/modal.min.js"></script>
```

</Step>

<Step number="2" title="Add the Styles">
Copy & paste this in an embed element or your Page Settings **Inside `<head>` tag**

```html
<style>
  /* Lock body scroll when modal is open */
  body.modal-open {
    overflow: hidden;
  }

  /* Basic modal styling */
  dialog {
    border: none;
    border-radius: 12px;
    padding: 24px;
    max-width: 480px;
    width: calc(100% - 48px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  /* Default close button (injected by library if you don't provide one) */
  .modal-close-default {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    font-size: 20px;
    background: transparent;
    border: none;
    cursor: pointer;
  }
</style>
```

</Step>

<Step number="3" title="Create Your Modal">
Add a trigger button and a `<dialog>` element anywhere on your page:

```html
<!-- Trigger (can be anywhere) -->
<button data-modal-trigger-value="my-modal">Open Modal</button>

<!-- Modal -->
<dialog data-modal-value="my-modal">
  <h2>Hello!</h2>
  <p>This is a modal dialog.</p>
  <button data-modal-close>Close</button>
</dialog>
```

</Step>
</Steps>

---

## How It Works

This library is a thin wrapper around the native HTML `<dialog>` element. The browser handles the heavy lifting:

- **Focus management** – focus moves into the modal on open, returns to trigger on close
- **Escape key** – pressing Escape closes the modal
- **Inert background** – content behind the modal becomes non-interactive
- **Accessibility** – `role="dialog"` and `aria-modal="true"` are automatic

The library adds what the native element doesn't provide:

- **Trigger linking** – connect buttons to modals via data attributes
- **Scroll lock** – prevents background scrolling when modal is open
- **Close button injection** – adds one if you forget
- **URL deep linking** – open modals from query params on page load
- **Replacement modals** – for multi-step flows

### Structure

There are two elements required:

- A trigger with `data-modal-trigger-value="X"` – the button that opens the modal
- A `<dialog>` with `data-modal-value="X"` – the modal itself

The values must match. They're normalized to lowercase with spaces converted to hyphens, so `"My Modal"` matches `"my-modal"`.

```html
<button data-modal-trigger-value="login">Log In</button>

<dialog data-modal-value="login">
  <h2>Log In</h2>
  <form>
    <input type="email" placeholder="Email" />
    <input type="password" placeholder="Password" />
    <button type="submit">Submit</button>
  </form>
  <button data-modal-close>Cancel</button>
</dialog>
```

### Non-Dialog Elements

If you use a `<div>` instead of `<dialog>`, the library wraps it automatically:

```html
<!-- This works too -->
<div data-modal-value="info">
  <h2>Info</h2>
  <p>Content here.</p>
</div>

<!-- Becomes: -->
<dialog data-modal-value="info" data-modal-wrapped>
  <div>
    <h2>Info</h2>
    <p>Content here.</p>
  </div>
</dialog>
```

---

## Customization

### Core Attributes

| Attribute | Values | Default | Description |
| --------- | ------ | ------- | ----------- |
| `data-modal-value` | String | - | Required on modal. Unique identifier. |
| `data-modal-trigger-value` | String | - | Required on trigger. Opens matching modal. |
| `data-modal-close` | - | - | Closes containing modal on click. |
| `data-modal-scroll-lock` | `"false"` | `"true"` | Opt-out of automatic scroll lock. |
| `data-modal-url-param` | String | - | Query param name for deep linking. |
| `data-modal-position` | `"center"`, `"left"`, `"right"`, `"top"`, `"bottom"` | `"center"` | Position of the modal. Adds a CSS class for styling. |

### Close Button

Add a close button inside your modal:

```html
<dialog data-modal-value="example">
  <button data-modal-close>×</button>
  <h2>Title</h2>
  <p>Content</p>
</dialog>
```

If you don't include one, the library injects a default button with the class `modal-close-default`.

### Custom Close Button Template

Provide a template anywhere on the page to customize the injected close button:

```html
<!-- Hidden template -->
<button data-modal-close-template hidden>
  <svg><!-- your icon --></svg>
</button>

<!-- Modals without close buttons will clone this template -->
<dialog data-modal-value="example">
  <h2>Title</h2>
</dialog>
```

### Backdrop Styling

Style the backdrop with the `::backdrop` pseudo-element:

```css
dialog::backdrop {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}
```

### Position Styling

Use `data-modal-position` to control where the modal appears. The library adds a CSS class (`modal-center`, `modal-left`, etc.) that you style with margins:

```html
<dialog data-modal-value="sidebar" data-modal-position="left">
  <h2>Sidebar</h2>
  <p>This slides in from the left.</p>
</dialog>
```

Example CSS for each position:

```css
/* Default centered (margin: auto on all sides) */
dialog.modal-center {
  margin: auto;
}

/* Left-aligned */
dialog.modal-left {
  margin-right: auto;
}

/* Right-aligned */
dialog.modal-right {
  margin-left: auto;
}

/* Top-aligned */
dialog.modal-top {
  margin-bottom: auto;
}

/* Bottom-aligned */
dialog.modal-bottom {
  margin-top: auto;
}
```

### URL Deep Linking

Add `data-modal-url-param` to open a modal from URL parameters:

```html
<dialog data-modal-value="promo" data-modal-url-param="promo">
  <h2>Special Offer!</h2>
  <button data-modal-close>Close</button>
</dialog>
```

Now visiting `yoursite.com?promo` will open the modal on page load. The URL updates when the modal opens/closes.

### Replacement Modals (Multi-Step Flows)

Put triggers inside modals to create flows. When clicked, the current modal closes and the next opens:

```html
<button data-modal-trigger-value="step-1">Start</button>

<dialog data-modal-value="step-1">
  <h2>Step 1</h2>
  <button data-modal-trigger-value="step-2">Next</button>
</dialog>

<dialog data-modal-value="step-2">
  <h2>Step 2</h2>
  <button data-modal-trigger-value="step-1">Back</button>
  <button data-modal-close>Done</button>
</dialog>
```

Focus returns to the original trigger (the "Start" button) when all modals close.

---

## State Classes

The library applies these classes that you can style:

| Class | Applied To | When |
| ----- | ---------- | ---- |
| `modal-open` | `<body>` | Any modal is open |
| `modal-center` | `<dialog>` | Default position (or `data-modal-position="center"`) |
| `modal-left` | `<dialog>` | `data-modal-position="left"` |
| `modal-right` | `<dialog>` | `data-modal-position="right"` |
| `modal-top` | `<dialog>` | `data-modal-position="top"` |
| `modal-bottom` | `<dialog>` | `data-modal-position="bottom"` |

Use `modal-open` for scroll lock:

```css
body.modal-open {
  overflow: hidden;
}
```

Or for dimming the page:

```css
body.modal-open {
  /* Your styles */
}
```

---

## JavaScript API

### Instance Access

```javascript
// Get instance from element
const modal = document.querySelector('dialog')._modal;
```

### Methods

```javascript
modal.open();     // Open the modal
modal.close();    // Close the modal
modal.refresh();  // Re-scan for new triggers/close buttons
modal.destroy();  // Clean up and remove listeners
```

All methods except `destroy()` are chainable:

```javascript
modal.open().close(); // Opens then immediately closes
```

### Events

Use native dialog events:

```javascript
const dialog = document.querySelector('dialog');

dialog.addEventListener('close', () => {
  console.log('Modal closed');
});

dialog.addEventListener('cancel', (e) => {
  // Fired when Escape is pressed
  // e.preventDefault() to keep modal open
});
```

### Dynamic Content

When adding new modals to the page dynamically:

```javascript
// After adding new modal elements to DOM
document.querySelector('dialog')._modal.refresh();
```

---

## FAQ

<Accordions>

<Accordion title="Why use native <dialog> instead of a div?">
Native `<dialog>` gives you accessibility, focus management, Escape key handling, and backdrop for free. No JavaScript required for the basics. The library just adds the extras (trigger linking, scroll lock, URL params).
</Accordion>

<Accordion title="How do I prevent the modal from closing?">
Listen for the `cancel` event and call `preventDefault()`:

```javascript
dialog.addEventListener('cancel', (e) => {
  e.preventDefault(); // Modal stays open on Escape
});
```

For backdrop clicks, you'd need to handle that in CSS or not use the backdrop close feature.
</Accordion>

<Accordion title="Can I have multiple modals open at once?">
No. This library uses replacement modals – when a trigger inside a modal is clicked, the current modal closes and the target opens. Only one modal is visible at a time.
</Accordion>

<Accordion title="Why does my scroll position jump?">
Make sure you have the scroll lock CSS:

```css
body.modal-open {
  overflow: hidden;
}
```

The library preserves and restores scroll position automatically.
</Accordion>

<Accordion title="How do I open a modal programmatically?">
Get the instance from the element and call `open()`:

```javascript
document.querySelector('[data-modal-value="my-modal"]')._modal.open();
```
</Accordion>

<Accordion title="What if my modal trigger doesn't exist yet?">
Triggers use event delegation on `document`, so they work even if added dynamically. No need to call `refresh()` for new triggers.
</Accordion>

</Accordions>
