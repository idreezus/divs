# Diagnostics Guide

This guide explains how to use the built-in diagnostics to verify spacing and loop behavior. No code changes are required to run diagnostics.

## What diagnostics measure

- Inter-item spacing: Real gap between items using DOM geometry. Works with CSS gap, margins, and padding.
- Geometry span: Total width/height covered by the original items only.
- Helper loop distance: Timeline duration × pixelsPerSecond. Includes all clone sets (original + clones).
- Seam metrics: Derived fields like seamSpacingImpliedByHelper = helperLoopDistance − geometrySpan. Because helperLoopDistance includes clones, this number is typically large and is not a direct “error” value.
- Horizontal exit check: Verifies whether items jump only after fully leaving the visible clip edge (no early teleport).

## How to run

1. Open the test page in a browser and the DevTools console.
2. Use the global API:

```js
// Full report for one marquee
a) MarqueeDiagnostics.run('#test1')

// Run diagnostics for all marquees
b) MarqueeDiagnostics.runAll()

// Horizontal exit check (only for horizontal marquees)
c) MarqueeDiagnostics.runHorizontalExit('#test1')
```

If needed, to freeze transforms for stable geometry:

```js
const t = Marquee.get(document.querySelector('#test1')).timeline;
t.pause();
t.progress(0, true);
gsap.set('[data-marquee-item="true"]', { clearProps: 'x,xPercent,y,yPercent' });
MarqueeDiagnostics.run('#test1');
```

## Reading the report

- interItemStats.median: Typical spacing between neighbors. This is the target spacing for the seam.
- helperLoopDistance: Loop distance over all sets (original + clones). Large on purpose.
- geometrySpan: Size of original items only (no clones).
- seamSpacingImpliedByHelper: Not the visual seam gap; it reflects clone distance. Do not use this value alone to judge correctness.
- seamSpacingDelta: Not a pass/fail metric after clone-aware math. Favor the exit check and visual inspection.

## Common scenarios

- Seam gap mismatch

  - Symptom: The seam visually looks wider/narrower than normal gaps.
  - Fix: Prefer container `gap` for spacing. Seam padding is automatically set from the measured median gap inside the helpers at refresh-time.

- Early teleport (items disappear before fully exiting)
  - Symptom: runHorizontalExit shows wasFullyOut = false and overhangPx > 0.
  - Cause: Item margins (especially left margins) do not align with the container’s clip edge.
  - Fix: Prefer container `gap`. Avoid item margins for spacing.

## Recommended CSS

```css
[data-marquee] {
  display: flex;
  overflow: hidden;
  gap: 20px; /* spacing */
}

[data-marquee='vertical'] {
  flex-direction: column;
  height: 400px; /* set as needed */
}

[data-marquee-item] {
  /* no margins; spacing comes from container gap */
  /* other styles like padding, background, font, etc. */
}
```

## Quick validation

1. Run MarqueeDiagnostics.run('#test1').
2. Confirm interItemStats.median ≈ your CSS gap value.
3. For horizontal marquees, run MarqueeDiagnostics.runHorizontalExit('#test1') and ensure wasFullyOut = true and overhangPx ≈ 0.
4. Visually confirm the seam spacing matches neighbor gaps.

## Troubleshooting

- Numbers look huge or negative: freeze transforms (see freeze snippet above) and re-run.
- Vertical marquee not looping: ensure any custom `paddingBottom` is numeric if supplied; otherwise the helper derives it automatically on refresh.
- Mixed spacing (some items have different gaps): consider the median as the seam value or switch to a consistent container gap.
- Large seamSpacingImpliedByHelper: expected (clone distance). Use exit check and visual seam as truth.
