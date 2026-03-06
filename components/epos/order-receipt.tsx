"use client"

import {
  Clock,
  CheckCircle2,
  PackageCheck,
  Receipt,
  Timer,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
  Phone,
  User,
  MapPin,
  Banknote,
  CreditCard,
  CircleSlash,
  MessageSquare,
  XCircle,
} from "lucide-react"
import type { Order, OrderStatus, OrderType, OrderItem } from "@/lib/menu-data"
import { cn } from "@/lib/utils"
import { useCountdown } from "@/hooks/use-countdown"

type OrderReceiptProps = {
  order: Order | null
  onUpdateStatus: (orderId: string, status: OrderStatus) => void
  onPrintOrder?: (order: Order) => void
}

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  preparing: {
    label: "Preparing",
    color: "text-[oklch(0.8_0.14_80)]",
    bg: "bg-[oklch(0.8_0.14_80)]",
    icon: Clock,
  },
  ready: {
    label: "Ready",
    color: "text-[oklch(0.65_0.2_145)]",
    bg: "bg-[oklch(0.65_0.2_145)]",
    icon: CheckCircle2,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "text-[oklch(0.6_0.15_250)]",
    bg: "bg-[oklch(0.6_0.15_250)]",
    icon: Truck,
  },
  collected: {
    label: "Collected",
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: PackageCheck,
  },
  delivered: {
    label: "Delivered",
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: PackageCheck,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-destructive",
    bg: "bg-destructive/15",
    icon: XCircle,
  },
}

function getNextAction(
  order: Order
): { next: OrderStatus; label: string } | null {
  if (order.status === "preparing")
    return { next: "ready", label: "Mark Ready" }
  if (order.status === "ready") {
    if (order.orderType === "delivery")
      return { next: "out_for_delivery", label: "Out for Delivery" }
    return { next: "collected", label: "Mark Collected" }
  }
  if (order.status === "out_for_delivery")
    return { next: "delivered", label: "Mark Delivered" }
  return null
}

function calcItemLineTotal(entry: OrderItem): number {
  const base =
    entry.item.price + (entry.selectedVariation?.priceModifier ?? 0)
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

function calcItemsSubtotal(order: Order): number {
  return order.items.reduce((sum, entry) => sum + calcItemLineTotal(entry), 0)
}

export function OrderReceipt({
  order,
  onUpdateStatus,
  onPrintOrder,
}: OrderReceiptProps) {
  if (!order) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
        <Receipt className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">No order selected</p>
        <p className="text-sm mt-1">Select an order from the list to view</p>
      </div>
    )
  }

  return (
    <OrderReceiptContent
      order={order}
      onUpdateStatus={onUpdateStatus}
      onPrintOrder={onPrintOrder}
    />
  )
}

function OrderReceiptContent({
  order,
  onUpdateStatus,
  onPrintOrder,
}: {
  order: Order
  onUpdateStatus: (orderId: string, status: OrderStatus) => void
  onPrintOrder?: (order: Order) => void
}) {
  const config = statusConfig[order.status]
  const StatusIcon = config.icon
  const { readyByFormatted, countdownText, isOverdue, isUrgent } =
    useCountdown(order.createdAt)
  const showCountdown = order.status === "preparing"
  const nextAction = getNextAction(order)
  const canCancel =
    order.status === "preparing" ||
    order.status === "ready" ||
    order.status === "out_for_delivery"

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

  const orderTypeConfig: Record<
    OrderType,
    { label: string; icon: React.ElementType }
  > = {
    delivery: { label: "Delivery", icon: Truck },
    collection: { label: "Collection", icon: ShoppingBag },
    instore: { label: "In-Store", icon: UtensilsCrossed },
  }

  const typeInfo = orderTypeConfig[order.orderType]
  const TypeIcon = typeInfo.icon
  const itemsSubtotal = calcItemsSubtotal(order)
  const deliveryCharge =
    order.orderType === "delivery" ? Math.max(0, order.total - itemsSubtotal) : 0

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Receipt Header */}
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Order
            </p>
            <p className="text-4xl font-bold text-card-foreground">
              #{String(order.orderNumber).padStart(3, "0")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide",
                config.bg,
                order.status === "cancelled"
                  ? "text-destructive"
                  : order.status === "collected" ||
                    order.status === "delivered"
                  ? "text-muted-foreground"
                : order.status === "ready"
                    ? "text-[oklch(0.13_0_0)]"
                    : order.status === "out_for_delivery"
                      ? "text-foreground"
                      : "text-[oklch(0.13_0_0)]"
              )}
            >
              <StatusIcon className="h-4 w-4" />
              {config.label}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
              <TypeIcon className="h-3.5 w-3.5" />
              {typeInfo.label}
            </div>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                order.paymentStatus === "paid"
                  ? "bg-[oklch(0.65_0.2_145)]/15 text-[oklch(0.65_0.2_145)]"
                  : "bg-destructive/15 text-destructive"
              )}
            >
              {order.paymentStatus === "paid" ? (
                order.paymentMethod === "card" ? (
                  <CreditCard className="h-3.5 w-3.5" />
                ) : (
                  <Banknote className="h-3.5 w-3.5" />
                )
              ) : (
                <CircleSlash className="h-3.5 w-3.5" />
              )}
              {order.paymentStatus === "paid"
                ? `Paid - ${order.paymentMethod === "card" ? "Card" : "Cash"}`
                : "Unpaid"}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Placed: {formatTime(order.createdAt)} &middot;{" "}
              {order.createdAt.toLocaleDateString([], {
                day: "numeric",
                month: "short",
              })}
            </span>
            <span>
              Due:{" "}
              <span className="font-semibold text-card-foreground">
                {readyByFormatted}
              </span>
            </span>
          </div>
          {order.readyAt && (
            <p className="text-sm text-[oklch(0.65_0.2_145)] font-medium">
              Ready at: {formatTime(order.readyAt)}
            </p>
          )}
          {order.collectedAt && (
            <p className="text-sm text-muted-foreground">
              Collected at: {formatTime(order.collectedAt)}
            </p>
          )}
          {order.outForDeliveryAt && (
            <p className="text-sm text-[oklch(0.6_0.15_250)] font-medium">
              Out for delivery: {formatTime(order.outForDeliveryAt)}
            </p>
          )}
          {order.deliveredAt && (
            <p className="text-sm text-muted-foreground">
              Delivered at: {formatTime(order.deliveredAt)}
            </p>
          )}
        </div>
        {/* Customer Details */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-card-foreground">
          {order.customer.name && (
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {order.customer.name}
            </span>
          )}
          {order.customer.phone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              {order.customer.phone}
            </span>
          )}
          {order.customer.addressLine1 && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {[
                order.customer.addressLine1,
                order.customer.addressLine2,
                order.customer.city,
                order.customer.postcode,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
        </div>

        {/* Order comment */}
        {order.orderComment && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2">
            <MessageSquare className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <p className="text-sm text-card-foreground">{order.orderComment}</p>
          </div>
        )}

        {showCountdown && (
          <div
            className={cn(
              "mt-3 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-lg font-mono font-bold tabular-nums",
              isOverdue
                ? "bg-destructive/15 text-destructive"
                : isUrgent
                  ? "bg-[oklch(0.8_0.14_80)]/15 text-[oklch(0.8_0.14_80)]"
                  : "bg-secondary text-card-foreground"
            )}
          >
            <Timer className="h-5 w-5" />
            {countdownText}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-3">
          {order.items.map((entry, idx) => {
            const unitPrice =
              entry.item.price +
              (entry.selectedVariation?.priceModifier ?? 0)
            const lineTotal = calcItemLineTotal(entry)
            return (
              <div
                key={idx}
                className="rounded-lg border border-border/50 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-card-foreground">
                      {entry.quantity}x {entry.item.name}
                      {entry.selectedVariation && (
                        <span className="text-xs text-muted-foreground ml-1.5">
                          ({entry.selectedVariation.name})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {"£"}{unitPrice.toFixed(2)} each
                    </p>
                  </div>
                  <span className="text-sm font-bold text-card-foreground ml-2">
                    {"£"}{lineTotal.toFixed(2)}
                  </span>
                </div>

                {/* Add-ons */}
                {entry.addOns.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {entry.addOns.map((a) => (
                      <span
                        key={a.addOn.id}
                        className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                      >
                        + {a.addOn.name} ({"£"}{a.addOn.price.toFixed(2)})
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom add-ons */}
                {entry.customAddOns.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {entry.customAddOns.map((ca, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-card-foreground"
                      >
                        + {ca.name}{ca.price > 0 && <> ({"£"}{ca.price.toFixed(2)})</>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Item comment */}
                {entry.comment && (
                  <p className="mt-1.5 text-xs italic text-muted-foreground">
                    <MessageSquare className="inline h-3 w-3 mr-1" />
                    {entry.comment}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Receipt Footer */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Items ({order.items.reduce((sum, e) => sum + e.quantity, 0)})
          </span>
          <span className="text-sm text-muted-foreground">
            {"£"}{itemsSubtotal.toFixed(2)}
          </span>
        </div>
        {order.orderType === "delivery" && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Delivery Charge</span>
            <span className="text-sm text-muted-foreground">
              {"£"}{deliveryCharge.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold uppercase tracking-wide text-card-foreground">
            Total
          </span>
          <span className="text-3xl font-bold text-card-foreground">
            {"£"}{order.total.toFixed(2)}
          </span>
        </div>
        <div className="mb-2 flex gap-2">
          {onPrintOrder && (
            <button
              onClick={() => onPrintOrder(order)}
              className="w-full rounded-lg border border-border bg-secondary py-2.5 text-sm font-bold uppercase tracking-wider text-card-foreground transition-all hover:brightness-105 active:scale-[0.98]"
            >
              Print Receipt
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {nextAction && (
            <button
              onClick={() => onUpdateStatus(order.id, nextAction.next)}
              className={cn(
                "rounded-lg py-3.5 text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.98]",
                canCancel ? "flex-1" : "w-full",
                order.status === "preparing"
                  ? "bg-[oklch(0.65_0.2_145)] text-[oklch(0.13_0_0)]"
                  : order.status === "out_for_delivery"
                    ? "bg-[oklch(0.6_0.15_250)] text-foreground"
                    : "bg-[oklch(0.8_0.14_80)] text-[oklch(0.13_0_0)]"
              )}
            >
              {nextAction.label}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onUpdateStatus(order.id, "cancelled")}
              className={cn(
                "rounded-lg px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.98]",
                nextAction ? "shrink-0" : "w-full",
                "bg-destructive text-destructive-foreground"
              )}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
