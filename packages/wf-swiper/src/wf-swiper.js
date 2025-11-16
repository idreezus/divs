// Configuration for attribute names and scope identifiers so adjustments stay centralized
const DATA_SWIPER_CONFIG = {
  attributePrefix: 'data-swiper',
  attributes: {
    root: 'root',
    swiper: 'swiper',
    wrapper: 'wrapper',
    slide: 'slide',
  },
  scope: {
    attrName: 'data-swiper-root-id',
    valuePrefix: 'swiper-root-',
  },
};

const STRUCTURE_CLASSES = {
  swiper: 'swiper',
  wrapper: 'swiper-wrapper',
  slide: 'swiper-slide',
};

const SWIPER_MODULE_ATTRIBUTE_KEYS = [
  'a11y',
  'autoplay',
  'controller',
  'cards-effect',
  'coverflow-effect',
  'creative-effect',
  'cube-effect',
  'fade-effect',
  'flip-effect',
  'free-mode',
  'grid',
  'hash-navigation',
  'history',
  'keyboard',
  'mousewheel',
  'navigation',
  'pagination',
  'parallax',
  'scrollbar',
  'thumbs',
  'virtual',
  'zoom',
];

const SWIPER_MODULE_CONFIG = {
  navigation: {
    nextEl: 'next',
    prevEl: 'prev',
  },
  pagination: {
    el: 'el',
  },
  scrollbar: {
    el: 'el',
  },
};

const LOG_PREFIX = '[Webflow Swiper]';

/**
 * Logs a message with the Webflow Swiper prefix
 * @param {'error' | 'warn'} type - The type of log (error or warn)
 * @param {string} message - The message to log
 * @param {HTMLElement} [element] - Optional DOM element to include in the log
 */
function log(type, message, element) {
  const logFn = console[type];
  if (element) {
    logFn(`${LOG_PREFIX} ${message}`, element);
  } else {
    logFn(`${LOG_PREFIX} ${message}`);
  }
}

let rootIdCounter = 0;

/**
 * Builds selector for structural elements defined in DATA_SWIPER_CONFIG.attributes
 * @param {string} key - The attribute key (e.g., 'root', 'swiper', 'wrapper', 'slide')
 * @returns {string|null} The built selector or null if key is invalid
 * @example
 * buildStructuralSelector('root') // → '[data-swiper="root"]'
 * buildStructuralSelector('swiper') // → '[data-swiper="swiper"]'
 */
function buildStructuralSelector(key) {
  const { attributePrefix, attributes } = DATA_SWIPER_CONFIG;
  const value = attributes[key];
  if (!value) return null;
  return `[${attributePrefix}="${value}"]`;
}

/**
 * Builds selector for module elements
 * @param {string} moduleName - The module name (e.g., 'navigation', 'pagination')
 * @param {string} value - The element value (e.g., 'next', 'prev', 'el')
 * @returns {string|null} The built selector or null if inputs are invalid
 * @example
 * buildModuleSelector('navigation', 'next') // → '[data-swiper-navigation="next"]'
 * buildModuleSelector('pagination', 'el') // → '[data-swiper-pagination="el"]'
 */
function buildModuleSelector(moduleName, value) {
  if (!moduleName || !value) return null;
  const { attributePrefix } = DATA_SWIPER_CONFIG;
  return `[${attributePrefix}-${moduleName}="${value}"]`;
}

/**
 * Builds a scoped selector that finds elements only within a specific root
 * @param {string} rootId - The unique root ID (e.g., 'swiper-root-1')
 * @param {string} elementSelector - The element selector to scope
 * @returns {string|null} The scoped selector or null if inputs are invalid
 * @example
 * buildScopedSelector('swiper-root-1', '[data-swiper-navigation="next"]')
 * // → '[data-swiper-root-id="swiper-root-1"] [data-swiper-navigation="next"]'
 */
function buildScopedSelector(rootId, elementSelector) {
  if (!rootId || !elementSelector) return null;
  const { attrName } = DATA_SWIPER_CONFIG.scope;
  return `[${attrName}="${rootId}"] ${elementSelector}`;
}

/**
 * Converts kebab-case attribute fragments into camelCase keys
 * @param {string} text - The kebab-case string to convert
 * @returns {string} The camelCase version
 * @example
 * toCamelCase('slides-per-view') // → 'slidesPerView'
 */
function toCamelCase(text) {
  return text.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Parses attribute values into native JavaScript types
 * @param {string} value - The attribute value to parse
 * @returns {boolean|null|undefined|number|string} The parsed value
 */
function parseOptionValue(value) {
  if (value === '' || value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && value.trim() !== '') return asNumber;
  return value;
}

/**
 * Parses data-swiper-* attributes on the root into a Swiper params object
 * @param {HTMLElement} root - The root element to parse attributes from
 * @returns {Object} Swiper configuration object parsed from attributes
 * @example
 * // <div data-swiper-slides-per-view="2" data-swiper-autoplay-delay="3000">
 * parseOptionsFromAttributes(rootEl)
 * // → { slidesPerView: 2, autoplay: { delay: 3000 } }
 */
function parseOptionsFromAttributes(root) {
  const options = {};
  const prefix = `${DATA_SWIPER_CONFIG.attributePrefix}-`;
  const { attrName: rootIdAttr } = DATA_SWIPER_CONFIG.scope;

  Array.from(root.attributes).forEach((attr) => {
    // Skip root ID attribute
    if (attr.name === rootIdAttr) return;

    // Only process attributes with our prefix
    if (!attr.name.startsWith(prefix)) return;

    const rawName = attr.name.slice(prefix.length);
    if (!rawName) return;

    // Check if this is a module parameter
    const moduleKey = SWIPER_MODULE_ATTRIBUTE_KEYS.find((key) =>
      rawName.startsWith(`${key}-`)
    );

    const value = parseOptionValue(attr.value);

    if (moduleKey) {
      // Nested module parameter
      const parentKey = toCamelCase(moduleKey);
      const childKey = toCamelCase(rawName.slice(moduleKey.length + 1));

      if (!options[parentKey] || typeof options[parentKey] !== 'object') {
        options[parentKey] = {};
      }

      options[parentKey][childKey] = value;
    } else {
      // Top-level parameter
      const camelKey = toCamelCase(rawName);
      options[camelKey] = value;
    }
  });

  return options;
}

/**
 * Assigns a unique root ID to the root element for scoping
 * @param {HTMLElement} root - The root element to assign an ID to
 * @returns {string} The assigned root ID (existing or newly created)
 */
function assignRootId(root) {
  const { attrName, valuePrefix } = DATA_SWIPER_CONFIG.scope;
  const existing = root.getAttribute(attrName);
  if (existing) return existing;

  rootIdCounter += 1;
  const rootId = `${valuePrefix}${rootIdCounter}`;
  root.setAttribute(attrName, rootId);
  return rootId;
}

/**
 * Validates that root contains exactly one swiper, exactly one wrapper, and at least one slide
 * @param {HTMLElement} root - The root element to validate
 * @returns {{swiperElement: HTMLElement, wrapperElement: HTMLElement, slides: NodeList}|null} Structure elements or null if invalid
 */
function validateRootStructure(root) {
  // Validate exactly one swiper element
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

  // Validate exactly one wrapper element inside swiper
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

  // Validate at least one slide inside wrapper
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

/**
 * Applies Swiper's required classes to structural elements
 * @param {HTMLElement} swiperElement - The main swiper container element
 * @param {HTMLElement} wrapperElement - The slides wrapper element
 * @param {NodeList} slides - Collection of slide elements
 */
function applyStructureClasses(swiperElement, wrapperElement, slides) {
  swiperElement?.classList.add(STRUCTURE_CLASSES.swiper);
  wrapperElement?.classList.add(STRUCTURE_CLASSES.wrapper);
  slides.forEach((slide) => slide.classList.add(STRUCTURE_CLASSES.slide));
}

/**
 * Checks if a module is explicitly disabled via user options
 * @param {Object} userOptions - User-provided Swiper options
 * @param {string} moduleName - The module name to check
 * @returns {boolean} True if module is explicitly disabled
 */
function isModuleDisabled(userOptions, moduleName) {
  return userOptions[moduleName] === false;
}

/**
 * Merges module configuration with user-provided options
 * @param {Object} baseConfig - The base module configuration
 * @param {boolean|Object} userOptions - User-provided module options
 * @returns {Object} Merged configuration
 */
function mergeModuleConfig(baseConfig, userOptions) {
  if (!userOptions || userOptions === true) {
    return baseConfig;
  }
  if (typeof userOptions === 'object') {
    return { ...baseConfig, ...userOptions };
  }
  return baseConfig;
}

/**
 * Finds module elements within root and returns scoped selectors
 * @param {HTMLElement} root - The root element to search within
 * @param {string} rootId - The unique root ID for scoping
 * @param {string} moduleName - The module name (e.g., 'navigation')
 * @param {string} value - The element value (e.g., 'next', 'prev')
 * @returns {string|null} Scoped selector or null if no elements found
 */
function findModuleElement(root, rootId, moduleName, value) {
  const moduleSelector = buildModuleSelector(moduleName, value);
  if (!moduleSelector) return null;

  const elements = root.querySelectorAll(moduleSelector);

  // No elements found
  if (elements.length === 0) return null;

  // Warn if duplicates found
  if (elements.length > 1) {
    log(
      'warn',
      `Found ${elements.length} elements matching ${moduleSelector}. Using the first one.`,
      root
    );
  }

  // Return scoped selector
  return buildScopedSelector(rootId, moduleSelector);
}

/**
 * Resolves a single module's configuration by finding elements and building scoped selectors
 * @param {HTMLElement} root - The root element to search within
 * @param {string} rootId - The unique root ID for scoping
 * @param {string} moduleName - The module name (e.g., 'navigation', 'pagination')
 * @param {Object} paramConfig - The module parameter configuration
 * @param {Object} userOptions - User-provided Swiper options
 * @returns {Object|false|null} Module configuration, false if disabled, or null if not configured
 */
function resolveModule(root, rootId, moduleName, paramConfig, userOptions) {
  // Check if module is explicitly disabled
  if (isModuleDisabled(userOptions, moduleName)) {
    return false;
  }

  const resolvedParams = {};
  let foundAnyElements = false;

  // Iterate through module parameters (e.g., nextEl, prevEl for navigation)
  Object.entries(paramConfig).forEach(([paramName, value]) => {
    const scopedSelector = findModuleElement(root, rootId, moduleName, value);

    if (scopedSelector) {
      resolvedParams[paramName] = scopedSelector;
      foundAnyElements = true;
    }
  });

  // If no elements found and user didn't configure anything, don't enable module
  const userModuleOptions = userOptions[moduleName];
  if (!foundAnyElements && !userModuleOptions) {
    return null;
  }

  // Merge with user options
  return mergeModuleConfig(resolvedParams, userModuleOptions);
}

/**
 * Builds module configurations by finding elements within root and creating scoped selectors
 * @param {HTMLElement} root - The root element containing module elements
 * @param {string} rootId - The unique root ID for scoping
 * @param {Object} userOptions - User-provided Swiper options
 * @returns {Object} Module configurations with scoped selectors
 * @example
 * // Finds navigation buttons and builds scoped selectors
 * buildModuleOptions(rootEl, 'swiper-root-1', {})
 * // → { navigation: { nextEl: '[data-swiper-root-id="swiper-root-1"] [data-swiper-navigation="next"]', ... } }
 */
function buildModuleOptions(root, rootId, userOptions = {}) {
  const modules = {};

  Object.entries(SWIPER_MODULE_CONFIG).forEach(([moduleName, paramConfig]) => {
    const resolved = resolveModule(
      root,
      rootId,
      moduleName,
      paramConfig,
      userOptions
    );

    if (resolved === false) {
      modules[moduleName] = false; // Explicitly disabled
    } else if (resolved !== null) {
      modules[moduleName] = resolved; // Configured and enabled
    }
    // If null, module is not included (no elements found, not configured)
  });

  return modules;
}

/**
 * Creates a Swiper instance for each root element
 * @returns {Array} Array of Swiper instances created
 * @example
 * // Auto-initializes on DOMContentLoaded, or call manually:
 * const swipers = window.setupWebflowSwipers();
 *
 * // Access instance from root element:
 * const root = document.querySelector('[data-swiper="root"]');
 * root.swiperInstance.slideNext();
 */
function setupWebflowSwipers() {
  // Check if Swiper is available
  if (typeof window === 'undefined' || typeof window.Swiper === 'undefined') {
    log('warn', 'Swiper constructor is not available on window');
    return [];
  }

  // Reset counter for fresh IDs on each run
  rootIdCounter = 0;

  // Find all root elements
  const rootSelector = buildStructuralSelector('root');
  if (!rootSelector) {
    log('error', 'Root selector is not configured.');
    return [];
  }

  const roots = document.querySelectorAll(rootSelector);
  const instances = [];

  roots.forEach((root) => {
    // Assign unique root ID for scoping
    const rootId = assignRootId(root);

    // Validate structure
    const structure = validateRootStructure(root);
    if (!structure) return; // Skip if validation failed

    // Apply Swiper classes to structural elements
    applyStructureClasses(
      structure.swiperElement,
      structure.wrapperElement,
      structure.slides
    );

    // Parse user options from root attributes
    const userOptions = parseOptionsFromAttributes(root);

    // Build module configurations with scoped selectors
    const moduleOptions = buildModuleOptions(root, rootId, userOptions);

    // Merge all options
    const swiperOptions = { ...userOptions, ...moduleOptions };

    // Initialize Swiper
    try {
      const instance = new window.Swiper(
        structure.swiperElement,
        swiperOptions
      );
      root.swiperInstance = instance; // Store for debugging
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

window.setupWebflowSwipers = setupWebflowSwipers;

let autoInitHasRun = false;

/**
 * Runs setup once the DOM is ready
 * Prevents double-initialization by checking autoInitHasRun flag
 */
function autoInitWebflowSwipers() {
  if (autoInitHasRun) return;
  autoInitHasRun = true;
  setupWebflowSwipers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInitWebflowSwipers, {
    once: true,
  });
} else {
  autoInitWebflowSwipers();
}
