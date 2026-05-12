"use client";

import { useEffect, useState } from "react";

/**
 * Hook para mostrar feedback temporal después de copiar al portapapeles.
 * Resetea el flag a false después de `duration` ms, con cleanup correcto.
 */
export function useCopyFeedback(duration = 2000) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), duration);
    return () => clearTimeout(t);
  }, [copied, duration]);

  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      return true;
    } catch {
      return false;
    }
  }

  return { copied, copy };
}

/**
 * Resetea automáticamente un estado booleano a false después de `duration` ms.
 * Útil para feedback temporal ("Guardado", confirmaciones double-click).
 */
export function useAutoReset(
  value: boolean,
  setValue: (v: boolean) => void,
  duration: number,
) {
  useEffect(() => {
    if (!value) return;
    const t = setTimeout(() => setValue(false), duration);
    return () => clearTimeout(t);
  }, [value, setValue, duration]);
}
