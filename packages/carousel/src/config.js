// Configuration for attribute names and scope identifiers
export const SWIPER_CONFIG = {
  attributePrefix: 'data-swiper',
  attributes: {
    root: 'root',
    swiper: 'swiper',
    wrapper: 'wrapper',
    slide: 'slide',
    bulkJson: 'options',
  },
  scope: {
    attrName: 'data-swiper-root-id',
    valuePrefix: 'swiper-root-',
  },
};

// The attribute values for module elements (e.g. SwiperJS's navigation.nextEl – the next button – is [data-swiper-navigation="next"])
export const SWIPER_MODULE_ATTRIBUTE_SELECTORS = {
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

// Prefix for all console logs
export const SWIPER_LOG_PREFIX = '[Carousel]';

// Maps friendly shorthand names to Webflow's default breakpoint pixel values
// These are min-width pixel values.
// Swiper will apply the changes at the breakpoint value and upwards, and the default value (without breakpoints) is applied at the smallest breakpoint, kinda like Tailwind.
// TODO: Survey people on how they want the breakpoint surveys to act: mobile-first (like SwiperJS expects) or desktop-first (like Webflow expects)?
export const SWIPER_BREAKPOINT_SHORTHANDS = {
  desktop: '992', // Desktop and above
  tablet: '768', // Tablet and above
  landscape: '480', // Mobile landscape and above
  portrait: '0', // Mobile portrait and above

  // mobile: '767', // Alias for landscape
  // phone: '0', // Alias for mobile-portrait
};

// ------------------------------------------------------------
// Note to self: Don't change anything below here
// ------------------------------------------------------------

// Mandatory classes required by SwiperJS's expected structure that this script abstracts and adds to the DOM
export const SWIPER_STRUCTURE_CLASSES = {
  swiper: 'swiper',
  wrapper: 'swiper-wrapper',
  slide: 'swiper-slide',
};

// All the SwiperJS modules (here so we can parse the data-swiper-* attributes for them)
export const SWIPER_MODULE_ATTRIBUTE_KEYS = [
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

// Params that are allowed to be passed in via attributes on the root element
// Note: Swiper uses _ prefix to mark "watchable" params, but we don't need that for our use case, so the underscores have been removed
export const SWIPER_ALLOWED_PARAMS = [
  'eventsPrefix',
  'injectStyles',
  'injectStylesUrls',
  'modules',
  'init',
  'direction',
  'oneWayMovement',
  'swiperElementNodeName',
  'touchEventsTarget',
  'initialSlide',
  'speed',
  'cssMode',
  'updateOnWindowResize',
  'resizeObserver',
  'nested',
  'focusableElements',
  'enabled',
  'width',
  'height',
  'preventInteractionOnTransition',
  'userAgent',
  'url',
  'edgeSwipeDetection',
  'edgeSwipeThreshold',
  'freeMode',
  'autoHeight',
  'setWrapperSize',
  'virtualTranslate',
  'effect',
  'breakpoints',
  'breakpointsBase',
  'spaceBetween',
  'slidesPerView',
  'maxBackfaceHiddenSlides',
  'grid',
  'slidesPerGroup',
  'slidesPerGroupSkip',
  'slidesPerGroupAuto',
  'centeredSlides',
  'centeredSlidesBounds',
  'slidesOffsetBefore',
  'slidesOffsetAfter',
  'normalizeSlideIndex',
  'centerInsufficientSlides',
  'watchOverflow',
  'roundLengths',
  'touchRatio',
  'touchAngle',
  'simulateTouch',
  'shortSwipes',
  'longSwipes',
  'longSwipesRatio',
  'longSwipesMs',
  'followFinger',
  'allowTouchMove',
  'threshold',
  'touchMoveStopPropagation',
  'touchStartPreventDefault',
  'touchStartForcePreventDefault',
  'touchReleaseOnEdges',
  'uniqueNavElements',
  'resistance',
  'resistanceRatio',
  'watchSlidesProgress',
  'grabCursor',
  'preventClicks',
  'preventClicksPropagation',
  'slideToClickedSlide',
  'loop',
  'loopAdditionalSlides',
  'loopAddBlankSlides',
  'loopPreventsSliding',
  'rewind',
  'allowSlidePrev',
  'allowSlideNext',
  'swipeHandler',
  'noSwiping',
  'noSwipingClass',
  'noSwipingSelector',
  'passiveListeners',
  'containerModifierClass',
  'slideClass',
  'slideActiveClass',
  'slideVisibleClass',
  'slideFullyVisibleClass',
  'slideNextClass',
  'slidePrevClass',
  'slideBlankClass',
  'wrapperClass',
  'lazyPreloaderClass',
  'lazyPreloadPrevNext',
  'runCallbacksOnInit',
  'observer',
  'observeParents',
  'observeSlideChildren',

  // modules
  'a11y',
  'autoplay',
  'controller',
  'coverflowEffect',
  'cubeEffect',
  'fadeEffect',
  'flipEffect',
  'creativeEffect',
  'cardsEffect',
  'hashNavigation',
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
  'control',
];
