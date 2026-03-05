"use client"

import { useState, useCallback, useEffect } from "react"
import {
  defaultCategories,
  defaultMenuItems,
  type MenuItem,
  type Category,
  type ProductVariation,
  type ProductAddOn,
} from "@/lib/menu-data"

type MenuResponse = {
  categories: Category[]
  menuItems: MenuItem[]
}

async function parseJsonSafe<T>(res: Response): Promise<T | undefined> {
  const text = await res.text()
  if (!text.trim()) return undefined
  try {
    return JSON.parse(text) as T
  } catch {
    return undefined
  }
}

async function readApiError(res: Response, fallback: string) {
  const data = await parseJsonSafe<{ error?: string }>(res)
  return data?.error || fallback
}

async function fetchMenuData(): Promise<MenuResponse> {
  const res = await fetch("/api/menu", { cache: "no-store" })
  if (!res.ok) {
    const message = await readApiError(res, "Failed to fetch menu")
    throw new Error(message)
  }

  const data = await parseJsonSafe<MenuResponse>(res)
  if (!data) {
    throw new Error("Menu API returned an empty response")
  }
  return data
}

export function useMenuStore() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  const refreshMenu = useCallback(async () => {
    try {
      const data = await fetchMenuData()
      setCategories(data.categories)
      setMenuItems(data.menuItems)
    } catch (error) {
      console.error("Menu load failed:", error)
      // Keep terminal usable even if backend isn't ready yet.
      setCategories(defaultCategories)
      setMenuItems(defaultMenuItems)
    }
  }, [])

  useEffect(() => {
    void refreshMenu()
  }, [refreshMenu])

  const runAction = useCallback(async (payload: unknown) => {
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const message = await readApiError(res, "Menu update failed")
        throw new Error(message)
      }

      const data = await parseJsonSafe<MenuResponse>(res)
      if (data) {
        setCategories(data.categories)
        setMenuItems(data.menuItems)
      } else {
        await refreshMenu()
      }
    } catch (error) {
      console.error("Menu action failed:", error)
    }
  }, [refreshMenu])

  const addCategory = useCallback(
    (category: Category) => {
      void runAction({ action: "addCategory", category })
    },
    [runAction]
  )

  const updateCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      void runAction({ action: "updateCategory", id, updates })
    },
    [runAction]
  )

  const deleteCategory = useCallback(
    (id: string) => {
      void runAction({ action: "deleteCategory", id })
    },
    [runAction]
  )

  const addItem = useCallback(
    (item: MenuItem) => {
      void runAction({ action: "addItem", item })
    },
    [runAction]
  )

  const updateItem = useCallback(
    (id: string, updates: Partial<MenuItem>) => {
      void runAction({ action: "updateItem", id, updates })
    },
    [runAction]
  )

  const deleteItem = useCallback(
    (id: string) => {
      void runAction({ action: "deleteItem", id })
    },
    [runAction]
  )

  const addVariation = useCallback(
    (itemId: string, variation: ProductVariation) => {
      void runAction({ action: "addVariation", itemId, variation })
    },
    [runAction]
  )

  const removeVariation = useCallback(
    (itemId: string, variationId: string) => {
      void runAction({ action: "removeVariation", itemId, variationId })
    },
    [runAction]
  )

  const addAddOn = useCallback(
    (itemId: string, addOn: ProductAddOn) => {
      void runAction({ action: "addAddOn", itemId, addOn })
    },
    [runAction]
  )

  const removeAddOn = useCallback(
    (itemId: string, addOnId: string) => {
      void runAction({ action: "removeAddOn", itemId, addOnId })
    },
    [runAction]
  )

  return {
    categories,
    menuItems,
    refreshMenu,
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
  }
}

export type MenuStore = ReturnType<typeof useMenuStore>
