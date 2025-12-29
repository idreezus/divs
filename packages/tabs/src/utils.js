// Shared utility functions for the tabs library

// Emits events via instance callbacks and DOM CustomEvent
export function emit(instance, eventName, data = {}) {
  const { events, container } = instance;

  // Instance event callbacks
  if (events.has(eventName)) {
    events.get(eventName).forEach((callback) => {
      callback.call(instance, { type: eventName, target: instance, ...data });
    });
  }

  // DOM CustomEvent for addEventListener compatibility
  const customEvent = new CustomEvent(`tabs:${eventName}`, {
    detail: { tabs: instance, ...data },
    bubbles: true,
  });
  container.dispatchEvent(customEvent);
}
