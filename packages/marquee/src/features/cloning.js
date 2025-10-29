import { CONFIG } from '../setup/config.js';

// Calculates optimal clone count based on container and items size
function calculateOptimalCloneCount(container, items, isVertical) {
  if (items.length === 0) return 1;

  const containerSize = isVertical
    ? container.clientHeight
    : container.clientWidth;

  // Measure actual rendered size including gaps, margins, and padding
  let totalContentSize = 0;
  if (items.length === 1) {
    totalContentSize = isVertical
      ? items[0].offsetHeight
      : items[0].offsetWidth;
  } else {
    // Measure from first item start to last item end (includes all gaps)
    const firstRect = items[0].getBoundingClientRect();
    const lastRect = items[items.length - 1].getBoundingClientRect();

    totalContentSize = isVertical
      ? lastRect.bottom - firstRect.top
      : lastRect.right - firstRect.left;
  }

  // Need at least 2x container size worth of content for seamless loop
  const requiredSize = containerSize * 2;
  const clonesNeeded = Math.ceil(requiredSize / totalContentSize);

  // Debug logging with URL parameter
  if (window.location.search.includes('marquee-debug')) {
    console.log('Clone calculation:', {
      containerSize,
      totalContentSize,
      requiredSize,
      clonesNeeded,
      itemCount: items.length,
    });
  }

  // Clamp between 1 and 10 to avoid edge cases
  return Math.max(1, Math.min(10, clonesNeeded));
}

// Creates clones of marquee items and appends them to the container for seamless looping
export function cloneItems(
  container,
  originalItems,
  cloningConfig,
  isVertical = false
) {
  const autoCloneAttr = container.getAttribute(
    CONFIG.cloning.attributes.autoClone
  );
  const autoCloneEnabled =
    autoCloneAttr === null
      ? cloningConfig?.autoClone ?? CONFIG.cloning.defaults.autoClone
      : autoCloneAttr !== 'false';

  if (!autoCloneEnabled) return;

  const cloneCountAttr = container.getAttribute(
    CONFIG.cloning.attributes.cloneCount
  );

  let cloneCount;
  if (cloneCountAttr) {
    // User explicitly set clone count
    cloneCount = parseInt(cloneCountAttr, 10);
    if (isNaN(cloneCount) || cloneCount < 1) return;
    // Clamp to max of 10
    if (cloneCount > 10) {
      cloneCount = 10;
    }
  } else {
    // Auto-calculate optimal clone count
    cloneCount = calculateOptimalCloneCount(
      container,
      originalItems,
      isVertical
    );

    // Log calculated count in debug scenarios
    if (window.location.search.includes('marquee-debug')) {
      console.log(
        'Marquee: Auto-calculated clone count:',
        cloneCount,
        'for',
        container
      );
    }
  }

  if (cloneCount < 1) return;

  for (let i = 0; i < cloneCount; i++) {
    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute(CONFIG.cloning.attributes.clone, 'true');
      container.appendChild(clone);
    });
  }
}

// Removes all cloned marquee items from the container
export function removeClones(container) {
  const clones = container.querySelectorAll(
    `[${CONFIG.cloning.attributes.clone}="true"]`
  );
  clones.forEach((clone) => clone.remove());
}
