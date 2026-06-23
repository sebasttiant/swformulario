"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  "aria-label"?: string;
  id?: string;
  disabled?: boolean;
}

/** Strip accents and lowercase so "bogota" matches "Bogotá". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Accessible, dependency-free searchable select for long catalogs (cities,
 * nationalities). Filters by accent-insensitive label match, closes on outside
 * click or Escape, and never overflows its container horizontally.
 */
export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados",
  id,
  disabled,
  ...props
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = React.useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options;
    return options.filter((o) => normalize(o.label).includes(q));
  }, [options, query]);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  // Focus the search box when the panel opens.
  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function choose(optionValue: string) {
    onValueChange(optionValue);
    close();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        aria-label={props["aria-label"]}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? close() : setOpen(true))}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-sm transition-colors focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          selected ? "text-ink" : "text-muted",
        )}
      >
        <span className="line-clamp-1 text-left">
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
                if (e.key === "Enter" && filtered.length > 0) {
                  e.preventDefault();
                  choose(filtered[0].value);
                }
              }}
              placeholder={searchPlaceholder}
              className="h-10 w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">{emptyMessage}</li>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => choose(opt.value)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-brand-soft",
                        isSelected && "bg-brand-soft",
                      )}
                    >
                      <span className="line-clamp-1">{opt.label}</span>
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-brand" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
