// Configuration for attribute names and scope identifiers
export const SWIPER_CONFIG = {
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
export const LOG_PREFIX = '[WF Swiper]';

// ------------------------------------------------------------
// Don't change anything below here
// ------------------------------------------------------------

// Mandatory classes required by SwiperJS's expected structure that we add to the DOM
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
