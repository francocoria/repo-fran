"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renderiza children en document.body via React Portal.
 *
 * Por qué existe: si un modal con `position:fixed` se renderiza dentro
 * del tree normal, y algún ancestro tiene `transform` (o filter, etc),
 * CSS crea un nuevo "containing block" para fixed → el modal queda
 * scope-ado a ese ancestro en lugar del viewport. Resultado: backdrop
 * incompleto, scroll bloqueado, modal cortado.
 *
 * Solución: portal al body — escape garantizado de cualquier transform
 * de ancestros. Es el patrón estándar para diálogos modales.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
