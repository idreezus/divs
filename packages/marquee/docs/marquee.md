# Marquee

A seamless infinite scrolling component. Powered by GSAP.

Dependencies:

- GSAP

## Features

- Drop-in setup with HTML attributes, no build step
- Auto-clones items for seamless infinite looping
- Smooth hover effects with speed ramping and easing
- Works with any item sizes, spacing, and responsive layouts
- Vertical or horizontal directions

## Installation

> [!NOTE] Before you start
> This component requires GSAP. If you're using Webflow, enable GSAP in Designer → Settings (gear icon) → GSAP toggle. For other platforms, include GSAP from a CDN like jsDelivr before adding the marquee script.

<Tabs>
<Tab label="Webflow">
Copy and paste this into your Page Settings under "Before `</body>` tag":

```html
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-b/marquee.min.js"></script>
```

</Tab>

<Tab label="HTML / Other">
Add GSAP first, then the marquee script:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://divs-cdn.idreezus.com/marquee/v1.0.0-b/marquee.min.js"></script>
```

</Tab>
</Tabs>

## Quick Start

To get a marquee running, you need two things:

1. **A container** with `data-marquee-direction` set to either `horizontal` or `vertical`
2. **Items inside** with `data-marquee-item="true"` on each element you want to animate

Here's the minimum setup:

<Tabs>
<Tab label="HTML">
```html
<div class="marquee-container" data-marquee-direction="horizontal">
  <div data-marquee-item="true">Item 1</div>
  <div data-marquee-item="true">Item 2</div>
  <div data-marquee-item="true">Item 3</div>
</div>
```
</Tab>

<Tab label="CSS">
```css
.marquee-container {
  display: flex;
  overflow: hidden;
  gap: 20px;
}

/_ For vertical marquees _/
.marquee-container[data-marquee-direction="vertical"] {
flex-direction: column;
height: 300px; /_ Or max-height - vertical needs a size constraint _/
}

````
</Tab>
</Tabs>

> [!IMPORTANT]
> Your container must have `display: flex` and `overflow: hidden` in the CSS. Without these, the marquee won't display correctly. For vertical marquees, also add `flex-direction: column` and set a size constraint (`height` or `max-height`) on the container.

**Spacing between items:** Use the CSS `gap` property on your container. The component measures this spacing and applies it at the loop seam automatically.

## Customizing the Component

### Reversing Direction

To reverse direction, provide `data-marquee-reverse="true"`. This flips the playback so items move in the opposite direction.

### Changing Speed

Speeds can be adjusted with `data-marquee-speed`. Higher numbers make the marquee faster. The default is `0.7`, but you can set it to any value greater than or equal to zero.

### Hover Effects

Hover effects can be enabled with `data-marquee-hover-effect`. Set it to `pause` to ramp smoothly to a stop when hovering, or `slow` to reduce speed while maintaining motion. By default, hovering the container triggers the effect, but you can set `data-marquee-hover-trigger="items"` to only activate when hovering individual items.

### Fine-Tuning Hover Behavior

When using hover effects, you can control how the transition feels with these attributes:

**For pause effects:**

- `data-marquee-hover-speed-ratio` - Sets the intermediate speed before reaching a full stop (default: `0.1`)
- `data-marquee-hover-pause-duration` - Controls how long the entire ramp-down takes (default: `0.4` seconds)

**For slow effects:**

- `data-marquee-hover-speed-ratio` - Sets the sustained slower speed while hovering (default: `0.3`)
- `data-marquee-hover-duration-in` - Ramp-in timing when entering hover (default: `0.7` seconds)
- `data-marquee-hover-duration-out` - Ramp-out timing when leaving hover (default: `0.25` seconds)
- `data-marquee-hover-ease-in` and `data-marquee-hover-ease-out` - GSAP easing functions for smoother transitions (default: `power1.out`)

### Disabling Auto-Cloning

By default, the marquee clones your items automatically to ensure a seamless loop. If you want to handle cloning manually or already have enough content, set `data-marquee-auto-clone="false"`. You can also adjust how many times items are cloned with `data-marquee-clone-count`.

## Examples

_Empty. Will add later_

## Make It Yours (Attributes)

Most attributes are optional. You only need `data-marquee-direction` on the container and `data-marquee-item="true"` on the items to get started. Everything else is for customization.

**Core Attributes**

| Attribute                | Values                   | Default      | Description                                       |
| ------------------------ | ------------------------ | ------------ | ------------------------------------------------- |
| `data-marquee-direction` | `horizontal`, `vertical` | `horizontal` | Sets the scroll direction.                        |
| `data-marquee-item`      | `"true"`                 | —            | Marks an element as an animated item.             |
| `data-marquee-speed`     | A number ≥ 0             | `0.7`        | Controls loop speed. Higher is faster.            |
| `data-marquee-reverse`   | `"true"` to activate     | disabled     | Reverses the playback direction when set to true. |

**Cloning Options**

| Attribute                  | Values               | Default | Description                                      |
| -------------------------- | -------------------- | ------- | ------------------------------------------------ |
| `data-marquee-auto-clone`  | `"false"` to disable | enabled | Controls automatic cloning for seamless looping. |
| `data-marquee-clone-count` | A number ≥ 1         | `2`     | Number of additional item sets appended.         |

**Hover Interaction**

| Attribute                        | Values                | Default                   | Description                                                                |
| -------------------------------- | --------------------- | ------------------------- | -------------------------------------------------------------------------- |
| `data-marquee-hover-effect`            | `pause`, `slow`, omit | omit                      | Enables a hover effect: ramp to pause, or slow down.                       |
| `data-marquee-hover-trigger`    | `container`, `items`  | `container`               | Where the hover effect is triggered.                                       |
| `data-marquee-hover-speed-ratio`  | A number ≥ 0          | pause: `0.1`, slow: `0.3` | For pause: mid-ramp speed before pausing. For slow: sustained hover speed. |
| `data-marquee-hover-pause-duration`    | A number ≥ 0          | `0.4`                     | Total ramp time into a pause (seconds).                                    |
| `data-marquee-hover-duration-in`  | A number ≥ 0          | `0.7`                     | Ramp-in duration when slowing on hover (seconds).                          |
| `data-marquee-hover-duration-out` | A number ≥ 0          | `0.25`                    | Ramp-out duration when leaving hover (seconds).                            |
| `data-marquee-hover-ease-in`      | any GSAP ease         | `power1.out`              | Ease for ramping into slow.                                                |
| `data-marquee-hover-ease-out`     | any GSAP ease         | `power1.out`              | Ease for ramping out of slow or into pause completion.                     |

## JavaScript API

Most of the time, the marquee just works with attributes. Use the JavaScript API when you need manual control, like pausing on a button click or dynamically adding marquees after page load.

| API                           | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `window.Marquee.init()`       | Scans the DOM and initializes any new marquees.                 |
| `window.Marquee.get(element)` | Retrieves the marquee instance created for a container element. |
| `instance.play()`             | Resumes playback.                                               |
| `instance.pause()`            | Pauses playback.                                                |
| `instance.destroy()`          | Cleans up event listeners and timeline.                         |

### Manual control (quick snippet)

```html
<div id="logos" data-marquee-direction="horizontal">
  <div data-marquee-item="true">Logo A</div>
  <div data-marquee-item="true">Logo B</div>
</div>

<script>
  const logos = document.getElementById('logos');
  const marquee = window.Marquee.get(logos);
  marquee.pause();
  // later
  marquee.play();
</script>
````

## Accessibility

- For those using screen readers, all cloned elements have an `aria-hidden="true"` attribute to prevent duplicate content from being read aloud.
- If a user has `prefers-reduced-motion` enabled in their system preferences, it'll respect their preferences by slowing down the marquee significantly to reduce motion intensity while keeping the visual effect functional.

## FAQ

<Accordion title="Why are my items overflowing outside the container?">
  You forgot to add `overflow: hidden` to your marquee container. Without it, items will be visible outside the bounds as they animate. This is the most common mistake when setting up the component. Just add `overflow: hidden` to your container's CSS and it'll clip everything properly.
</Accordion>

<Accordion title="How can I remove the fade effect at the edges?">
TODO: Finish this.
</Accordion>

<Accordion title="Can I start my items from the center?">
TODO: No.
</Accordion>

<Accordion title="My vertical marquee isn't working. What's wrong?">
  Vertical marquees need three things: `data-marquee-direction="vertical"`, `flex-direction: column`, and a size constraint (`height` or `max-height`) on the container. Without a size constraint, the browser doesn't know where to clip the content. Add `height: 300px` or `max-height: 400px` to your container's CSS and it should work.
</Accordion>

<Accordion title="How do I control spacing between items?">
  Use the CSS `gap` property on your container. The component automatically measures the gap from your layout and applies it at the loop seam, so everything stays consistent. Avoid using margins on individual items since that's harder for the component to measure accurately.
</Accordion>

<Accordion title="Why is cloning on by default?">
  If you only have a few items, the marquee needs to clone them to create a seamless infinite loop. Without cloning, there would be a visible gap when the last item finishes and the first item starts again. Auto-cloning saves you from having to manually duplicate your content. If you already have plenty of items or want to handle duplication yourself, turn it off with `data-marquee-auto-clone="false"`.
</Accordion>

<Accordion title="Can I pause the marquee with a button?">
  Yes. Use the JavaScript API. Grab the marquee instance with `window.Marquee.get(element)`, then call `.pause()` or `.play()` on it. Check the JavaScript API section for a code example.
</Accordion>

<Accordion title="Does it respect prefers-reduced-motion?">
  Yes. If someone has enabled reduced motion in their system preferences, the marquee automatically slows down significantly to reduce motion intensity while keeping the visual effect functional.
</Accordion>
