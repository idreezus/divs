// Computes median spacing between consecutive items for seamless loop padding
export function computeMedianGap(containerElement, itemElements, isVertical) {
  if (!containerElement || !Array.isArray(itemElements) || itemElements.length < 2) {
    return 0;
  }

  const itemRects = itemElements.map((element) => element.getBoundingClientRect());

  const spacings = [];
  for (let itemIndex = 0; itemIndex < itemRects.length - 1; itemIndex++) {
    const current = itemRects[itemIndex];
    const next = itemRects[itemIndex + 1];

    const spacing = isVertical
      ? next.top - current.bottom
      : next.left - current.right;

    spacings.push(spacing);
  }

  const filtered = spacings.filter((value) => isFinite(value));
  if (filtered.length === 0) {
    return 0;
  }

  filtered.sort((a, b) => a - b);
  const count = filtered.length;
  const median = count % 2 === 1
    ? filtered[(count - 1) / 2]
    : (filtered[count / 2 - 1] + filtered[count / 2]) / 2;

  return Math.max(0, Math.round(median * 1000) / 1000);
}
