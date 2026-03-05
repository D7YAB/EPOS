"use client"

import { useState } from "react"
import {
  Plus,
  Trash2,
  X,
  Pencil,
  ChevronRight,
  Tag,
  DollarSign,
  Layers,
  Package,
} from "lucide-react"
import type { MenuStore } from "@/hooks/use-menu-store"
import type { MenuItem, Category, ProductVariation, ProductAddOn } from "@/lib/menu-data"
import { cn } from "@/lib/utils"

type MenuEditorProps = {
  menuStore: MenuStore
}

// predefined category colours
const categoryColors = [
  "bg-[oklch(0.55_0.22_27)]",
  "bg-[oklch(0.7_0.18_55)]",
  "bg-[oklch(0.65_0.2_145)]",
  "bg-[oklch(0.6_0.15_250)]",
  "bg-[oklch(0.7_0.15_330)]",
  "bg-[oklch(0.6_0.2_20)]",
  "bg-[oklch(0.65_0.18_80)]",
  "bg-[oklch(0.55_0.15_200)]",
]

export function MenuEditor({ menuStore }: MenuEditorProps) {
  const {
    categories,
    menuItems,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    addVariation,
    removeVariation,
    addAddOn,
    removeAddOn,
  } = menuStore

  const [selectedCatId, setSelectedCatId] = useState<string>(
    categories[0]?.id ?? ""
  )
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // New category form
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatColor, setNewCatColor] = useState(categoryColors[0])

  // New item form
  const [showNewItem, setShowNewItem] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")

  // New variation form
  const [newVarName, setNewVarName] = useState("")
  const [newVarPrice, setNewVarPrice] = useState("")

  // New add-on form
  const [newAddOnName, setNewAddOnName] = useState("")
  const [newAddOnPrice, setNewAddOnPrice] = useState("")

  // Edit item name/price
  const [editingItemField, setEditingItemField] = useState<
    "name" | "price" | null
  >(null)
  const [editValue, setEditValue] = useState("")

  const filteredItems = menuItems.filter((m) => m.category === selectedCatId)
  const selectedItem = selectedItemId
    ? menuItems.find((m) => m.id === selectedItemId)
    : null

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    const id = `cat-${Date.now()}`
    addCategory({ id, name: newCatName.trim(), color: newCatColor })
    setNewCatName("")
    setShowNewCat(false)
    setSelectedCatId(id)
  }

  const handleAddItem = () => {
    if (!newItemName.trim()) return
    const price = parseFloat(newItemPrice) || 0
    const id = `item-${Date.now()}`
    addItem({
      id,
      name: newItemName.trim(),
      price,
      category: selectedCatId,
    })
    setNewItemName("")
    setNewItemPrice("")
    setShowNewItem(false)
    setSelectedItemId(id)
  }

  const handleAddVariation = () => {
    if (!selectedItemId || !newVarName.trim()) return
    const priceModifier = parseFloat(newVarPrice) || 0
    addVariation(selectedItemId, {
      id: `var-${Date.now()}`,
      name: newVarName.trim(),
      priceModifier,
    })
    setNewVarName("")
    setNewVarPrice("")
  }

  const handleAddAddOn = () => {
    if (!selectedItemId || !newAddOnName.trim()) return
    const price = parseFloat(newAddOnPrice) || 0
    addAddOn(selectedItemId, {
      id: `addon-${Date.now()}`,
      name: newAddOnName.trim(),
      price,
    })
    setNewAddOnName("")
    setNewAddOnPrice("")
  }

  const commitEditField = () => {
    if (!selectedItemId || !editingItemField) return
    if (editingItemField === "name" && editValue.trim()) {
      updateItem(selectedItemId, { name: editValue.trim() })
    } else if (editingItemField === "price") {
      const p = parseFloat(editValue)
      if (!isNaN(p)) updateItem(selectedItemId, { price: p })
    }
    setEditingItemField(null)
    setEditValue("")
  }

  return (
    <div className="flex h-full min-h-0 gap-4 p-4 lg:p-6">
      {/* Column 1 - Categories */}
      <div className="flex w-48 shrink-0 flex-col rounded-xl border border-border bg-card overflow-hidden">
        <div className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
            Categories
          </h2>
          <button
            onClick={() => setShowNewCat(!showNewCat)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
          >
            {showNewCat ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        {showNewCat && (
          <div className="shrink-0 border-b border-border p-3 flex flex-col gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="Category name"
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {categoryColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewCatColor(color)}
                  className={cn(
                    "h-5 w-5 rounded-full transition-all",
                    color,
                    newCatColor === color
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
                      : "opacity-60 hover:opacity-100"
                  )}
                />
              ))}
            </div>
            <button
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
            >
              Add Category
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <div className="flex flex-col gap-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-all cursor-pointer",
                  selectedCatId === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                onClick={() => {
                  setSelectedCatId(cat.id)
                  setSelectedItemId(null)
                }}
              >
                <div className={cn("h-2 w-2 shrink-0 rounded-full", cat.color)} />
                <span className="flex-1 text-sm font-semibold truncate">
                  {cat.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCategory(cat.id)
                    if (selectedCatId === cat.id) {
                      setSelectedCatId(categories[0]?.id ?? "")
                      setSelectedItemId(null)
                    }
                  }}
                  className={cn(
                    "hidden h-5 w-5 items-center justify-center rounded group-hover:flex",
                    selectedCatId === cat.id
                      ? "text-primary-foreground/70 hover:text-primary-foreground"
                      : "text-muted-foreground hover:text-destructive"
                  )}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Column 2 - Items List */}
      <div className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card overflow-hidden">
        <div className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
            Items
          </h2>
          <button
            onClick={() => setShowNewItem(!showNewItem)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
          >
            {showNewItem ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        {showNewItem && (
          <div className="shrink-0 border-b border-border p-3 flex flex-col gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name"
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              autoFocus
            />
            <input
              type="number"
              step="0.01"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              placeholder="Price (0 for variant pricing)"
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemName.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
            >
              Add Item
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">No items in this category</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredItems.map((item) => {
                const isSelected = selectedItemId === item.id
                const varCount = item.variations?.length ?? 0
                const addOnCount = item.addOns?.length ?? 0
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                      isSelected
                        ? "bg-primary/15 border border-primary/40"
                        : "border border-transparent hover:bg-secondary/70"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-card-foreground truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-primary">
                          {item.price === 0 && item.variations && item.variations.length > 0 ? (
                            <>from {"£"}{Math.min(...item.variations.map((v) => v.priceModifier)).toFixed(2)}</>
                          ) : (
                            <>{"£"}{item.price.toFixed(2)}</>
                          )}
                        </span>
                        {varCount > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {varCount} var
                          </span>
                        )}
                        {addOnCount > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {addOnCount} add-on
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Column 3 - Item Detail Editor */}
      <div className="flex flex-1 min-w-0 flex-col rounded-xl border border-border bg-card overflow-hidden">
        {!selectedItem ? (
          <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <Pencil className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">Select an item to edit</p>
            <p className="text-xs mt-1">
              Choose from the items list or add a new one
            </p>
          </div>
        ) : (
          <>
            <div className="shrink-0 flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
                Edit Item
              </h2>
              <button
                onClick={() => {
                  deleteItem(selectedItem.id)
                  setSelectedItemId(null)
                }}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-6">
                {/* Name & Price */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Name & Price
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {editingItemField === "name" ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEditField}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEditField()
                          if (e.key === "Escape") {
                            setEditingItemField(null)
                            setEditValue("")
                          }
                        }}
                        className="rounded-lg border border-primary bg-input px-4 py-3 text-sm font-semibold text-foreground focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingItemField("name")
                          setEditValue(selectedItem.name)
                        }}
                        className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-left text-sm font-semibold text-card-foreground hover:border-primary/50 transition-colors"
                      >
                        {selectedItem.name}
                        <Pencil className="h-3 w-3 text-muted-foreground ml-auto" />
                      </button>
                    )}
                    {editingItemField === "price" ? (
                      <div className="flex items-center rounded-lg border border-primary bg-input px-4 py-3">
                        <span className="text-sm font-bold text-muted-foreground mr-1">{"£"}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEditField}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEditField()
                            if (e.key === "Escape") {
                              setEditingItemField(null)
                              setEditValue("")
                            }
                          }}
                          className="flex-1 bg-transparent text-sm font-bold text-foreground focus:outline-none"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingItemField("price")
                          setEditValue(selectedItem.price.toString())
                        }}
                        className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-left text-sm font-bold text-primary hover:border-primary/50 transition-colors"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        {"£"}{selectedItem.price.toFixed(2)}
                        <Pencil className="h-3 w-3 text-muted-foreground ml-auto" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Variations */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Variations
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({selectedItem.variations?.length ?? 0})
                    </span>
                  </div>

                  {selectedItem.variations &&
                    selectedItem.variations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.variations.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2"
                          >
                            <span className="text-sm font-medium text-card-foreground">
                              {v.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {selectedItem.price === 0 ? (
                                <>{"£"}{v.priceModifier.toFixed(2)}</>
                              ) : (
                                <>{v.priceModifier >= 0 ? "+" : ""}{"£"}{v.priceModifier.toFixed(2)}</>
                              )}
                            </span>
                            <button
                              onClick={() =>
                                removeVariation(selectedItem.id, v.id)
                              }
                              className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newVarName}
                      onChange={(e) => setNewVarName(e.target.value)}
                      placeholder="Variation name"
                      className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                    <div className="flex items-center rounded-md border border-border bg-input px-2 py-2">
                      <span className="text-xs text-muted-foreground mr-1">{selectedItem.price === 0 ? "£" : "+£"}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={newVarPrice}
                        onChange={(e) => setNewVarPrice(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddVariation()
                        }
                        placeholder={selectedItem.price === 0 ? "e.g. 5.99" : "0.00"}
                        className="w-16 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleAddVariation}
                      disabled={!newVarName.trim()}
                      className="shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Add-ons */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Add-ons
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({selectedItem.addOns?.length ?? 0})
                    </span>
                  </div>

                  {selectedItem.addOns &&
                    selectedItem.addOns.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.addOns.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2"
                          >
                            <span className="text-sm font-medium text-card-foreground">
                              {a.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {"£"}{a.price.toFixed(2)}
                            </span>
                            <button
                              onClick={() =>
                                removeAddOn(selectedItem.id, a.id)
                              }
                              className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newAddOnName}
                      onChange={(e) => setNewAddOnName(e.target.value)}
                      placeholder="Add-on name"
                      className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                    <div className="flex items-center rounded-md border border-border bg-input px-2 py-2">
                      <span className="text-xs text-muted-foreground mr-1">{"£"}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={newAddOnPrice}
                        onChange={(e) => setNewAddOnPrice(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddAddOn()
                        }
                        placeholder="0.00"
                        className="w-16 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleAddAddOn}
                      disabled={!newAddOnName.trim()}
                      className="shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
