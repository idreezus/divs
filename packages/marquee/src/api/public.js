import { MarqueeInstance } from '../core/MarqueeInstance.js';
import { CONFIG } from '../config/config.js';

const instances = new WeakMap();

export const MarqueeAPI = {
  // Initializes marquee instances for all matching containers
  init(selector = null, options = {}) {
    try {
      const containerSelector = selector || `[${CONFIG.core.attributes.container}]`;
      const containers = document.querySelectorAll(containerSelector);

      if (containers.length === 0) {
        console.warn('Marquee: No containers found with selector:', containerSelector);
        return this;
      }

      containers.forEach((container) => {
        if (!instances.has(container)) {
          try {
            const instance = new MarqueeInstance(container, options);
            if (instance.timeline) {
              instances.set(container, instance);
            }
          } catch (error) {
            console.error('Marquee: Failed to create instance', error, container);
          }
        }
      });

      return this;
    } catch (error) {
      console.error('Marquee: Initialization failed', error);
      return this;
    }
  },

  // Returns the marquee instance for a given container element
  get(element) {
    return instances.get(element) || null;
  },

  // Destroys a single marquee instance and removes it from the registry
  destroy(element) {
    try {
      const instance = instances.get(element);
      if (instance) {
        instance.destroy();
        instances.delete(element);
      }
    } catch (error) {
      console.error('Marquee: Failed to destroy instance', error, element);
    }
  },

  // Destroys all marquee instances matching the selector
  destroyAll(selector = null) {
    const containerSelector = selector || `[${CONFIG.core.attributes.container}]`;
    const containers = document.querySelectorAll(containerSelector);

    containers.forEach((container) => {
      this.destroy(container);
    });
  },
};
