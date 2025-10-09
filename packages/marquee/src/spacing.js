// Provides functions to measure inter-item spacing for marquees
// Designed to respect margins, flex gaps, and padding by using DOM geometry

/**
 * Computes the median spacing between consecutive items.
 * The function measures item rectangles relative to the container at init time (no transforms yet),
 * which captures layout spacing (margins, flex gaps) in a browser-accurate way.
 */
export function computeMedianGap(containerElement, itemElements, isVertical) {
  // Defensive checks to avoid NaN propagation
  if (
    !containerElement ||
    !Array.isArray(itemElements) ||
    itemElements.length < 2
  ) {
    return 0;
  }

  const containerRect = containerElement.getBoundingClientRect();
  const itemRects = itemElements.map((element) =>
    element.getBoundingClientRect()
  );

  const spacings = [];
  for (let itemIndex = 0; itemIndex < itemRects.length - 1; itemIndex++) {
    const current = itemRects[itemIndex];
    const next = itemRects[itemIndex + 1];
    if (isVertical) {
      // Distance from current bottom to next top
      const spacing = next.top - current.bottom;
      spacings.push(spacing);
    } else {
      // Distance from current right to next left
      const spacing = next.left - current.right;
      spacings.push(spacing);
    }
  }

  // Filter out pathological negatives that can happen in rare race conditions
  const filtered = spacings.filter((value) => isFinite(value));
  if (filtered.length === 0) {
    return 0;
  }

  filtered.sort((a, b) => a - b);
  const count = filtered.length;
  const median =
    count % 2 === 1
      ? filtered[(count - 1) / 2]
      : (filtered[count / 2 - 1] + filtered[count / 2]) / 2;

  // Guard tiny negative round-off and enforce non-negative padding
  return Math.max(0, Math.round(median * 1000) / 1000);
}
