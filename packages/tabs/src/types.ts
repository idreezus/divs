// Shared type definitions for the tabs library

import type { Tabs } from './core';

// Parsed config from parseConfig()
export type TabsConfig = {
  groupName: string | null;
  defaultValue: string | null;
  orientation: string;
  activateOnFocus: boolean;
  loop: boolean;
  keyboard: boolean;
  autoplay: boolean;
  autoplayDuration: number;
  autoplayPauseHover: boolean;
  autoplayPauseFocus: boolean;
};

// Runtime state
export type TabsState = {
  activeValue: string | null;
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
  prev: (() => void) | null;
  next: (() => void) | null;
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
  triggers: HTMLElement[];
  panels: HTMLElement[];
  triggerMap: Map<string, HTMLElement[]>;
  panelMap: Map<string, HTMLElement>;
  prevBtn: HTMLElement | null;
  nextBtn: HTMLElement | null;
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
