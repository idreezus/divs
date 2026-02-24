// Shared type definitions for the tabs library

import type { Tabs } from './core';

// Parsed config from parseConfig()
export type TabsConfig = {
  groupName: string | null;
  defaultValue: string | null;
  autoplay: boolean;
  autoplayDuration: number;
  autoplayPauseHover: boolean;
  autoplayPauseFocus: boolean;
};

// Runtime state
export type TabsState = {
  activeValue: string | null;
  orientation: 'horizontal' | 'vertical';
  direction: 'ltr' | 'rtl';
  isAutoplaying: boolean;
  isPaused: boolean;
  autoplayStartTime: number | null;
  autoplayElapsed: number;
  autoplayPausedOnValue: string | null;
};

// Autoplay subsystem state
export type AutoplayState = {
  rafId: number | null;
  observer: IntersectionObserver | null;
  advanceFn: (instance: TabsInstance) => void;
  isVisible: boolean;
  pausedByHover: boolean;
  pausedByFocus: boolean;
  handleMouseEnter?: () => void;
  handleMouseLeave?: () => void;
  handleFocusIn?: () => void;
  handleFocusOut?: (e: FocusEvent) => void;
};

// Stored event handlers
export type BoundHandlers = {
  triggerClicks: Array<{ trigger: HTMLElement; handler: (e: Event) => void }>;
  scroll: (() => void) | null;
  resizeObserver: ResizeObserver | null;
  playPause: (() => void) | null;
  keyboard: ((e: KeyboardEvent) => void) | null;
};

// Options for activate()
export type ActivateOptions = {
  silent?: boolean;
  updateUrl?: boolean;
};

// Full tabs instance shape
export type TabsInstance = {
  id: string;
  container: HTMLElement;
  config: TabsConfig;
  state: TabsState;
  boundHandlers: BoundHandlers;
  autoplay: AutoplayState | null;
  _transitionTimer: ReturnType<typeof setTimeout> | null;
  tablist: HTMLElement;
  triggers: HTMLElement[];
  panels: HTMLElement[];
  triggerMap: Map<string, HTMLElement[]>;
  panelMap: Map<string, HTMLElement>;
  playPauseBtn: HTMLElement | null;
  goTo: (value: string) => TabsInstance;
  next: () => TabsInstance;
  prev: () => TabsInstance;
  play: () => TabsInstance;
  stop: () => TabsInstance;
  refresh: () => TabsInstance;
  destroy: () => void;
  getActiveValue: () => string | null;
};

// HTMLElement with optional tabs instance
export type TabsHTMLElement = HTMLElement & { _tabs?: Tabs };

// Element with _tabValue property (set during findElements)
export type TabElement = HTMLElement & { _tabValue?: string };
