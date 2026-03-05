"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type {
  MenuItem,
  Order,
  OrderItem,
  OrderItemAddOn,
  OrderStatus,
  OrderType,
  CustomerDetails,
  PaymentStatus,
  PaymentMethod,
  ProductVariation,
  ProductAddOn,
  CustomAddOn,
} from "@/lib/menu-data"

export type BasketItem = {
  id: string
  item: MenuItem
  quantity: number
  selectedVariation?: ProductVariation
  addOns: OrderItemAddOn[]
  customAddOns: CustomAddOn[]
  comment?: string
}

type ApiOrder = Omit<
  Order,
  "createdAt" | "readyAt" | "collectedAt" | "outForDeliveryAt" | "deliveredAt"
> & {
  createdAt: string
  readyAt?: string
  collectedAt?: string
  outForDeliveryAt?: string
  deliveredAt?: string
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

function calcLineTotal(entry: BasketItem): number {
  const base = entry.item.price + (entry.selectedVariation?.priceModifier ?? 0)
  const addOnsTotal = entry.addOns.reduce((sum, a) => sum + a.addOn.price * a.quantity, 0)
  const customAddOnsTotal = entry.customAddOns.reduce((sum, c) => sum + c.price, 0)
  return (base + addOnsTotal + customAddOnsTotal) * entry.quantity
}

function hydrateOrder(order: ApiOrder): Order {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
    readyAt: order.readyAt ? new Date(order.readyAt) : undefined,
    collectedAt: order.collectedAt ? new Date(order.collectedAt) : undefined,
    outForDeliveryAt: order.outForDeliveryAt
      ? new Date(order.outForDeliveryAt)
      : undefined,
    deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
  }
}

function applyStatusTimestamp(order: Order, status: OrderStatus): Order {
  const now = new Date()
  const completing = status === "collected" || status === "delivered"
  const shouldAutoSettleCash = completing && order.paymentStatus === "unpaid"
  return {
    ...order,
    status,
    paymentStatus: shouldAutoSettleCash ? "paid" : order.paymentStatus,
    paymentMethod: shouldAutoSettleCash ? "cash" : order.paymentMethod,
    readyAt: status === "ready" ? now : order.readyAt,
    collectedAt: status === "collected" ? now : order.collectedAt,
    outForDeliveryAt: status === "out_for_delivery" ? now : order.outForDeliveryAt,
    deliveredAt: status === "delivered" ? now : order.deliveredAt,
  }
}

export function useEposStore() {
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" })
      if (!res.ok) {
        const message = await readApiError(res, "Failed to load orders")
        throw new Error(message)
      }

      const data = await parseJsonSafe<{ orders: ApiOrder[] }>(res)
      if (!data) {
        throw new Error("Orders API returned an empty response")
      }
      setOrders(data.orders.map(hydrateOrder))
    } catch (error) {
      console.error("Orders load failed:", error)
    }
  }, [])

  useEffect(() => {
    void refreshOrders()
    const poll = setInterval(() => {
      void refreshOrders()
    }, 15000)

    return () => clearInterval(poll)
  }, [refreshOrders])

  const addToBasket = useCallback((item: MenuItem, variation?: ProductVariation) => {
    setBasket((prev) => {
      const existing = prev.find(
        (b) =>
          b.item.id === item.id &&
          b.selectedVariation?.id === variation?.id &&
          b.addOns.length === 0 &&
          b.customAddOns.length === 0 &&
          !b.comment
      )
      if (existing) {
        return prev.map((b) =>
          b.id === existing.id ? { ...b, quantity: b.quantity + 1 } : b
        )
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          item,
          quantity: 1,
          selectedVariation: variation,
          addOns: [],
          customAddOns: [],
        },
      ]
    })
  }, [])

  const removeFromBasket = useCallback((basketLineId: string) => {
    setBasket((prev) => {
      const existing = prev.find((b) => b.id === basketLineId)
      if (existing && existing.quantity > 1) {
        return prev.map((b) =>
          b.id === basketLineId ? { ...b, quantity: b.quantity - 1 } : b
        )
      }
      return prev.filter((b) => b.id !== basketLineId)
    })
  }, [])

  const incrementBasketItem = useCallback((basketLineId: string) => {
    setBasket((prev) =>
      prev.map((b) =>
        b.id === basketLineId ? { ...b, quantity: b.quantity + 1 } : b
      )
    )
  }, [])

  const updateBasketItemComment = useCallback((basketLineId: string, comment: string) => {
    setBasket((prev) =>
      prev.map((b) =>
        b.id === basketLineId ? { ...b, comment: comment || undefined } : b
      )
    )
  }, [])

  const toggleBasketItemAddOn = useCallback((basketLineId: string, addOn: ProductAddOn) => {
    setBasket((prev) =>
      prev.map((b) => {
        if (b.id !== basketLineId) return b
        const existing = b.addOns.find((a) => a.addOn.id === addOn.id)
        if (existing) {
          return { ...b, addOns: b.addOns.filter((a) => a.addOn.id !== addOn.id) }
        }
        return { ...b, addOns: [...b.addOns, { addOn, quantity: 1 }] }
      })
    )
  }, [])

  const addBasketItemCustomAddOn = useCallback((basketLineId: string, name: string, price: number) => {
    if (!name.trim()) return
    setBasket((prev) =>
      prev.map((b) =>
        b.id === basketLineId
          ? { ...b, customAddOns: [...b.customAddOns, { name: name.trim(), price }] }
          : b
      )
    )
  }, [])

  const removeBasketItemCustomAddOn = useCallback((basketLineId: string, index: number) => {
    setBasket((prev) =>
      prev.map((b) =>
        b.id === basketLineId
          ? { ...b, customAddOns: b.customAddOns.filter((_, i) => i !== index) }
          : b
      )
    )
  }, [])

  const addToBasketFull = useCallback(
    (
      item: MenuItem,
      variation?: ProductVariation,
      addOns?: OrderItemAddOn[],
      customAddOns?: CustomAddOn[],
      comment?: string,
      quantity?: number
    ) => {
      setBasket((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          item,
          quantity: quantity ?? 1,
          selectedVariation: variation,
          addOns: addOns ?? [],
          customAddOns: customAddOns ?? [],
          comment: comment || undefined,
        },
      ])
    },
    []
  )

  const clearBasket = useCallback(() => {
    setBasket([])
  }, [])

  const basketTotal = basket.reduce((sum, b) => sum + calcLineTotal(b), 0)
  const basketCount = basket.reduce((sum, b) => sum + b.quantity, 0)

  const placeOrder = useCallback(
    async (
      orderType: OrderType,
      customer: CustomerDetails,
      paymentStatus: PaymentStatus,
      paymentMethod: PaymentMethod,
      orderComment?: string
    ): Promise<Order | null> => {
      if (basket.length === 0) return null

      const orderItems: OrderItem[] = basket.map((b) => ({
        item: b.item,
        quantity: b.quantity,
        selectedVariation: b.selectedVariation,
        addOns: b.addOns,
        customAddOns: b.customAddOns,
        comment: b.comment,
      }))

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "placeOrder",
            order: {
              items: orderItems,
              total: basketTotal,
              orderType,
              customer,
              paymentStatus,
              paymentMethod,
              orderComment,
            },
          }),
        })

        if (!res.ok) {
          const message = await readApiError(res, "Failed to place order")
          throw new Error(message)
        }

        const data = await parseJsonSafe<{ orders: ApiOrder[] }>(res)
        if (data) {
          const hydrated = data.orders.map(hydrateOrder)
          setOrders(hydrated)
          setBasket([])
          return hydrated[0] ?? null
        }

        await refreshOrders()
        setBasket([])
        return null
      } catch (error) {
        console.error("Place order failed:", error)
        return null
      }
    },
    [basket, basketTotal, refreshOrders]
  )

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? applyStatusTimestamp(o, status) : o)))

    void (async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateStatus", orderId, status }),
        })

        if (!res.ok) {
          const message = await readApiError(res, "Failed to update order status")
          throw new Error(message)
        }

        const data = await parseJsonSafe<{ orders: ApiOrder[] }>(res)
        if (data) {
          setOrders(data.orders.map(hydrateOrder))
        } else {
          await refreshOrders()
        }
      } catch (error) {
        console.error("Update status failed:", error)
      }
    })()
  }, [refreshOrders])

  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    const currentTimers = timersRef.current

    orders.forEach((order) => {
      if (
        order.status === "out_for_delivery" &&
        order.outForDeliveryAt &&
        !currentTimers.has(order.id)
      ) {
        const elapsed = Date.now() - order.outForDeliveryAt.getTime()
        const remaining = Math.max(0, 20 * 60 * 1000 - elapsed)
        const timer = setTimeout(() => {
          updateOrderStatus(order.id, "delivered")
          currentTimers.delete(order.id)
        }, remaining)
        currentTimers.set(order.id, timer)
      }

      if (order.status !== "out_for_delivery" && currentTimers.has(order.id)) {
        clearTimeout(currentTimers.get(order.id)!)
        currentTimers.delete(order.id)
      }
    })

    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer))
      currentTimers.clear()
    }
  }, [orders, updateOrderStatus])

  return {
    basket,
    orders,
    basketTotal,
    basketCount,
    refreshOrders,
    addToBasket,
    addToBasketFull,
    removeFromBasket,
    incrementBasketItem,
    clearBasket,
    placeOrder,
    updateOrderStatus,
    updateBasketItemComment,
    toggleBasketItemAddOn,
    addBasketItemCustomAddOn,
    removeBasketItemCustomAddOn,
  }
}

export type EposStore = ReturnType<typeof useEposStore>
