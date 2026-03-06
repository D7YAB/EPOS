"use client"

import {
  Clock,
  CheckCircle2,
  PackageCheck,
  ClipboardList,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
  Banknote,
  CreditCard,
  CircleSlash,
  MessageSquare,
  XCircle,
} from "lucide-react"
import type { Order, OrderStatus, OrderType } from "@/lib/menu-data"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCountdown } from "@/hooks/use-countdown"

type OrdersListProps = {
  orders: Order[]
  selectedOrderId: string | null
  onSelectOrder: (orderId: string) => void
}

const statusIcon: Record<OrderStatus, React.ElementType> = {
  preparing: Clock,
  ready: CheckCircle2,
  out_for_delivery: Truck,
  collected: PackageCheck,
  delivered: PackageCheck,
  cancelled: XCircle,
}

const statusColor: Record<OrderStatus, string> = {
  preparing: "bg-[oklch(0.8_0.14_80)] text-[oklch(0.13_0_0)]",
  ready: "bg-[oklch(0.65_0.2_145)] text-[oklch(0.13_0_0)]",
  out_for_delivery: "bg-[oklch(0.6_0.15_250)] text-foreground",
  collected: "bg-muted text-muted-foreground",
  delivered: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
}

const statusLabel: Record<OrderStatus, string> = {
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  collected: "Collected",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const orderTypeConfig: Record<
  OrderType,
  { label: string; icon: React.ElementType }
> = {
  delivery: { label: "Delivery", icon: Truck },
  collection: { label: "Collection", icon: ShoppingBag },
  instore: { label: "In-Store", icon: UtensilsCrossed },
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function calcItemsSubtotal(order: Order): number {
  return order.items.reduce((sum, entry) => {
    const base = entry.item.price + (entry.selectedVariation?.priceModifier ?? 0)
    const addOnsTotal = entry.addOns.reduce(
      (s, a) => s + a.addOn.price * a.quantity,
      0
    )
    const customAddOnsTotal = entry.customAddOns.reduce((s, c) => s + c.price, 0)
    return sum + (base + addOnsTotal + customAddOnsTotal) * entry.quantity
  }, 0)
}

function OrderCard({
  order,
  isSelected,
  onSelect,
}: {
  order: Order
  isSelected: boolean
  onSelect: () => void
}) {
  const Icon = statusIcon[order.status]
  const { readyByFormatted, countdownText, isOverdue, isUrgent, progress } =
    useCountdown(order.createdAt)
  const isPreparing = order.status === "preparing"

  const barColor = isOverdue
    ? "bg-destructive"
    : isUrgent
      ? "bg-[oklch(0.8_0.14_80)]"
      : "bg-[oklch(0.65_0.2_145)]"

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg p-3 text-left transition-all",
        isSelected
          ? "bg-primary/15 border border-primary/40"
          : "border border-transparent hover:bg-secondary/70",
        (order.status === "collected" ||
          order.status === "delivered" ||
          order.status === "cancelled") &&
          !isSelected &&
          "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-card-foreground">
          #{String(order.orderNumber).padStart(3, "0")}
        </span>
        <span className="text-sm font-bold text-card-foreground">
          {"£"}{order.total.toFixed(2)}
        </span>
      </div>

      {(() => {
        const typeInfo = orderTypeConfig[order.orderType]
        const TypeIcon = typeInfo.icon
        const subtotal = calcItemsSubtotal(order)
        const deliveryCharge =
          order.orderType === "delivery" ? Math.max(0, order.total - subtotal) : 0
        const detail =
          order.orderType === "delivery"
            ? order.customer.addressLine1
            : order.customer.name
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            <TypeIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {typeInfo.label}
              {detail ? ` \u2022 ${detail}` : ""}
            </span>
            {order.orderType === "delivery" && deliveryCharge > 0 && (
              <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-card-foreground">
                +£{deliveryCharge.toFixed(2)}
              </span>
            )}
          </div>
        )
      })()}

      {/* Items summary */}
      <div className="text-[11px] text-muted-foreground truncate">
        {order.items
          .map(
            (e) =>
              `${e.quantity}x ${e.item.name}${e.selectedVariation ? ` (${e.selectedVariation.name})` : ""}`
          )
          .join(", ")}
      </div>

      {/* Order comment indicator */}
      {order.orderComment && (
        <div className="flex items-center gap-1 text-[11px] text-primary truncate">
          <MessageSquare className="h-3 w-3 shrink-0" />
          <span className="truncate">{order.orderComment}</span>
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-semibold",
          order.paymentStatus === "paid"
            ? "text-[oklch(0.65_0.2_145)]"
            : "text-destructive"
        )}
      >
        {order.paymentStatus === "paid" ? (
          order.paymentMethod === "card" ? (
            <CreditCard className="h-3 w-3" />
          ) : (
            <Banknote className="h-3 w-3" />
          )
        ) : (
          <CircleSlash className="h-3 w-3" />
        )}
        {order.paymentStatus === "paid"
          ? `Paid - ${order.paymentMethod === "card" ? "Card" : "Cash"}`
          : "Unpaid"}
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Placed: {formatTime(order.createdAt)}</span>
          <span>
            Due:{" "}
            <span className="font-semibold text-card-foreground">
              {readyByFormatted}
            </span>
          </span>
        </div>
        {order.readyAt && (
          <div className="flex items-center justify-between">
            <span className="text-[oklch(0.65_0.2_145)]">
              Ready: {formatTime(order.readyAt)}
            </span>
          </div>
        )}
        {order.collectedAt && (
          <div className="flex items-center justify-between">
            <span>Collected: {formatTime(order.collectedAt)}</span>
          </div>
        )}
        {order.outForDeliveryAt && (
          <div className="flex items-center justify-between">
            <span className="text-[oklch(0.6_0.15_250)]">
              Out: {formatTime(order.outForDeliveryAt)}
            </span>
          </div>
        )}
        {order.deliveredAt && (
          <div className="flex items-center justify-between">
            <span>Delivered: {formatTime(order.deliveredAt)}</span>
          </div>
        )}
      </div>

      {isPreparing && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-end">
            <span
              className={cn(
                "text-xs font-mono font-bold tabular-nums",
                isOverdue
                  ? "text-destructive"
                  : isUrgent
                    ? "text-[oklch(0.8_0.14_80)]"
                    : "text-card-foreground"
              )}
            >
              {countdownText}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                barColor
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide",
          statusColor[order.status]
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {statusLabel[order.status]}
      </div>
    </button>
  )
}

export function OrdersList({
  orders,
  selectedOrderId,
  onSelectOrder,
}: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
            Orders
          </h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <PackageCheck className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm font-medium">No orders yet</p>
          <p className="text-xs mt-1">Placed orders appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
            Orders
          </h2>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
            {orders.length}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1.5 p-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={order.id === selectedOrderId}
              onSelect={() => onSelectOrder(order.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
