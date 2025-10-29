import { CONFIG } from '../config/config.js';

// Creates clones of marquee items and appends them to the container for seamless looping
export function cloneItems(container, originalItems, cloningConfig) {
  const autoCloneAttr = container.getAttribute(CONFIG.cloning.attributes.autoClone);
  const autoCloneEnabled = autoCloneAttr === null
    ? cloningConfig?.autoClone ?? CONFIG.cloning.defaults.autoClone
    : autoCloneAttr !== 'false';

  if (!autoCloneEnabled) return;

  const cloneCountAttr = container.getAttribute(CONFIG.cloning.attributes.cloneCount);
  const cloneCount = cloneCountAttr
    ? parseInt(cloneCountAttr, 10)
    : cloningConfig?.cloneCount ?? CONFIG.cloning.defaults.cloneCount;

  if (isNaN(cloneCount) || cloneCount < 1) return;

  for (let i = 0; i < cloneCount; i++) {
    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      container.appendChild(clone);
    });
  }
}

// Removes all cloned marquee items from the container
export function removeClones(container) {
  const selector = `[${CONFIG.core.attributes.item}="true"][aria-hidden="true"]`;
  const clones = container.querySelectorAll(selector);
  clones.forEach(clone => clone.remove());
}
