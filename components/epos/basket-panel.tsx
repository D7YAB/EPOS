"use client"

import { useState } from "react"
import { Minus, Plus, Trash2, ShoppingCart, MessageSquare, ChevronDown, ChevronUp, X } from "lucide-react"
import type { BasketItem } from "@/hooks/use-epos-store"
import type { ProductAddOn, CustomAddOn } from "@/lib/menu-data"
import { cn } from "@/lib/utils"

type BasketPanelProps = {
  basket: BasketItem[]
  basketTotal: number
  basketCount: number
  onRemoveItem: (basketLineId: string) => void
  onIncrementItem: (basketLineId: string) => void
  onClear: () => void
  onPlaceOrder: () => void
  onToggleAddOn: (basketLineId: string, addOn: ProductAddOn) => void
  onAddCustomAddOn: (basketLineId: string, name: string, price: number) => void
  onRemoveCustomAddOn: (basketLineId: string, index: number) => void
  onUpdateComment: (basketLineId: string, comment: string) => void
}

function calcLineTotal(entry: BasketItem): number {
  const base = entry.item.price + (entry.selectedVariation?.priceModifier ?? 0)
  const addOnsTotal = entry.addOns.reduce(
    (sum, a) => sum + a.addOn.price * a.quantity,
    0
  )
  const customAddOnsTotal = entry.customAddOns.reduce(
    (sum, c) => sum + c.price,
    0
  )
  return (base + addOnsTotal + customAddOnsTotal) * entry.quantity
}

export function BasketPanel({
  basket,
  basketTotal,
  basketCount,
  onRemoveItem,
  onIncrementItem,
  onClear,
  onPlaceOrder,
  onToggleAddOn,
  onAddCustomAddOn,
  onRemoveCustomAddOn,
  onUpdateComment,
}: BasketPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [customAddOnText, setCustomAddOnText] = useState("")
  const [customAddOnPrice, setCustomAddOnPrice] = useState("")

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
            Current Order
          </h2>
          {basketCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
              {basketCount}
            </span>
          )}
        </div>
        {basket.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Items */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {basket.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">No items yet</p>
            <p className="text-xs mt-1">Tap menu items to add</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {basket.map((entry) => {
              const isExpanded = expandedId === entry.id
              const unitPrice =
                entry.item.price +
                (entry.selectedVariation?.priceModifier ?? 0)
              const lineTotal = calcLineTotal(entry)
              const hasExtras =
                entry.addOns.length > 0 ||
                entry.customAddOns.length > 0 ||
                entry.comment

              return (
                <div
                  key={entry.id}
                  className="rounded-lg bg-secondary/50 overflow-hidden"
                >
                  {/* Item name row - clickable to expand */}
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : entry.id)
                    }
                    className="flex w-full items-center justify-between px-3 pt-2.5 pb-1 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-card-foreground leading-snug">
                        {entry.item.name}
                      </p>
                      {entry.selectedVariation && (
                        <span className="inline-block mt-0.5 rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                          {entry.selectedVariation.name}
                          {entry.selectedVariation.priceModifier !== 0 && (
                            <> +{"£"}{entry.selectedVariation.priceModifier.toFixed(2)}</>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 ml-2">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Add-ons list - full width of card */}
                  {entry.addOns.length > 0 && (
                    <div className="flex flex-col gap-0.5 px-3">
                      {entry.addOns.map((a) => (
                        <div
                          key={a.addOn.id}
                          className="flex w-full items-center justify-between rounded bg-secondary px-2 py-1"
                        >
                          <span className="text-[11px] font-medium text-muted-foreground">
                            + {a.addOn.name}{" "}
                            <span className="text-[10px]">{"£"}{a.addOn.price.toFixed(2)}</span>
                          </span>
                          <button
                            onClick={() => onToggleAddOn(entry.id, a.addOn)}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custom add-ons list - full width of card */}
                  {entry.customAddOns.length > 0 && (
                    <div className="flex flex-col gap-0.5 px-3">
                      {entry.customAddOns.map((ca, i) => (
                        <div
                          key={i}
                          className="flex w-full items-center justify-between rounded bg-primary/10 px-2 py-1"
                        >
                          <span className="text-[11px] font-medium text-primary">
                            + {ca.name}
                            {ca.price > 0 && (
                              <span className="text-[10px] ml-1">{"£"}{ca.price.toFixed(2)}</span>
                            )}
                          </span>
                          <button
                            onClick={() => onRemoveCustomAddOn(entry.id, i)}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground text-primary transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Item comment - full width */}
                  {entry.comment && (
                    <p className="mx-3 mt-0.5 flex items-center gap-1 text-[10px] italic text-muted-foreground">
                      <MessageSquare className="h-2.5 w-2.5 shrink-0" />
                      {entry.comment}
                    </p>
                  )}

                  {/* Controls row */}
                  <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                    <p className="text-xs text-muted-foreground">
                      {"£"}{unitPrice.toFixed(2)} each
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRemoveItem(entry.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-card-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-card-foreground">
                        {entry.quantity}
                      </span>
                      <button
                        onClick={() => onIncrementItem(entry.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-card-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <span className="ml-1 text-sm font-bold text-primary">
                        {"£"}{lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="border-t border-border/50 px-3 py-2.5 flex flex-col gap-2.5">
                      {/* Predefined add-ons */}
                      {entry.item.addOns && entry.item.addOns.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Add-ons
                          </p>
                          <div className="flex flex-col gap-1">
                            {entry.item.addOns.map((addOn) => {
                              const isActive = entry.addOns.some(
                                (a) => a.addOn.id === addOn.id
                              )
                              return (
                                <button
                                  key={addOn.id}
                                  onClick={() =>
                                    onToggleAddOn(entry.id, addOn)
                                  }
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-all",
                                    isActive
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-secondary text-muted-foreground hover:text-card-foreground"
                                  )}
                                >
                                  <span className="text-[11px] font-medium">
                                    {addOn.name}
                                  </span>
                                  <span className="text-[11px] font-bold">
                                    +{"£"}{addOn.price.toFixed(2)}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Custom add-ons */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Custom Add-on
                        </p>
                        {entry.customAddOns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {entry.customAddOns.map((ca, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] text-primary font-medium"
                              >
                                {ca.name}
                                {ca.price > 0 && (
                                  <span className="text-[10px]">{"£"}{ca.price.toFixed(2)}</span>
                                )}
                                <button
                                  onClick={() =>
                                    onRemoveCustomAddOn(entry.id, i)
                                  }
                                  className="hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={
                              expandedId === entry.id ? customAddOnText : ""
                            }
                            onChange={(e) =>
                              setCustomAddOnText(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customAddOnText.trim()) {
                                onAddCustomAddOn(entry.id, customAddOnText, parseFloat(customAddOnPrice) || 0)
                                setCustomAddOnText("")
                                setCustomAddOnPrice("")
                              }
                            }}
                            placeholder="e.g. No onions"
                            className="flex-1 min-w-0 rounded-md border border-border bg-input px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                          />
                          <div className="relative shrink-0 w-20">
                            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{"£"}</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                expandedId === entry.id ? customAddOnPrice : ""
                              }
                              onChange={(e) =>
                                setCustomAddOnPrice(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && customAddOnText.trim()) {
                                  onAddCustomAddOn(entry.id, customAddOnText, parseFloat(customAddOnPrice) || 0)
                                  setCustomAddOnText("")
                                  setCustomAddOnPrice("")
                                }
                              }}
                              placeholder="0.00"
                              className="w-full rounded-md border border-border bg-input pl-5 pr-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (customAddOnText.trim()) {
                                onAddCustomAddOn(entry.id, customAddOnText, parseFloat(customAddOnPrice) || 0)
                                setCustomAddOnText("")
                                setCustomAddOnPrice("")
                              }
                            }}
                            className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-110"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Item comment */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                          <MessageSquare className="inline h-3 w-3 mr-0.5" />
                          Note
                        </p>
                        <input
                          type="text"
                          value={entry.comment || ""}
                          onChange={(e) =>
                            onUpdateComment(entry.id, e.target.value)
                          }
                          placeholder="Item note..."
                          className="w-full rounded-md border border-border bg-input px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer - sticky to bottom */}
      <div className="mt-auto shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Total
          </span>
          <span className="text-2xl font-bold text-card-foreground">
            {"£"}{basketTotal.toFixed(2)}
          </span>
        </div>
        <button
          onClick={onPlaceOrder}
          disabled={basket.length === 0}
          className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Place Order
        </button>
      </div>
    </div>
  )
}
