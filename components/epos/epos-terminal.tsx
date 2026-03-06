"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  Pencil,
  Search,
  X,
  Settings,
} from "lucide-react"
import { useEposStore } from "@/hooks/use-epos-store"
import { useMenuStore } from "@/hooks/use-menu-store"
import { CategoryTabs } from "./category-tabs"
import { MenuGrid } from "./menu-grid"
import { BasketPanel } from "./basket-panel"
import { CheckoutPage } from "./checkout-page"
import { OrdersList } from "./orders-view"
import { OrderReceipt } from "./order-receipt"
import { AnalyticsPanel } from "./analytics-panel"
import { MenuEditor } from "./menu-editor"
import { SettingsPanel, type DeliveryCharge } from "./settings-panel"
import { cn } from "@/lib/utils"
import type {
  OrderType,
  CustomerDetails,
  PaymentStatus,
  PaymentMethod,
  Order,
} from "@/lib/menu-data"

type View = "menu" | "checkout" | "orders" | "analytics" | "editMenu" | "settings"

export function EposTerminal() {
  const [view, setView] = useState<View>("menu")
  const [activeCategory, setActiveCategory] = useState("burgers")
  const [menuSearch, setMenuSearch] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [deliveryCharges, setDeliveryCharges] = useState<DeliveryCharge[]>([])
  const store = useEposStore()
  const menuStore = useMenuStore()

  const refreshDeliveryCharges = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/delivery-charges", {
        cache: "no-store",
      })
      if (!res.ok) return
      const data = (await res.json()) as { deliveryCharges: DeliveryCharge[] }
      setDeliveryCharges(data.deliveryCharges ?? [])
    } catch {
      // keep checkout usable if settings endpoint is unavailable
    }
  }, [])

  useEffect(() => {
    void refreshDeliveryCharges()
  }, [refreshDeliveryCharges])

  const upsertDeliveryCharge = useCallback(
    async (postcodePrefix: string, charge: number) => {
      const res = await fetch("/api/settings/delivery-charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsertCharge",
          postcodePrefix,
          charge,
        }),
      })
      if (!res.ok) return
      const data = (await res.json()) as { deliveryCharges: DeliveryCharge[] }
      setDeliveryCharges(data.deliveryCharges ?? [])
    },
    []
  )

  const deleteDeliveryCharge = useCallback(async (postcodePrefix: string) => {
    const res = await fetch("/api/settings/delivery-charges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteCharge", postcodePrefix }),
    })
    if (!res.ok) return
    const data = (await res.json()) as { deliveryCharges: DeliveryCharge[] }
    setDeliveryCharges(data.deliveryCharges ?? [])
  }, [])

  const isToday = (date: Date) => {
    const now = new Date()
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
  }

  const todaysOrders = store.orders.filter((o) => isToday(o.createdAt))

  const selectedOrder =
    todaysOrders.find((o) => o.id === selectedOrderId) ?? null

  const printOrderReceipt = (order: Order) => {
    const receiptWindow = window.open("", "_blank", "width=420,height=700")
    if (!receiptWindow) return

    const currency = (n: number) => `£${n.toFixed(2)}`
    const createdAt = order.createdAt.toLocaleString()
    const customerLines = [
      order.customer.name,
      order.customer.phone,
      order.customer.addressLine1,
      order.customer.addressLine2,
      order.customer.city,
      order.customer.postcode,
    ].filter(Boolean)

    const lines = order.items
      .map((entry) => {
        const base = entry.item.price + (entry.selectedVariation?.priceModifier ?? 0)
        const addOnsTotal = entry.addOns.reduce(
          (sum, a) => sum + a.addOn.price * a.quantity,
          0
        )
        const customAddOnsTotal = entry.customAddOns.reduce(
          (sum, c) => sum + c.price,
          0
        )
        const total = (base + addOnsTotal + customAddOnsTotal) * entry.quantity
        const variation = entry.selectedVariation ? ` (${entry.selectedVariation.name})` : ""
        const addOnLines = [
          ...entry.addOns.map(
            (a) =>
              `+ ${a.addOn.name} x${a.quantity}${
                a.addOn.price * a.quantity > 0
                  ? ` (${currency(a.addOn.price * a.quantity)})`
                  : ""
              }`
          ),
          ...entry.customAddOns.map(
            (c) => `+ ${c.name}${c.price > 0 ? ` (${currency(c.price)})` : ""}`
          ),
        ]
        const addOnMarkup =
          addOnLines.length > 0
            ? `<div style="margin-top:4px;font-size:11px;color:#555;">${addOnLines.join("<br/>")}</div>`
            : ""
        const commentMarkup = entry.comment
          ? `<div style="margin-top:4px;font-size:11px;color:#555;"><em>Note: ${entry.comment}</em></div>`
          : ""
        return `<tr><td>${entry.quantity} x ${entry.item.name}${variation}${addOnMarkup}${commentMarkup}</td><td style="text-align:right">${currency(total)}</td></tr>`
      })
      .join("")

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Order #${String(order.orderNumber).padStart(3, "0")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
            h1 { margin: 0 0 4px; font-size: 20px; }
            p { margin: 2px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            td { padding: 6px 0; border-bottom: 1px dashed #ccc; font-size: 12px; vertical-align: top; }
            .total { font-weight: 700; font-size: 15px; margin-top: 12px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Diyab Ocean</h1>
          <p>Order #${String(order.orderNumber).padStart(3, "0")}</p>
          <p>${createdAt}</p>
          <p>Type: ${order.orderType}</p>
          <p>Payment: ${order.paymentStatus === "paid" ? `Paid (${order.paymentMethod ?? "cash"})` : "Unpaid"}</p>
          ${customerLines.length ? `<p>Customer: ${customerLines.join(", ")}</p>` : ""}
          ${order.orderComment ? `<p>Note: ${order.orderComment}</p>` : ""}
          <table>${lines}</table>
          <p class="total">Total: ${currency(order.total)}</p>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `)
    receiptWindow.document.close()
  }

  const handlePlaceOrder = async (
    orderType: OrderType,
    customer: CustomerDetails,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod,
    orderComment?: string,
    totalOverride?: number
  ) => {
    const placedOrder = await store.placeOrder(
      orderType,
      customer,
      paymentStatus,
      paymentMethod,
      orderComment,
      totalOverride
    )
    if (!placedOrder) return
    setSelectedOrderId(placedOrder.id)
    setView("orders")
    printOrderReceipt(placedOrder)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between border-b border-border px-4 py-2.5 lg:px-6">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Diyab Ocean
          </h1>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setView("menu")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all",
              view === "menu" || view === "checkout"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Menu
          </button>
          <button
            onClick={() => setView("orders")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all",
              view === "orders"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardList className="h-4 w-4" />
            Orders
            {store.orders.filter(
              (o) =>
                isToday(o.createdAt) &&
                o.status !== "collected" &&
                o.status !== "delivered" &&
                o.status !== "cancelled"
            ).length > 0 && (
              <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold", view === "orders" ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground")}>
                {
                  store.orders.filter(
                    (o) =>
                      isToday(o.createdAt) &&
                      o.status !== "collected" &&
                      o.status !== "delivered" &&
                      o.status !== "cancelled"
                  ).length
                }
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setView(view === "editMenu" ? "menu" : "editMenu")
            }
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              view === "editMenu"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Menu</span>
          </button>
          <button
            onClick={() =>
              setView(view === "analytics" ? "menu" : "analytics")
            }
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              view === "analytics"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          <button
            onClick={() => setView(view === "settings" ? "menu" : "settings")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              view === "settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">
              Terminal 01
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {view === "analytics" ? (
        <AnalyticsPanel
          orders={store.orders}
          onClose={() => setView("menu")}
        />
      ) : view === "settings" ? (
        <SettingsPanel
          deliveryCharges={deliveryCharges}
          onUpsertCharge={upsertDeliveryCharge}
          onDeleteCharge={deleteDeliveryCharge}
        />
      ) : view === "editMenu" ? (
        <MenuEditor menuStore={menuStore} />
      ) : view === "checkout" ? (
        <CheckoutPage
          basket={store.basket}
          basketTotal={store.basketTotal}
          orders={store.orders}
          deliveryCharges={deliveryCharges}
          onPlaceOrder={handlePlaceOrder}
          onBack={() => setView("menu")}
        />
      ) : view === "menu" ? (
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4 p-4 lg:p-6">
          {/* Left 2/3 - Categories + Menu Grid */}
          <div className="col-span-2 flex min-h-0 gap-4">
            <div className="w-60 shrink-0 min-h-0 overflow-y-auto">
              <CategoryTabs
                categories={menuStore.categories}
                activeCategory={activeCategory}
                onCategoryChange={(categoryId) => {
                  setActiveCategory(categoryId)
                  setMenuSearch("")
                }}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search products across all categories..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {menuSearch.trim() && (
                  <button
                    onClick={() => setMenuSearch("")}
                    className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <MenuGrid
                items={menuStore.menuItems}
                categories={menuStore.categories}
                activeCategory={activeCategory}
                searchQuery={menuSearch}
                onAddItemFull={store.addToBasketFull}
              />
            </div>
          </div>

          {/* Right 1/3 - Basket */}
          <div className="col-span-1 min-h-0">
            <BasketPanel
              basket={store.basket}
              basketTotal={store.basketTotal}
              basketCount={store.basketCount}
              onRemoveItem={store.removeFromBasket}
              onIncrementItem={store.incrementBasketItem}
              onClear={store.clearBasket}
              onPlaceOrder={() => setView("checkout")}
              onToggleAddOn={store.toggleBasketItemAddOn}
              onAddCustomAddOn={store.addBasketItemCustomAddOn}
              onRemoveCustomAddOn={store.removeBasketItemCustomAddOn}
              onUpdateComment={store.updateBasketItemComment}
            />
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4 p-4 lg:p-6">
          {/* Left 2/3 - Receipt */}
          <div className="col-span-2 min-h-0 overflow-hidden">
            <OrderReceipt
              order={selectedOrder}
              onUpdateStatus={store.updateOrderStatus}
              onPrintOrder={printOrderReceipt}
            />
          </div>

          {/* Right 1/3 - Orders List */}
          <div className="col-span-1 min-h-0 overflow-hidden">
            <OrdersList
              orders={todaysOrders}
              selectedOrderId={selectedOrderId}
              onSelectOrder={setSelectedOrderId}
            />
          </div>
        </div>
      )}
    </div>
  )
}
