"use client"

import { cn } from "@/lib/utils"
import type { Category } from "@/lib/menu-data"

type CategoryTabsProps = {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="flex h-full flex-col gap-1.5 overflow-y-auto rounded-xl border border-border bg-card p-2">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wide transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                cat.color
              )}
            />
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
