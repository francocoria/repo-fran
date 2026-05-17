"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Loader2, X, CornerDownLeft } from "lucide-react";
import { PetAvatar } from "@pet-app/ui";
import { ModalPortal } from "@/components/modal-portal";

type Result = {
  animalId: string;
  name: string;
  species: string;
  breed: string | null;
  photoUrl: string | null;
  ownerName: string;
  archived: boolean;
};

/**
 * Buscador global del panel vet — estilo command palette.
 * Se abre con el botón, con Ctrl/Cmd+K o con la tecla "/".
 */
export function VetSearch() {
  const t = useTranslations("vetSearch");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajos de teclado para abrir.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const metaK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const slash =
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(
          (e.target as HTMLElement)?.tagName ?? "",
        );
      if (metaK || slash) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus + reset al abrir/cerrar.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    setQuery("");
    setResults([]);
    setActive(0);
  }, [open]);

  // Búsqueda con debounce.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/vet/search?q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((data: { results?: Result[] }) => {
          setResults(data.results ?? []);
          setActive(0);
        })
        .catch(() => {
          /* abortado o error de red — ignoramos */
        })
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);

  const go = useCallback(
    (animalId: string) => {
      setOpen(false);
      router.push(`/vet/patients/${animalId}` as never);
    },
    [router],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]!.animalId);
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
        aria-label={t("triggerAria")}
      >
        <Search className="size-4" />
        <span className="hidden lg:inline">{t("trigger")}</span>
        <kbd className="hidden lg:inline rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
          /
        </kbd>
      </button>

      {open && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-fade-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input */}
              <div className="flex items-center gap-2 border-b border-border px-4">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={t("inputPlaceholder")}
                  className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {loading && (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
                  aria-label={t("close")}
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Resultados */}
              <div className="max-h-[55vh] overflow-y-auto p-2">
                {query.trim().length < 2 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("minChars")}
                  </p>
                ) : !loading && results.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("noResults", { query: query.trim() })}
                  </p>
                ) : (
                  <ul>
                    {results.map((r, i) => (
                      <li key={r.animalId}>
                        <button
                          type="button"
                          onClick={() => go(r.animalId)}
                          onMouseEnter={() => setActive(i)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                            i === active ? "bg-secondary" : ""
                          }`}
                        >
                          <PetAvatar
                            name={r.name}
                            species={r.species}
                            photoUrl={r.photoUrl}
                            size={38}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 text-sm font-medium">
                              <span className="truncate">{r.name}</span>
                              {r.archived && (
                                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  {t("badgeArchived")}
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {r.breed ? `${r.breed} · ` : ""}
                              {r.ownerName}
                            </p>
                          </div>
                          {i === active && (
                            <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 font-mono">
                    ↑↓
                  </kbd>
                  {t("hintNavigate")}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 font-mono">
                    ↵
                  </kbd>
                  {t("hintOpen")}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 font-mono">
                    esc
                  </kbd>
                  {t("hintClose")}
                </span>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
