import {useEffect, useRef, type MutableRefObject, type RefObject} from 'react';

/** Actions that can be triggered by the user in the FPS simulator. */
export type InputAction =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'confirm'
  | 'cancel'
  | 'tap'
  | 'interact'
  | 'sprint'
  | 'jump'
  | 'tab';

/** Represents the state of the pointer (mouse/touch). */
export interface PointerState {
  /** Pointer position in NDC (-1..1) for raycasting. */
  nx: number;
  ny: number;
  /** Pointer position in client pixels (relative to container). */
  clientX: number;
  clientY: number;
  down: boolean;
  movementX: number;
  movementY: number;
}

/** Snapshot of the input state at a given frame. */
export interface InputSnapshot {
  actions: Record<InputAction, boolean>;
  pointer: PointerState;
}

const ACTION_KEYS: Record<string, InputAction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  Enter: 'confirm',
  ' ': 'jump',
  Space: 'jump',
  e: 'interact',
  E: 'interact',
  Shift: 'sprint',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  Tab: 'tab',
  Escape: 'cancel',
};

function createEmptyActions(): Record<InputAction, boolean> {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    confirm: false,
    cancel: false,
    tap: false,
    interact: false,
    sprint: false,
    jump: false,
    tab: false,
  };
}

function getPointerNDC(
  event: PointerEvent,
  container: HTMLElement,
): {nx: number; ny: number; clientX: number; clientY: number} {
  const rect = container.getBoundingClientRect();
  const clientX = event.clientX - rect.left;
  const clientY = event.clientY - rect.top;
  const nx = (clientX / Math.max(1, rect.width)) * 2 - 1;
  const ny = -(clientY / Math.max(1, rect.height)) * 2 + 1;
  return {nx, ny, clientX, clientY};
}

/**
 * Unified input hook for 3D FPS game.
 */
export function useInput(
  containerRef: RefObject<HTMLDivElement>,
  options: {enabled?: boolean} = {},
): MutableRefObject<InputSnapshot> {
  const {enabled = true} = options;
  const inputRef = useRef<InputSnapshot>({
    actions: createEmptyActions(),
    pointer: {nx: 0, ny: 0, clientX: 0, clientY: 0, down: false, movementX: 0, movementY: 0},
  });

  useEffect(() => {
    if (!enabled) {
      inputRef.current.actions = createEmptyActions();
      inputRef.current.pointer = {
        nx: 0,
        ny: 0,
        clientX: 0,
        clientY: 0,
        down: false,
        movementX: 0,
        movementY: 0,
      };
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.code === 'Tab') {
        event.preventDefault();
      }
      const action = ACTION_KEYS[event.key] ?? ACTION_KEYS[event.code];
      if (!action) return;
      inputRef.current.actions[action] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const action = ACTION_KEYS[event.key] ?? ACTION_KEYS[event.code];
      if (!action) return;
      inputRef.current.actions[action] = false;
    };

    const container = containerRef.current;
    const handlePointerDown = (event: PointerEvent) => {
      if (!container) return;
      const pos = getPointerNDC(event, container);
      inputRef.current.pointer = {
        ...pos,
        down: true,
        movementX: event.movementX || 0,
        movementY: event.movementY || 0,
      };
      inputRef.current.actions.tap = true;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!container) return;
      const pos = getPointerNDC(event, container);
      inputRef.current.pointer = {
        ...pos,
        down: inputRef.current.pointer.down,
        movementX: event.movementX || 0,
        movementY: event.movementY || 0,
      };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!container) return;
      const pos = getPointerNDC(event, container);
      inputRef.current.pointer = {
        ...pos,
        down: false,
        movementX: 0,
        movementY: 0,
      };
      inputRef.current.actions.tap = false;
    };

    const handleBlur = () => {
      inputRef.current.actions = createEmptyActions();
      inputRef.current.pointer.down = false;
      inputRef.current.actions.tap = false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBlur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (container) {
      container.addEventListener('pointerdown', handlePointerDown);
      container.addEventListener('pointermove', handlePointerMove);
      container.addEventListener('pointerup', handlePointerUp);
      container.addEventListener('pointercancel', handlePointerUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (container) {
        container.removeEventListener('pointerdown', handlePointerDown);
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('pointerup', handlePointerUp);
        container.removeEventListener('pointercancel', handlePointerUp);
      }
    };
  }, [containerRef, enabled]);

  return inputRef;
}
