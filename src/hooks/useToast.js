import { useCallback, useRef, useState } from "react";

/**
 * NKAMA — Hook de notification éphémère (toast).
 * @param {number} [duration] durée d'affichage en ms
 */
export function useToast(duration = 2600) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback(
    (message) => {
      setToast(message);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  return { toast, showToast };
}
