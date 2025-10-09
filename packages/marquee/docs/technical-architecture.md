# Technical Architecture

This document explains how the marquee library builds seamless loops with GSAP, how spacing factors in, and how diagnostics map to the underlying math.

## Components

- marquee.js
  - Finds containers and items, auto-clones originals, applies required CSS, and creates the GSAP timeline using helpers.
  - Computes horizontal seam padding via a spacing utility to match visual gaps at the seam. Vertical seam padding is derived inside the helper at refresh-time.
- utils/seamlessLoop.js
  - GSAP helpers `horizontalLoop` and `verticalLoop` build timelines that animate items continuously and reposition them at the loop boundary.
  - Horizontal helper changes:
    - Measures `spaceBeforeX[i]` with geometry to capture real gaps.
    - Adds `spaceBeforeX[0]` to `distanceToStart` (align jump with clip edge), but not to `totalWidth` (seam spacing stays controlled by `paddingRight`).
    - Adds `tl.refresh(deep)` and a `ResizeObserver` + `window.resize` listener to re-measure and rebuild timing after layout changes.
  - Vertical helper changes:
    - Recalculates `startY` on refresh and measures `spaceBefore[]` from geometry.
    - Uses an internal `ResizeObserver` to call `refresh(true)` on container size changes.
    - Dynamically derives `paddingBottom` from the median inter-item gap when not provided, stabilizing the seam immediately after resizes.
- diagnostics.js
  - Non-invasive measurement utilities to log the real layout metrics and detect mismatches early.

## Loop math (high level)

- Items are positioned in the DOM flow; the helper measures item widths/heights and xPercent/yPercent to compute distances.
- Each item gets an animation segment from its start position to a loop boundary (distanceToLoop). When it hits that boundary, it teleports to the other side and continues.
- Timeline duration × pixelsPerSecond yields the total loop distance, referred to as helperLoopDistance.
- For stable responsiveness, transforms are expressed as percentages of item size.
- Horizontal geometry alignment:
  - `distanceToStart = offsetLeft + curX - startX + spaceBeforeX[0]`
  - `totalWidth` excludes `spaceBeforeX[0]` to avoid double-counting seam spacing (which comes from `paddingRight`).

## Spacing and the seam

- Visual spacing between items can come from CSS `gap`, item margins, or container padding.
- The seam gap (the gap when the last item loops back before the first) must match the typical inter-item spacing or the seam will look wrong.
- Horizontal approach in this codebase:
  - The helper measures geometry and derives `paddingRight` (median inter-item gap) when not explicitly provided, matching seam to real spacing.
  - Timing and spacing refresh automatically via a rAF-coalesced `ResizeObserver`.
  - Align loop jump with the visible clip edge via `spaceBeforeX[0]` in `distanceToStart`.
- Vertical approach:
  - Helper derives seam padding at refresh-time from measured median gaps when no explicit `paddingBottom` is passed.
  - This makes the seam update instantly after layout shifts (e.g., wrapping, font swaps) without rebuilding timelines.

## Why item margins can cause early teleport

- The helper’s reposition threshold is computed from item offsets and sizes, not from the container’s visible clip edge.
- When spacing is implemented with item margins, the item’s right edge can still be inside the visible area when the helper decides to loop the item, resulting in a perceived early teleport.
- Using container `gap` aligns spacing with the container’s clip edge and eliminates the mismatch.

## Diagnostics mapping

- geometrySpan: span from the first original item’s leading edge to the last original item’s trailing edge.
- helperLoopDistance: timeline.duration × pixelsPerSecond.
- seamSpacingImpliedByHelper = helperLoopDistance − geometrySpan (includes clone distance; not a direct seam-gap indicator).
- expectedSeamSpacing: median of measured inter-item gaps.
- seamSpacingDelta = expectedSeamSpacing − seamSpacingImpliedByHelper (clone-inflated; rely on exit check + visual seam).
- Horizontal exit check:
  - Computes the time at which each item would jump and samples just before that time.
  - Compares the item’s right edge to the container’s clipLeft (includes padding-left). If rightBefore > clipLeft, the item is still visually inside and the jump is early.

## Design choices

- Minimize changes to GSAP helpers; small, isolated edits clearly marked.
- Use median gap for robust seam padding; it tolerates minor variations.
- Prefer container `gap` over margins to align with the clip edge and avoid early teleports.

## Potential extension (exit offset)

- If editing helpers becomes acceptable, add an `exitOffset` (or `clipOffset`) config:
  - Horizontal: add offset equal to container border-left + typical left spacing.
  - Apply this offset when computing distanceToStart/Loop so the jump happens once the item fully clears the visible edge.
  - Any such change must be marked clearly in code: `// MODIFIED FROM ORIGINAL: Align loop jump with container clip edge`.
