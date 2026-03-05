import { NextResponse } from "next/server"
import { supabaseRest } from "@/lib/server/supabase-rest"

export const dynamic = "force-dynamic"
const ORDER_STATUSES = [
  "preparing",
  "ready",
  "collected",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const

type DbOrder = {
  id: string
  order_number: number
  total: number
  status: string
  order_type: string
  customer: Record<string, unknown>
  payment_status: string
  payment_method: string | null
  order_comment: string | null
  created_at: string
  ready_at: string | null
  collected_at: string | null
  out_for_delivery_at: string | null
  delivered_at: string | null
  order_items?: DbOrderItem[]
}

type DbOrderItem = {
  item_snapshot: Record<string, unknown>
  quantity: number
  selected_variation: Record<string, unknown> | null
  add_ons: Array<Record<string, unknown>>
  custom_add_ons: Array<Record<string, unknown>>
  comment: string | null
}

function mapOrder(order: DbOrder) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    total: Number(order.total),
    status: order.status,
    orderType: order.order_type,
    customer: order.customer || {},
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    orderComment: order.order_comment || undefined,
    createdAt: order.created_at,
    readyAt: order.ready_at,
    collectedAt: order.collected_at,
    outForDeliveryAt: order.out_for_delivery_at,
    deliveredAt: order.delivered_at,
    items: (order.order_items || []).map((i) => ({
      item: i.item_snapshot,
      quantity: i.quantity,
      selectedVariation: i.selected_variation || undefined,
      addOns: i.add_ons || [],
      customAddOns: i.custom_add_ons || [],
      comment: i.comment || undefined,
    })),
  }
}

async function getOrdersPayload() {
  const rows = await supabaseRest<DbOrder[]>("orders", {
    query: {
      select:
        "id,order_number,total,status,order_type,customer,payment_status,payment_method,order_comment,created_at,ready_at,collected_at,out_for_delivery_at,delivered_at,order_items(item_snapshot,quantity,selected_variation,add_ons,custom_add_ons,comment)",
      order: "order_number.desc",
    },
  })

  return rows.map(mapOrder)
}

export async function GET() {
  try {
    const data = await getOrdersPayload()
    return NextResponse.json({ orders: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load orders"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    if (!rawBody.trim()) {
      return NextResponse.json({ error: "Missing request body" }, { status: 400 })
    }

    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    if (body.action === "placeOrder") {
      if (!body.order || !Array.isArray(body.order.items)) {
        return NextResponse.json({ error: "Invalid placeOrder payload" }, { status: 400 })
      }

      const [inserted] = await supabaseRest<DbOrder[]>("orders", {
        method: "POST",
        prefer: "return=representation",
        body: {
          total: body.order.total,
          status: "preparing",
          order_type: body.order.orderType,
          customer: body.order.customer || {},
          payment_status: body.order.paymentStatus,
          payment_method: body.order.paymentMethod,
          order_comment: body.order.orderComment || null,
        },
      })

      const orderItems = body.order.items.map((i: any) => ({
        order_id: inserted.id,
        item_snapshot: i.item,
        quantity: i.quantity,
        selected_variation: i.selectedVariation || null,
        add_ons: i.addOns || [],
        custom_add_ons: i.customAddOns || [],
        comment: i.comment || null,
      }))

      if (orderItems.length > 0) {
        await supabaseRest("order_items", {
          method: "POST",
          body: orderItems,
        })
      }
    } else if (body.action === "updateStatus") {
      if (!body.orderId || !body.status) {
        return NextResponse.json({ error: "Invalid updateStatus payload" }, { status: 400 })
      }

      const status = body.status as string
      if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
        return NextResponse.json({ error: "Invalid order status" }, { status: 400 })
      }

      const updates: Record<string, unknown> = { status }
      const now = new Date().toISOString()

      if (status === "ready") updates.ready_at = now
      if (status === "collected") updates.collected_at = now
      if (status === "out_for_delivery") updates.out_for_delivery_at = now
      if (status === "delivered") updates.delivered_at = now

      // Business rule: completing an unpaid order should settle it as cash.
      if (status === "collected" || status === "delivered") {
        const existing = await supabaseRest<Array<{ payment_status: string }>>("orders", {
          query: {
            select: "payment_status",
            id: `eq.${body.orderId}`,
            limit: 1,
          },
        })

        if (existing[0]?.payment_status === "unpaid") {
          updates.payment_status = "paid"
          updates.payment_method = "cash"
        }
      }

      await supabaseRest(`orders?id=eq.${encodeURIComponent(body.orderId)}`, {
        method: "PATCH",
        body: updates,
      })
    } else {
      return NextResponse.json({ error: "Unknown order action" }, { status: 400 })
    }

    const data = await getOrdersPayload()
    return NextResponse.json({ orders: data })
  } catch (err) {
    let message = err instanceof Error ? err.message : "Order action failed"
    if (message.includes("orders_status_check")) {
      message =
        "Database is missing the cancelled-status migration. Run supabase/migrations/002_add_cancelled_status.sql in Supabase SQL Editor."
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
