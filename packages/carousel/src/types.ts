// Shared type definitions for the carousel library

import type { Carousel } from './core';

// Parsed config from parseConfig()
export type CarouselConfig = {
  align: 'start' | 'center' | 'end';
  keyboard: boolean;
  loop: boolean;
  scrollBy: 'item' | 'page';
  autoplay: boolean;
  autoplayDuration: number;
  autoplayPauseHover: boolean;
  autoplayPauseFocus: boolean;
};

// Per-item measurement
export type ItemPosition = {
  left: number;
  width: number;
  center: number;
  right: number;
  marginStart: number;
  marginEnd: number;
};

// Flat carousel state
export type CarouselState = {
  currentIndex: number;
  gap: number;
  containerWidth: number;
  scrollWidth: number;
  startInset: number;
  endInset: number;
  maxReachableIndex: number;
  totalPositions: number;
  itemPositions: ItemPosition[];
  hasEmittedStart: boolean;
  hasEmittedEnd: boolean;
  isAutoplaying?: boolean;
  isPaused?: boolean;
  autoplayStartTime?: number | null;
  autoplayElapsed?: number;
  autoplayPausedOnIndex?: number | null;
};

// Stored event handlers
export type BoundHandlers = {
  scroll: () => void;
  prev: () => void;
  next: () => void;
  playPause?: () => void;
  restart?: () => void;
  keyboard?: (e: KeyboardEvent) => void;
  markerKeydown?: (e: KeyboardEvent) => void;
};

// Autoplay subsystem state
export type AutoplayState = {
  rafId: number | null;
  observer: IntersectionObserver | null;
  advanceFn: (instance: CarouselInstance) => void;
  isVisible: boolean;
  pausedByHover: boolean;
  pausedByFocus: boolean;
  handleMouseEnter?: () => void;
  handleMouseLeave?: () => void;
  handleFocusIn?: () => void;
  handleFocusOut?: (e: FocusEvent) => void;
  onStop?: () => void;
};

// Marker handler pair
export type BoundMarkerHandler = {
  marker: HTMLElement;
  handler: () => void;
};

// Debounced function with cancel
export type DebouncedFunction = {
  (...args: unknown[]): void;
  cancel: () => void;
};

// Options for findActiveIndex
export type FindActiveIndexOptions = {
  startInset?: number;
  endInset?: number;
};

// Full carousel instance shape
export type CarouselInstance = {
  container: HTMLElement;
  id: string;
  config: CarouselConfig;
  state: CarouselState;
  rafPending: boolean;
  boundHandlers: BoundHandlers | null;
  debouncedScrollHandler: DebouncedFunction | null;
  track: HTMLElement | null;
  liveRegion: HTMLElement | null;
  markerGroup: HTMLElement | null;
  items: HTMLElement[];
  prevBtns: HTMLElement[];
  nextBtns: HTMLElement[];
  markers: HTMLElement[];
  playPauseBtns: HTMLElement[];
  restartBtns: HTMLElement[];
  counterCurrentEls: HTMLElement[];
  counterTotalEls: HTMLElement[];
  snapAlign: 'start' | 'center' | 'end';
  debouncedResizeHandler: DebouncedFunction | null;
  resizeObserver: ResizeObserver | null;
  boundMarkerHandlers: BoundMarkerHandler[];
  autoplay: AutoplayState | null;
  next: () => CarouselInstance;
  prev: () => CarouselInstance;
  goTo: (index: number) => CarouselInstance;
  play: () => CarouselInstance;
  stop: () => CarouselInstance;
  refresh: () => CarouselInstance;
  getActiveIndex: () => number;
  destroy: () => null;
};

// HTMLElement with optional carousel instance
export type CarouselHTMLElement = HTMLElement & { _carousel?: Carousel };
