"use client";

import { SORT_OPTIONS, type SortBy } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface TodoSortProps {
  value: SortBy;
  onChange: (value: SortBy) => void;
}

export function TodoSort({ value, onChange }: TodoSortProps) {
  return (
    <div role="radiogroup" aria-label="정렬" className="flex gap-1">
      {SORT_OPTIONS.map((item) => {
        const selected = item.value === value;
        return (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            className={
              selected
                ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-500/80"
                : undefined
            }
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
