"use client"

import { useState, useCallback } from "react"
import type { MenuItem, ProductVariation, ProductAddOn, OrderItemAddOn, CustomAddOn } from "@/lib/menu-data"
import { cn } from "@/lib/utils"
import { X, Plus, Minus, MessageSquare } from "lucide-react"

type MenuGridProps = {
  items: MenuItem[]
  activeCategory: string
  onAddItemFull: (
    item: MenuItem,
    variation?: ProductVariation,
    addOns?: OrderItemAddOn[],
    customAddOns?: CustomAddOn[],
    comment?: string,
    quantity?: number
  ) => void
}

export function MenuGrid({ items, activeCategory, onAddItemFull }: MenuGridProps) {
  const filtered = items.filter((item) => item.category === activeCategory)
  const [optionsItem, setOptionsItem] = useState<MenuItem | null>(null)

  const hasOptions = (item: MenuItem) =>
    item.price === 0 ||
    (item.variations && item.variations.length > 0) ||
    (item.addOns && item.addOns.length > 0)

  const handleTap = (item: MenuItem) => {
    if (hasOptions(item)) {
      setOptionsItem(item)
    } else {
      onAddItemFull(item)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item) => {
          const hasOpts = hasOptions(item)
          const isVariantPriced = item.price === 0 && item.variations && item.variations.length > 0
          const lowestVariantPrice = isVariantPriced
            ? Math.min(...item.variations!.map((v) => v.priceModifier))
            : 0
          return (
            <button
              key={item.id}
              onClick={() => handleTap(item)}
              className="flex flex-col items-start justify-between rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-card/80 active:scale-[0.97]"
            >
              <span className="text-sm font-semibold text-card-foreground leading-tight">
                {item.name}
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                {isVariantPriced ? (
                  <>
                    <span className="text-xs font-medium text-muted-foreground">from</span>
                    <span className="text-lg font-bold text-primary">
                      {"£"}{lowestVariantPrice.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-primary">
                    {"£"}{item.price.toFixed(2)}
                  </span>
                )}
                {hasOpts && !isVariantPriced && (
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    +options
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Product Options Popup */}
      {optionsItem && (
        <ProductOptionsPopup
          item={optionsItem}
          onConfirm={(variation, addOns, customAddOns, comment, qty) => {
            onAddItemFull(optionsItem, variation, addOns, customAddOns, comment, qty)
            setOptionsItem(null)
          }}
          onClose={() => setOptionsItem(null)}
        />
      )}
    </>
  )
}

// ── Product Options Popup ────────────────────────────────────────────

type ProductOptionsPopupProps = {
  item: MenuItem
  onConfirm: (
    variation?: ProductVariation,
    addOns?: OrderItemAddOn[],
    customAddOns?: CustomAddOn[],
    comment?: string,
    quantity?: number
  ) => void
  onClose: () => void
}

function ProductOptionsPopup({ item, onConfirm, onClose }: ProductOptionsPopupProps) {
  const hasVariations = item.variations && item.variations.length > 0
  const hasAddOns = item.addOns && item.addOns.length > 0

  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(
    hasVariations ? item.variations![0] : undefined
  )
  const [selectedAddOns, setSelectedAddOns] = useState<OrderItemAddOn[]>([])
  const [customAddOns, setCustomAddOns] = useState<CustomAddOn[]>([])
  const [customAddOnInput, setCustomAddOnInput] = useState("")
  const [customAddOnPriceInput, setCustomAddOnPriceInput] = useState("")
  const [comment, setComment] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [showComment, setShowComment] = useState(false)

  const toggleAddOn = useCallback((addOn: ProductAddOn) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((a) => a.addOn.id === addOn.id)
      if (exists) return prev.filter((a) => a.addOn.id !== addOn.id)
      return [...prev, { addOn, quantity: 1 }]
    })
  }, [])

  const addCustomAddOn = useCallback(() => {
    if (!customAddOnInput.trim()) return
    setCustomAddOns((prev) => [...prev, { name: customAddOnInput.trim(), price: parseFloat(customAddOnPriceInput) || 0 }])
    setCustomAddOnInput("")
    setCustomAddOnPriceInput("")
  }, [customAddOnInput, customAddOnPriceInput])

  const removeCustomAddOn = useCallback((index: number) => {
    setCustomAddOns((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const basePrice = item.price + (selectedVariation?.priceModifier ?? 0)
  const addOnsPrice = selectedAddOns.reduce((sum, a) => sum + a.addOn.price * a.quantity, 0)
  const customAddOnsPrice = customAddOns.reduce((sum, c) => sum + c.price, 0)
  const lineTotal = (basePrice + addOnsPrice + customAddOnsPrice) * quantity

  const handleConfirm = () => {
    onConfirm(
      selectedVariation,
      selectedAddOns.length > 0 ? selectedAddOns : undefined,
      customAddOns.length > 0 ? customAddOns : undefined,
      comment.trim() || undefined,
      quantity
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-card-foreground">{item.name}</h3>
            <p className="text-sm text-muted-foreground">
              {item.price === 0 && hasVariations ? (
                <>from {"£"}{Math.min(...item.variations!.map((v) => v.priceModifier)).toFixed(2)}</>
              ) : (
                <>{"£"}{item.price.toFixed(2)}</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-5">
            {/* Variations */}
            {hasVariations && (
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Size / Type
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.variations!.map((v) => {
                    const isSelected = selectedVariation?.id === v.id
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariation(v)}
                        className={cn(
                          "rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary/50 text-card-foreground hover:border-muted-foreground/30"
                        )}
                      >
                        <span>{v.name}</span>
                        {item.price === 0 ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            {"£"}{v.priceModifier.toFixed(2)}
                          </span>
                        ) : v.priceModifier !== 0 ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            {v.priceModifier > 0 ? "+" : ""}{"£"}{v.priceModifier.toFixed(2)}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {hasAddOns && (
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Add-ons
                </h4>
                <div className="flex flex-col gap-1.5">
                  {item.addOns!.map((addOn) => {
                    const isActive = selectedAddOns.some((a) => a.addOn.id === addOn.id)
                    return (
                      <button
                        key={addOn.id}
                        onClick={() => toggleAddOn(addOn)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all",
                          isActive
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary/30 hover:border-muted-foreground/30"
                        )}
                      >
                        <span className={cn("text-sm font-medium", isActive ? "text-primary" : "text-card-foreground")}>
                          {addOn.name}
                        </span>
                        <span className={cn("text-sm font-bold", isActive ? "text-primary" : "text-muted-foreground")}>
                          +{"£"}{addOn.price.toFixed(2)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Custom Add-on */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Custom Add-on
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAddOnInput}
                  onChange={(e) => setCustomAddOnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addCustomAddOn() }
                  }}
                  placeholder="e.g. Extra pickles"
                  className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="relative shrink-0 w-24">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"£"}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customAddOnPriceInput}
                    onChange={(e) => setCustomAddOnPriceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addCustomAddOn() }
                    }}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-input pl-7 pr-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={addCustomAddOn}
                  disabled={!customAddOnInput.trim()}
                  className="shrink-0 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-card-foreground hover:bg-secondary/80 disabled:opacity-40 transition-colors"
                >
                  Add
                </button>
              </div>
              {customAddOns.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {customAddOns.map((ca, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-primary">
                        {ca.name}
                        {ca.price > 0 && (
                          <span className="ml-1.5 text-xs">+{"£"}{ca.price.toFixed(2)}</span>
                        )}
                      </span>
                      <button onClick={() => removeCustomAddOn(i)} className="text-primary hover:text-destructive transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment */}
            <div>
              {!showComment ? (
                <button
                  onClick={() => setShowComment(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-card-foreground transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Add item note
                </button>
              ) : (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Item Note
                  </h4>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. No onions, well done patty"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border bg-card px-6 py-4">
          {/* Quantity */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-card-foreground hover:bg-secondary/80 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-lg font-bold text-card-foreground">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-card-foreground hover:bg-secondary/80 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Add to Order &middot; {"£"}{lineTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}
