import {
  SWIPER_CONFIG,
  SWIPER_STRUCTURE_CLASSES,
  SWIPER_MODULE_ATTRIBUTE_KEYS,
  SWIPER_MODULE_ATTRIBUTE_SELECTORS,
  SWIPER_LOG_PREFIX,
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

// Parses attribute value strings into native types
function parseAttributeValue(value) {
  // Boolean checks
  if (value === 'true') return true;
  if (value === 'false') return false;
  // Number check
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) return asNumber;
  return value;
}

// Takes all the data-* attributes on the root element and converts them into a Swiper configuration object so users can configure without JavaScript
function parseOptionsFromAttributes(root) {
  const options = {};
  const prefix = `${SWIPER_CONFIG.attributePrefix}-`;
  const { attrName: rootIdAttr } = SWIPER_CONFIG.scope;

  Array.from(root.attributes).forEach((attr) => {
    // Skip root ID attribute since it's not part of the Swiper config
    if (attr.name === rootIdAttr) return;

    // Only process attributes with the configured prefix
    if (!attr.name.startsWith(prefix)) return;

    // Skip empty strings or whitespace-only values
    if (!attr.value.trim()) return;

    const rawName = attr.name.slice(prefix.length);
    if (!rawName) return;

    // Check if this is a module key so it can be nested under the appropriate module name in the Swiper config
    const moduleKey = SWIPER_MODULE_ATTRIBUTE_KEYS.find((key) =>
      rawName.startsWith(`${key}-`)
    );

    const value = parseAttributeValue(attr.value);

    if (moduleKey) {
      const parentKey = toCamelCase(moduleKey);
      const childKey = toCamelCase(rawName.slice(moduleKey.length + 1));

      if (!options[parentKey]) {
        options[parentKey] = {};
      }

      options[parentKey][childKey] = value;
    } else {
      // Not part of a known module, so it's a top-level option
      const camelKey = toCamelCase(rawName);
      options[camelKey] = value;
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
    return { ...resolvedParams, ...userModuleOptions };
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
    const moduleOptions = buildModuleOptions(root, rootId, userOptions);

    // Merge them
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
      log('error', 'Failed to initialize Swiper for root:', root);
      console.error(error);
    }
  });

  return instances;
}
