import {
  SWIPER_CONFIG,
  SWIPER_STRUCTURE_CLASSES,
  SWIPER_MODULE_ATTRIBUTE_KEYS,
  SWIPER_MODULE_ATTRIBUTE_SELECTORS,
  SWIPER_ALLOWED_PARAMS,
  SWIPER_LOG_PREFIX,
  SWIPER_BREAKPOINT_SHORTHANDS,
} from './config.js';

// Tracks unique IDs for root elements to isolate scope
let rootIdCounter = 0;

// Logs messages with consistent prefix
function log(type, message, element) {
  const logFn = console[type];
  if (element) {
    logFn(`${SWIPER_LOG_PREFIX} ${message}`, element);
  } else {
    logFn(`${SWIPER_LOG_PREFIX} ${message}`);
  }
}

// Builds selector for structural elements
function buildAttributeSelectorForStructure(key) {
  const { attributePrefix, attributes } = SWIPER_CONFIG;
  const value = attributes[key];
  return `[${attributePrefix}="${value}"]`;
}

// Builds selector for module elements so that modules can be auto-discovered
function buildAttributeSelectorForModule(moduleName, value) {
  const { attributePrefix } = SWIPER_CONFIG;
  return `[${attributePrefix}-${moduleName}="${value}"]`;
}

// Builds scoped selector to prevent instance conflicts
function buildAttributeSelectorForScope(rootId, elementSelector) {
  const { attrName } = SWIPER_CONFIG.scope;
  return `[${attrName}="${rootId}"] ${elementSelector}`;
}

// Converts attribute kebab-case to camelCase for Swiper config
function toCamelCase(text) {
  return text.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Checks if value is a plain object (not array, null, or primitive)
// Used in deep merge to distinguish objects from arrays that should be replaced
function isObject(o) {
  return typeof o === 'object' && o !== null && !Array.isArray(o);
}

// Parses attribute value strings into native JavaScript types
// Handles empty strings, booleans, numbers, JSON objects, and plain strings
function formatValue(value) {
  // Empty attribute (e.g., data-swiper-free-mode) becomes true
  if (value === '') return true;

  // Boolean strings
  if (value === 'true') return true;
  if (value === 'false') return false;

  // JSON objects for complex configs (e.g., breakpoints)
  if (
    typeof value === 'string' &&
    value.includes('{') &&
    value.includes('}') &&
    value.includes('"')
  ) {
    try {
      return JSON.parse(value);
    } catch (err) {
      // Fall through to return as string if parsing fails
    }
  }

  // Numbers
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) return asNumber;

  // Plain string fallback
  return value;
}

// Parses data-swiper-options attribute containing complete JSON configuration
// Returns parsed and validated options object, or empty object if invalid/missing
// JSON keys must use camelCase (matching Swiper's JS API)
function parseOptionsFromBulkJSON(root) {
  const bulkAttr = root.getAttribute(
    `${SWIPER_CONFIG.attributePrefix}-${SWIPER_CONFIG.attributes.bulkJson}`
  );

  // No bulk config provided
  if (!bulkAttr || !bulkAttr.trim()) {
    return {};
  }

  // Try to parse JSON
  let parsedOptions;
  try {
    parsedOptions = JSON.parse(bulkAttr);
  } catch (err) {
    log(
      'warn',
      `Invalid JSON in data-swiper-options attribute. Using individual attributes only. Error: ${err.message}`,
      root
    );
    return {};
  }

  // Validate it's an object
  if (!isObject(parsedOptions)) {
    log(
      'warn',
      'data-swiper-options must contain a JSON object, not an array or primitive. Using individual attributes only.',
      root
    );
    return {};
  }

  // Validate params against Swiper's allowed list (already in camelCase)
  Object.keys(parsedOptions).forEach((key) => {
    if (!SWIPER_ALLOWED_PARAMS.includes(key)) {
      log(
        'warn',
        `Unknown parameter "${key}" in data-swiper-options. This may be ignored by Swiper. Check the Swiper API docs.`,
        root
      );
    }
  });

  return parsedOptions;
}

// Deep merges source object into target, preserving nested object properties
// Arrays and primitives are replaced, not merged
function deepMerge(target, source) {
  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];

    // If both are plain objects, recurse to merge nested properties
    if (isObject(sourceValue) && isObject(targetValue)) {
      deepMerge(targetValue, sourceValue);
    } else {
      // Otherwise replace (handles primitives, arrays, null, undefined)
      target[key] = sourceValue;
    }
  });
  return target;
}

// Transforms Webflow breakpoint shorthands to pixel values
// Example: {tablet: {...}, mobile: {...}} → {991: {...}, 767: {...}}
function transformBreakpointShorthands(config) {
  if (!config.breakpoints || !isObject(config.breakpoints)) {
    return config;
  }

  const transformed = {};

  Object.keys(config.breakpoints).forEach((key) => {
    // Check if key is a shorthand (case-insensitive)
    const lowerKey = key.toLowerCase();
    const pixelValue = SWIPER_BREAKPOINT_SHORTHANDS[lowerKey] || key;

    transformed[pixelValue] = config.breakpoints[key];
  });

  config.breakpoints = transformed;
  return config;
}

// Takes all the data-* attributes on the root element and converts them into a Swiper configuration object so users can configure without JavaScript
function parseOptionsFromAttributes(root) {
  // Start with bulk JSON config if provided, otherwise empty object
  // Individual attributes will override/merge with these base options
  const options = parseOptionsFromBulkJSON(root);
  const prefix = `${SWIPER_CONFIG.attributePrefix}-`;
  const { attrName: rootIdAttr } = SWIPER_CONFIG.scope;

  Array.from(root.attributes).forEach((attr) => {
    // Skip root ID attribute since it's not part of the Swiper config
    if (attr.name === rootIdAttr) return;

    // Only process attributes with the configured prefix
    if (!attr.name.startsWith(prefix)) return;

    const rawName = attr.name.slice(prefix.length);
    if (!rawName) return;

    // Skip the bulk config attribute (already processed at the start)
    if (rawName === SWIPER_CONFIG.attributes.bulkJson) return;

    // Check if this is a module key so it can be nested under the appropriate module name in the Swiper config
    const moduleKey = SWIPER_MODULE_ATTRIBUTE_KEYS.find((key) =>
      rawName.startsWith(`${key}-`)
    );

    const value = formatValue(attr.value);

    if (moduleKey) {
      const parentKey = toCamelCase(moduleKey);
      const childKey = toCamelCase(rawName.slice(moduleKey.length + 1));

      if (typeof options[parentKey] === 'undefined') {
        options[parentKey] = {};
      }
      if (options[parentKey] === true) {
        options[parentKey] = { enabled: true };
      }
      if (options[parentKey] === false) {
        options[parentKey] = { enabled: false };
      }

      options[parentKey][childKey] = value;
    } else if (rawName.startsWith('breakpoints-')) {
      // Handle breakpoint parameters with the data-swiper-breakpoints-{breakpoint}-{param} format, such as data-swiper-breakpoints-mobile-slides-per-view="1"
      const afterPrefix = rawName.slice('breakpoints-'.length);
      const firstDashIndex = afterPrefix.indexOf('-');

      // Skip if no parameter specified (just "breakpoints-mobile")
      if (firstDashIndex === -1) {
        return;
      }

      const breakpointKey = afterPrefix.slice(0, firstDashIndex);
      const paramPath = afterPrefix.slice(firstDashIndex + 1);

      // Initialize breakpoints object if needed
      if (typeof options.breakpoints === 'undefined') {
        options.breakpoints = {};
      }

      // Initialize this specific breakpoint's key (the actual breakpoint value) if needed
      if (typeof options.breakpoints[breakpointKey] === 'undefined') {
        options.breakpoints[breakpointKey] = {};
      }

      // Check if param is a module param (e.g., "navigation-enabled", "autoplay-delay")
      const breakpointModuleKey = SWIPER_MODULE_ATTRIBUTE_KEYS.find((key) =>
        paramPath.startsWith(`${key}-`)
      );

      // Handle nested module parameters within breakpoints, such as data-swiper-breakpoints-mobile-navigation-enabled="false"
      // Result: {breakpoints: {mobile: {navigation: {enabled: false}}}}
      if (breakpointModuleKey) {
        const parentKey = toCamelCase(breakpointModuleKey);
        const childKey = toCamelCase(
          paramPath.slice(breakpointModuleKey.length + 1)
        );

        // Validate parent module is allowed
        if (!SWIPER_ALLOWED_PARAMS.includes(parentKey)) {
          log(
            'warn',
            `Unknown breakpoint parameter "${rawName}" (module "${parentKey}" not recognized). This may be ignored by Swiper. Check the Swiper API docs.`,
            root
          );
        }

        if (
          typeof options.breakpoints[breakpointKey][parentKey] === 'undefined'
        ) {
          options.breakpoints[breakpointKey][parentKey] = {};
        }
        if (options.breakpoints[breakpointKey][parentKey] === true) {
          options.breakpoints[breakpointKey][parentKey] = { enabled: true };
        }
        if (options.breakpoints[breakpointKey][parentKey] === false) {
          options.breakpoints[breakpointKey][parentKey] = { enabled: false };
        }

        options.breakpoints[breakpointKey][parentKey][childKey] = value;
      } else {
        // Simple breakpoint param that isn't nested under a module

        const camelParam = toCamelCase(paramPath);

        // Validate against allowed params to catch typos
        if (!SWIPER_ALLOWED_PARAMS.includes(camelParam)) {
          log(
            'warn',
            `Unknown breakpoint parameter "breakpoints-${breakpointKey}-${paramPath}" (as "${camelParam}"). This may be a typo and could be ignored by Swiper. Check the Swiper API docs for valid parameters.`,
            root
          );
        }

        options.breakpoints[breakpointKey][camelParam] = value;
      }
    } else {
      // Not part of a known module, so it's a top-level option
      const camelKey = toCamelCase(rawName);

      // Validate against allowed params list to catch typos
      if (!SWIPER_ALLOWED_PARAMS.includes(camelKey)) {
        log(
          'warn',
          `Unknown parameter "${rawName}" (as "${camelKey}"). This may be a typo and could be ignored by Swiper. Check the Swiper API docs for valid parameters.`,
          root
        );
      }

      // Handle edge case: if we previously saw a boolean for this module param, convert it to an object before adding more nested props
      if (
        options[camelKey] &&
        SWIPER_MODULE_ATTRIBUTE_KEYS.includes(rawName) &&
        !isObject(value)
      ) {
        if (typeof options[camelKey] === 'boolean') {
          options[camelKey] = { enabled: options[camelKey] };
        }
        options[camelKey].enabled = !!value;
      } else {
        options[camelKey] = value;
      }
    }
  });

  return options;
}

// Assigns unique ID to root element so selectors (for module elements that get auto-detected) can be scoped to specific slider instance
function assignRootId(root) {
  const { attrName, valuePrefix } = SWIPER_CONFIG.scope;
  rootIdCounter += 1;
  const rootId = `${valuePrefix}${rootIdCounter}`;
  root.setAttribute(attrName, rootId);
  return rootId;
}

// Validates DOM structure meets Swiper requirements
function validateRootStructure(root) {
  const swiperSelector = buildAttributeSelectorForStructure(
    SWIPER_CONFIG.attributes.swiper
  );
  const swiperElement = root.querySelector(swiperSelector);

  if (!swiperElement) {
    log(
      'error',
      `Missing ${swiperSelector} inside ${buildAttributeSelectorForStructure(
        SWIPER_CONFIG.attributes.root
      )}.`,
      root
    );
    return null;
  }

  const wrapperSelector = buildAttributeSelectorForStructure(
    SWIPER_CONFIG.attributes.wrapper
  );
  const wrapperElement = swiperElement.querySelector(wrapperSelector);

  if (!wrapperElement) {
    log(
      'error',
      `Missing ${wrapperSelector} inside ${swiperSelector}.`,
      swiperElement
    );
    return null;
  }

  const slideSelector = buildAttributeSelectorForStructure(
    SWIPER_CONFIG.attributes.slide
  );
  const slides = wrapperElement.querySelectorAll(slideSelector);

  return { swiperElement, wrapperElement, slides };
}

// Applies Swiper's required CSS classes that we've been avoiding to the DOM
function applyRequiredSwiperStructureClasses(
  swiperElement,
  wrapperElement,
  slides
) {
  swiperElement.classList.add(SWIPER_STRUCTURE_CLASSES.swiper);
  wrapperElement.classList.add(SWIPER_STRUCTURE_CLASSES.wrapper);
  slides.forEach((slide) =>
    slide.classList.add(SWIPER_STRUCTURE_CLASSES.slide)
  );
}

// Helper to find module elements and returns scoped selectors
function findModuleElement(root, rootId, moduleName, value) {
  const moduleSelector = buildAttributeSelectorForModule(moduleName, value);
  if (root.querySelector(moduleSelector)) {
    return buildAttributeSelectorForScope(rootId, moduleSelector);
  }
  return null;
}

// Builds single module config by 1). finding the module elements (e.g. [data-swiper-navigation="next"]) 2). creating the scoped selector to the root to prevent instance conflict, and 3). merging with normal module options passed in via attributes on the root element
function buildCombinedModuleOptions(
  root,
  rootId,
  moduleName,
  paramConfig,
  userOptions
) {
  const resolvedParams = {};

  // Iterate through module parameters to find and scope each element
  Object.entries(paramConfig).forEach(([paramName, value]) => {
    const scopedSelector = findModuleElement(root, rootId, moduleName, value);

    if (scopedSelector) {
      resolvedParams[paramName] = scopedSelector;
    }
  });

  const userModuleOptions = userOptions[moduleName];

  // Pass config if we found elements OR user provided options
  if (Object.keys(resolvedParams).length > 0 || userModuleOptions) {
    // Deep merge to preserve nested properties from both sources
    if (userModuleOptions) {
      return deepMerge({ ...resolvedParams }, userModuleOptions);
    }
    return resolvedParams;
  }

  return null;
}

// Builds module configurations by finding elements and creating scoped selectors
function buildModuleOptions(root, rootId, userOptions = {}) {
  const modules = {};

  Object.entries(SWIPER_MODULE_ATTRIBUTE_SELECTORS).forEach(
    ([moduleName, paramConfig]) => {
      const resolved = buildCombinedModuleOptions(
        root,
        rootId,
        moduleName,
        paramConfig,
        userOptions
      );

      if (resolved) {
        modules[moduleName] = resolved;
      }
    }
  );

  return modules;
}

// Creates Swiper instance for each root element found in the DOM
export function setupWebflowSwipers() {
  if (!window.Swiper) {
    log(
      'error',
      'Swiper library not found. Make sure to include Swiper before this script.'
    );
    return [];
  }

  // Find all root elements and initialize indepdently
  const rootSelector = buildAttributeSelectorForStructure(
    SWIPER_CONFIG.attributes.root
  );
  const roots = document.querySelectorAll(rootSelector);
  const instances = [];

  roots.forEach((root) => {
    // Assign unique root ID for scoping so multiple sliders don't interfere
    const rootId = assignRootId(root);

    // Validate structure
    const structure = validateRootStructure(root);
    if (!structure) return; // Skip if validation failed

    // Apply required Swiper classes
    applyRequiredSwiperStructureClasses(
      structure.swiperElement,
      structure.wrapperElement,
      structure.slides
    );

    // Parse the user and module options
    const userOptions = parseOptionsFromAttributes(root);
    const transformedOptions = transformBreakpointShorthands(userOptions);
    const moduleOptions = buildModuleOptions(root, rootId, transformedOptions);

    // Deep merge to preserve nested properties in both objects
    const swiperOptions = deepMerge({ ...transformedOptions }, moduleOptions);

    // Initialize Swiper instance
    try {
      const instance = new window.Swiper(
        structure.swiperElement,
        swiperOptions
      );
      root.swiperInstance = instance; // Store for debugging and programmatic access
      instances.push(instance);
    } catch (error) {
      log('error', 'Failed to initialize Swiper for root:', root);
      console.error(error);
    }
  });

  return instances;
}

// Private helper: Pure parser with no side effects
function getSwiperConfig(selector) {
  const root =
    typeof selector === 'string' ? document.querySelector(selector) : selector;

  if (!root) {
    log('error', 'Element not found. Provide a valid selector or element.');
    return null;
  }

  return parseOptionsFromAttributes(root);
}

// Helper to copy text to clipboard
function copyToClipboard(text, successMessage) {
  if (typeof copy === 'function') {
    copy(text);
    console.log(successMessage);
  } else if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log(successMessage);
      })
      .catch((err) => {
        console.warn('Failed to copy to clipboard:', err);
      });
  } else {
    console.log('Tip: Manually copy the output above.');
  }
}

// Export utilities for runtime access and debugging
if (typeof window !== 'undefined') {
  window.wfSwiper = window.wfSwiper || {};
  Object.assign(window.wfSwiper, {
    // Direct access to the parser for advanced use cases
    parseOptionsFromAttributes,

    // Export as Webflow-safe attribute (HTML-escaped JSON)
    exportConfigAttr: function (selector) {
      const config = getSwiperConfig(selector);
      if (!config) return null;

      const webflowSafeJson = JSON.stringify(config, null, 2).replace(
        /"/g,
        '&quot;'
      );
      copyToClipboard(
        webflowSafeJson,
        'Copied to clipboard! You can paste this into a data-swiper-options attribute.'
      );

      return config;
    },

    // Export as custom embed code (JavaScript template)
    exportConfigEmbed: function (selector) {
      const config = getSwiperConfig(selector);
      if (!config) return null;

      // Convert to JS object literal: unquote valid identifiers and numeric keys
      const jsConfig = JSON.stringify(config, null, 2).replace(
        /"([a-zA-Z_$][a-zA-Z0-9_$]*|\d+)"\s*:/g,
        '$1:'
      );

      const embedCode = `<script>
// wf-swiper library by Idrees Isse (divs.idreezus.com)
// This runs after Webflow finishes loading the DOM structure
document.addEventListener('DOMContentLoaded', () => {
  // Update YOUR_SELECTOR_HERE so it matches the swiper element in the project
  const swiper = new Swiper('YOUR_SELECTOR_HERE', ${jsConfig});
});
</script>`;

      copyToClipboard(
        embedCode,
        'Copied to clipboard! Paste into a custom code embed.'
      );

      return config;
    },

    // Interactive export with prompt
    exportConfig: function (selector) {
      const choice = window.prompt(
        'Export format?\n1) Pasting into the data-swiper-options attribute\n2) Pasting into a custom code embed or Javascript'
      );

      if (choice === '1') {
        return window.wfSwiper.exportConfigAttr(selector);
      }
      if (choice === '2') {
        return window.wfSwiper.exportConfigEmbed(selector);
      }

      console.log('Export cancelled.');
      return null;
    },
  });
}
