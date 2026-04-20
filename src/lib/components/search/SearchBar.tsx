import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import { useSearchQuery, useSetSearchQuery } from "@/lib/hooks";
import { useCommandStore } from "@/lib/stores";

export function SearchBar() {
  const query = useSearchQuery();
  const setQuery = useSetSearchQuery();
  const inputRef = useRef<HTMLInputElement>(null);
  const focusNonce = useCommandStore((s) => s.focusSearchNonce);

  useEffect(() => {
    if (focusNonce === 0) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusNonce]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        className="h-8 pl-8 pr-8"
      />
      {query ? (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          onClick={() => setQuery("")}
          aria-label="Clear search"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
