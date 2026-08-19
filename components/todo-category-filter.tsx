"use client";

import { CATEGORY_FILTERS, type CategoryFilter } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface TodoCategoryFilterProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

export function TodoCategoryFilter({
  value,
  onChange,
}: TodoCategoryFilterProps) {
  return (
    <div role="radiogroup" aria-label="카테고리 필터" className="flex gap-1">
      {CATEGORY_FILTERS.map((item) => {
        const selected = item.value === value;
        return (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            className={
              selected
                ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-500/80"
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
