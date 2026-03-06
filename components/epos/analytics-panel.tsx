"use client"

import {
  TrendingUp,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  PackageCheck,
  XCircle,
  X,
  PoundSterling,
  Banknote,
  CreditCard,
  CircleSlash,
} from "lucide-react"
import type { Order, OrderType, OrderStatus } from "@/lib/menu-data"
import { cn } from "@/lib/utils"

type AnalyticsPanelProps = {
  orders: Order[]
  onClose: () => void
}

function calcOrderItemLineTotal(entry: Order["items"][number]): number {
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

export function AnalyticsPanel({ orders, onClose }: AnalyticsPanelProps) {
  const todayOrders = orders.filter((o) => {
    const today = new Date()
    return (
      o.createdAt.getDate() === today.getDate() &&
      o.createdAt.getMonth() === today.getMonth() &&
      o.createdAt.getFullYear() === today.getFullYear()
    )
  })

  // Revenue
  const cancelledOrders = todayOrders.filter((o) => o.status === "cancelled")
  const nonCancelledOrders = todayOrders.filter((o) => o.status !== "cancelled")
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.total, 0)
  const completedOrders = nonCancelledOrders.filter(
    (o) => o.status === "collected" || o.status === "delivered"
  )
  const pendingOrders = nonCancelledOrders.filter(
    (o) =>
      o.status === "preparing" ||
      o.status === "ready" ||
      o.status === "out_for_delivery"
  )
  const completedRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + o.total, 0)
  const cancelledRevenue = cancelledOrders.reduce((sum, o) => sum + o.total, 0)
  const avgOrderValue =
    nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0

  // Order type breakdown
  const ordersByType: Record<OrderType, Order[]> = {
    instore: nonCancelledOrders.filter((o) => o.orderType === "instore"),
    collection: nonCancelledOrders.filter((o) => o.orderType === "collection"),
    delivery: nonCancelledOrders.filter((o) => o.orderType === "delivery"),
  }

  const typeConfig: Record<
    OrderType,
    { label: string; icon: React.ElementType }
  > = {
    instore: { label: "In-Store", icon: UtensilsCrossed },
    collection: { label: "Collection", icon: ShoppingBag },
    delivery: { label: "Delivery", icon: Truck },
  }

  // Status breakdown
  const ordersByStatus: Record<OrderStatus, number> = {
    preparing: todayOrders.filter((o) => o.status === "preparing").length,
    ready: todayOrders.filter((o) => o.status === "ready").length,
    out_for_delivery: todayOrders.filter((o) => o.status === "out_for_delivery")
      .length,
    collected: todayOrders.filter((o) => o.status === "collected").length,
    delivered: todayOrders.filter((o) => o.status === "delivered").length,
    cancelled: todayOrders.filter((o) => o.status === "cancelled").length,
  }

  const statusConfig: Record<
    OrderStatus,
    { label: string; icon: React.ElementType; color: string }
  > = {
    preparing: {
      label: "Preparing",
      icon: Clock,
      color: "text-[oklch(0.8_0.14_80)]",
    },
    ready: {
      label: "Ready",
      icon: CheckCircle2,
      color: "text-[oklch(0.65_0.2_145)]",
    },
    out_for_delivery: {
      label: "Out for Delivery",
      icon: Truck,
      color: "text-[oklch(0.6_0.15_250)]",
    },
    collected: {
      label: "Collected",
      icon: PackageCheck,
      color: "text-muted-foreground",
    },
    delivered: {
      label: "Delivered",
      icon: PackageCheck,
      color: "text-muted-foreground",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      color: "text-destructive",
    },
  }

  // Payment breakdown
  const paidCash = nonCancelledOrders.filter(
    (o) => o.paymentStatus === "paid" && o.paymentMethod === "cash"
  )
  const paidCard = nonCancelledOrders.filter(
    (o) => o.paymentStatus === "paid" && o.paymentMethod === "card"
  )
  const unpaidOrders = nonCancelledOrders.filter((o) => o.paymentStatus === "unpaid")
  const paidCashRevenue = paidCash.reduce((sum, o) => sum + o.total, 0)
  const paidCardRevenue = paidCard.reduce((sum, o) => sum + o.total, 0)
  const unpaidRevenue = unpaidOrders.reduce((sum, o) => sum + o.total, 0)

  // Top selling items
  const itemSales = new Map<string, { name: string; qty: number; revenue: number }>()
  nonCancelledOrders.forEach((order) => {
    order.items.forEach((entry) => {
      const lineTotal = calcOrderItemLineTotal(entry)
      const existing = itemSales.get(entry.item.id)
      if (existing) {
        existing.qty += entry.quantity
        existing.revenue += lineTotal
      } else {
        itemSales.set(entry.item.id, {
          name: entry.item.name,
          qty: entry.quantity,
          revenue: lineTotal,
        })
      }
    })
  })
  const topItems = Array.from(itemSales.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8)

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 lg:p-6">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-card-foreground">
              Daily Analytics
            </h2>
            <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-muted-foreground">
              {new Date().toLocaleDateString([], {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Revenue Cards */}
          <div className="mb-6 grid grid-cols-7 gap-4">
            <RevenueCard
              label="Total Revenue"
              value={totalRevenue}
              highlight
            />
            <RevenueCard label="Completed" value={completedRevenue} />
            <RevenueCard label="Pending" value={pendingRevenue} />
            <RevenueCard label="Cancelled" value={cancelledRevenue} />
            <RevenueCard label="Avg. Order" value={avgOrderValue} />
            <RevenueCard label="Paid" value={paidCashRevenue + paidCardRevenue} />
            <RevenueCard label="Unpaid" value={unpaidRevenue} />
          </div>

          <div className="grid grid-cols-4 gap-6">
            {/* Payment Breakdown */}
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Payment Breakdown
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Cash",
                    icon: Banknote,
                    count: paidCash.length,
                    revenue: paidCashRevenue,
                    color: "text-primary",
                  },
                  {
                    label: "Card",
                    icon: CreditCard,
                    count: paidCard.length,
                    revenue: paidCardRevenue,
                    color: "text-primary",
                  },
                  {
                    label: "Cancelled",
                    icon: XCircle,
                    count: cancelledOrders.length,
                    revenue: cancelledRevenue,
                    color: "text-destructive",
                  },
                  {
                    label: "Unpaid",
                    icon: CircleSlash,
                    count: unpaidOrders.length,
                    revenue: unpaidRevenue,
                    color: "text-destructive",
                  },
                ].map((item) => {
                  const Icon = item.icon
                  const pct =
                    nonCancelledOrders.length > 0
                      ? (item.count / nonCancelledOrders.length) * 100
                      : 0
                  return (
                    <div key={item.label} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", item.color)} />
                          <span className="text-sm font-semibold text-card-foreground">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-card-foreground">
                          {item.count}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {"£"}
                          {item.revenue.toFixed(2)}
                        </span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            item.label === "Cash" || item.label === "Card"
                              ? "bg-primary"
                              : "bg-destructive"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Type Breakdown */}
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                By Order Type
              </h3>
              <div className="flex flex-col gap-3">
                {(Object.keys(ordersByType) as OrderType[]).map((type) => {
                  const config = typeConfig[type]
                  const Icon = config.icon
                  const typeOrders = ordersByType[type]
                  const typeRevenue = typeOrders.reduce(
                    (sum, o) => sum + o.total,
                    0
                  )
                  const pct =
                    nonCancelledOrders.length > 0
                      ? (typeOrders.length / nonCancelledOrders.length) * 100
                      : 0
                  return (
                    <div key={type} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-card-foreground">
                            {config.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-card-foreground">
                          {typeOrders.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {"£"}
                          {typeRevenue.toFixed(2)}
                        </span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Order Status
              </h3>
              <div className="flex flex-col gap-3">
                {(Object.keys(ordersByStatus) as OrderStatus[]).map(
                  (status) => {
                    const config = statusConfig[status]
                    const Icon = config.icon
                    const count = ordersByStatus[status]
                    return (
                      <div
                        key={status}
                        className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", config.color)} />
                          <span className="text-sm font-medium text-card-foreground">
                            {config.label}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-lg font-bold tabular-nums",
                            count > 0 ? config.color : "text-muted-foreground"
                          )}
                        >
                          {count}
                        </span>
                      </div>
                    )
                  }
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Total Orders
                </span>
                <span className="text-lg font-bold text-card-foreground">
                  {todayOrders.length}
                </span>
              </div>
            </div>

            {/* Top Items */}
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Top Selling Items
              </h3>
              {topItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No orders yet today
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {topItems.map((item, i) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-card-foreground">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          x{item.qty}
                        </span>
                        <span className="text-sm font-bold text-card-foreground">
                          {"£"}
                          {item.revenue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RevenueCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-5",
        highlight
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-background"
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-2xl font-bold tabular-nums",
          highlight ? "text-primary" : "text-card-foreground"
        )}
      >
        {"£"}
        {value.toFixed(2)}
      </span>
    </div>
  )
}
