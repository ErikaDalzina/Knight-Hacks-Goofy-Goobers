import { useEffect, type RefObject } from 'react';

/**
 * Closes an open menu on a click or tap outside `ref`, or on Escape (`viaKeyboard` is then
 * true, so the menu can hand focus back to its button). A document listener is used rather
 * than a fixed backdrop because backdrop-filter on a panel traps fixed-position children.
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: (viaKeyboard: boolean) => void,
) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(true);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, onClose]);
}
