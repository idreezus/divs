import {
  SWIPER_CONFIG,
  SWIPER_STRUCTURE_CLASSES,
  SWIPER_MODULE_ATTRIBUTE_KEYS,
  SWIPER_MODULE_ATTRIBUTE_SELECTORS,
  LOG_PREFIX,
} from './config.js';

// Tracks unique IDs assigned to root elements so each slider has isolated scope
let rootIdCounter = 0;

// Logs messages with consistent prefix so users can identify library-related console output
function log(type, message, element) {
  const logFn = console[type];
  if (element) {
    logFn(`${LOG_PREFIX} ${message}`, element);
  } else {
    logFn(`${LOG_PREFIX} ${message}`);
  }
}

// Builds selector for structural elements since attribute values are configurable
function buildStructuralSelector(key) {
  const { attributePrefix, attributes } = SWIPER_CONFIG;
  const value = attributes[key];
  if (!value) return null;
  return `[${attributePrefix}="${value}"]`;
}

// Builds selector for module elements so that modules can be auto-discovered from DOM
function buildModuleSelector(moduleName, value) {
  if (!moduleName || !value) return null;
  const { attributePrefix } = SWIPER_CONFIG;
  return `[${attributePrefix}-${moduleName}="${value}"]`;
}

// Builds scoped selector so multiple sliders on same page don't interfere with each other
function buildScopedSelector(rootId, elementSelector) {
  if (!rootId || !elementSelector) return null;
  const { attrName } = SWIPER_CONFIG.scope;
  return `[${attrName}="${rootId}"] ${elementSelector}`;
}

// Converts kebab-case to camelCase because SwiperJS keys use camelCase convention
function toCamelCase(text) {
  return text.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Parses attribute values into native types since HTML attributes are always strings
function parseAttributeValue(value) {
  if (value === '' || value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && value.trim() !== '') return asNumber;
  return value;
}

// Takes all the data-* attributes on the root element and converts them into a Swiper configuration object so users can configure without JavaScript
function parseOptionsFromAttributes(root) {
  const options = {};
  const prefix = `${SWIPER_CONFIG.attributePrefix}-`;
  const { attrName: rootIdAttr } = SWIPER_CONFIG.scope;

  Array.from(root.attributes).forEach((attr) => {
    // Skip root ID attribute because it's for internal scoping, not Swiper config
    if (attr.name === rootIdAttr) return;

    // Only process attributes with our prefix so we don't parse unrelated attributes
    if (!attr.name.startsWith(prefix)) return;

    const rawName = attr.name.slice(prefix.length);
    if (!rawName) return;

    // Check if this is a module parameter so it can be nested under the module key
    const moduleKey = SWIPER_MODULE_ATTRIBUTE_KEYS.find((key) =>
      rawName.startsWith(`${key}-`)
    );

    const value = parseAttributeValue(attr.value);

    if (moduleKey) {
      // Nested module parameter because Swiper expects module config in nested objects
      const parentKey = toCamelCase(moduleKey);
      const childKey = toCamelCase(rawName.slice(moduleKey.length + 1));

      if (!options[parentKey] || typeof options[parentKey] !== 'object') {
        options[parentKey] = {};
      }

      options[parentKey][childKey] = value;
    } else {
      // Top-level parameter because it's not part of a known module
      const camelKey = toCamelCase(rawName);
      options[camelKey] = value;
    }
  });

  return options;
}

// Assigns unique ID to root element so selectors can be scoped to specific slider instance
function assignRootId(root) {
  const { attrName, valuePrefix } = SWIPER_CONFIG.scope;
  const existing = root.getAttribute(attrName);
  if (existing) return existing;

  rootIdCounter += 1;
  const rootId = `${valuePrefix}${rootIdCounter}`;
  root.setAttribute(attrName, rootId);
  return rootId;
}

// Validates DOM structure meets Swiper requirements because missing elements cause runtime errors
function validateRootStructure(root) {
  // Validate exactly one swiper element because multiple would create ambiguous initialization
  const swiperSelector = buildStructuralSelector('swiper');
  const swipers = root.querySelectorAll(swiperSelector);

  if (swipers.length === 0) {
    log(
      'error',
      `Missing ${swiperSelector} inside ${buildStructuralSelector('root')}.`,
      root
    );
    return null;
  }

  if (swipers.length > 1) {
    log(
      'error',
      `Found ${swipers.length} ${swiperSelector} elements inside root. Expected exactly one.`,
      root
    );
    return null;
  }

  const swiperElement = swipers[0];

  // Validate exactly one wrapper element because Swiper requires single wrapper for transforms
  const wrapperSelector = buildStructuralSelector('wrapper');
  const wrappers = swiperElement.querySelectorAll(wrapperSelector);

  if (wrappers.length === 0) {
    log(
      'error',
      `Missing ${wrapperSelector} inside ${swiperSelector}.`,
      swiperElement
    );
    return null;
  }

  if (wrappers.length > 1) {
    log(
      'error',
      `Found ${wrappers.length} ${wrapperSelector} elements inside swiper. Expected exactly one.`,
      swiperElement
    );
    return null;
  }

  const wrapperElement = wrappers[0];

  // Validate at least one slide because empty swiper would have nothing to display
  const slideSelector = buildStructuralSelector('slide');
  const slides = wrapperElement.querySelectorAll(slideSelector);

  if (slides.length === 0) {
    log(
      'error',
      `No ${slideSelector} elements found inside ${wrapperSelector}.`,
      wrapperElement
    );
    return null;
  }

  return { swiperElement, wrapperElement, slides };
}

// Applies Swiper's required CSS classes that we've been avoiding to the DOM
function applySwiperStructureClasses(swiperElement, wrapperElement, slides) {
  swiperElement?.classList.add(SWIPER_STRUCTURE_CLASSES.swiper);
  wrapperElement?.classList.add(SWIPER_STRUCTURE_CLASSES.wrapper);
  slides.forEach((slide) =>
    slide.classList.add(SWIPER_STRUCTURE_CLASSES.slide)
  );
}

// Merges module configuration with user options so defaults don't override user settings
function mergeModuleConfig(baseConfig, userOptions) {
  if (!userOptions || userOptions === true) {
    return baseConfig;
  }
  if (typeof userOptions === 'object') {
    return { ...baseConfig, ...userOptions };
  }
  return baseConfig;
}

// Finds module elements and returns scoped selectors so only descendants of this slider instance are targeted (so multiple sliders on the same page don't interfere with each other)
function findModuleElement(root, rootId, moduleName, value) {
  const moduleSelector = buildModuleSelector(moduleName, value);
  if (!moduleSelector) return null;

  const elements = root.querySelectorAll(moduleSelector);

  if (elements.length === 0) return null;

  if (elements.length > 1) {
    log(
      'warn',
      `Found ${elements.length} elements matching ${moduleSelector}. Using the first one.`,
      root
    );
  }

  return buildScopedSelector(rootId, moduleSelector);
}

// Resolves single module configuration by finding elements and merging with user options
function resolveModule(root, rootId, moduleName, paramConfig, userOptions) {
  const resolvedParams = {};
  let foundAnyElements = false;

  // Iterate through module parameters to find and scope each element
  Object.entries(paramConfig).forEach(([paramName, value]) => {
    const scopedSelector = findModuleElement(root, rootId, moduleName, value);

    if (scopedSelector) {
      resolvedParams[paramName] = scopedSelector;
      foundAnyElements = true;
    }
  });

  const userModuleOptions = userOptions[moduleName];

  // If no elements found and user didn't configure properly, skip module
  if (!foundAnyElements && !userModuleOptions) {
    return null;
  }

  // Warn if user enabled module without elements or proper config
  if (
    !foundAnyElements &&
    (userModuleOptions === true || userModuleOptions === '')
  ) {
    log(
      'warn',
      `Module "${moduleName}" enabled via attributes but no elements found and no valid configuration provided. Skipping module.`,
      root
    );
    return null;
  }

  // Merge with user options so user settings take precedence
  return mergeModuleConfig(resolvedParams, userModuleOptions);
}

// Builds module configurations by finding elements and creating scoped selectors
function buildModuleOptions(root, rootId, userOptions = {}) {
  const modules = {};

  Object.entries(SWIPER_MODULE_ATTRIBUTE_SELECTORS).forEach(
    ([moduleName, paramConfig]) => {
      const resolved = resolveModule(
        root,
        rootId,
        moduleName,
        paramConfig,
        userOptions
      );

      if (resolved !== null) {
        modules[moduleName] = resolved; // Configured and enabled
      }
      // If null, module is not included because no elements found and not configured
    }
  );

  return modules;
}

// Creates Swiper instance for each root element found in the DOM
export function setupWebflowSwipers() {
  if (typeof window === 'undefined' || typeof window.Swiper === 'undefined') {
    log('warn', 'Swiper constructor is not available on window');
    return [];
  }

  // Reset counter for fresh IDs so re-initialization creates new unique scopes
  rootIdCounter = 0;

  // Find all root elements so each can be initialized independently
  const rootSelector = buildStructuralSelector(SWIPER_CONFIG.attributes.root);
  if (!rootSelector) {
    log('error', 'Root selector is not configured.');
    return [];
  }

  const roots = document.querySelectorAll(rootSelector);
  const instances = [];

  roots.forEach((root) => {
    // Assign unique root ID for scoping so multiple sliders don't interfere
    const rootId = assignRootId(root);

    // Validate structure because Swiper requires specific DOM hierarchy
    const structure = validateRootStructure(root);
    if (!structure) return; // Skip if validation failed

    // Apply Swiper classes because library expects them for styling and transforms
    applySwiperStructureClasses(
      structure.swiperElement,
      structure.wrapperElement,
      structure.slides
    );

    // Parse user options from attributes so configuration is declarative
    const userOptions = parseOptionsFromAttributes(root);

    // Build module configurations with scoped selectors so modules target correct elements
    const moduleOptions = buildModuleOptions(root, rootId, userOptions);

    // Merge all options so module configs don't override user top-level settings
    const swiperOptions = { ...userOptions, ...moduleOptions };

    // Initialize Swiper instance
    try {
      const instance = new window.Swiper(
        structure.swiperElement,
        swiperOptions
      );
      root.swiperInstance = instance; // Store for debugging and programmatic access
      instances.push(instance);
    } catch (error) {
      log(
        'error',
        `Failed to initialize Swiper for root. ${error.message}`,
        root
      );
    }
  });

  return instances;
}
