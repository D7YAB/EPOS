import { NextResponse } from "next/server"
import { supabaseRest } from "@/lib/server/supabase-rest"

export const dynamic = "force-dynamic"

type DbCategory = {
  id: string
  name: string
  color: string
  sort_order: number
}

type DbVariation = {
  id: string
  item_id: string
  name: string
  price_modifier: number
}

type DbAddOn = {
  id: string
  item_id: string
  name: string
  price: number
}

type DbMenuItem = {
  id: string
  name: string
  price: number
  category_id: string
  product_variations?: DbVariation[]
  product_add_ons?: DbAddOn[]
}

async function getMenuPayload() {
  const [categories, items] = await Promise.all([
    supabaseRest<DbCategory[]>("categories", {
      query: { select: "id,name,color,sort_order", order: "sort_order.asc,name.asc" },
    }),
    supabaseRest<DbMenuItem[]>("menu_items", {
      query: {
        select: "id,name,price,category_id,product_variations(*),product_add_ons(*)",
        order: "name.asc",
      },
    }),
  ])

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      sortOrder: Number(category.sort_order),
    })),
    menuItems: items.map((m) => ({
      id: m.id,
      name: m.name,
      price: Number(m.price),
      category: m.category_id,
      variations: (m.product_variations || []).map((v) => ({
        id: v.id,
        name: v.name,
        priceModifier: Number(v.price_modifier),
      })),
      addOns: (m.product_add_ons || []).map((a) => ({
        id: a.id,
        name: a.name,
        price: Number(a.price),
      })),
    })),
  }
}

export async function GET() {
  try {
    const data = await getMenuPayload()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load menu"
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

    if (!body?.action) {
      return NextResponse.json({ error: "Missing menu action" }, { status: 400 })
    }

    switch (body.action) {
      case "addCategory": {
        const lastCategories = await supabaseRest<Array<{ sort_order: number }>>(
          "categories",
          {
            query: {
              select: "sort_order",
              order: "sort_order.desc",
              limit: 1,
            },
          }
        )
        await supabaseRest("categories", {
          method: "POST",
          body: {
            id: body.category.id,
            name: body.category.name,
            color: body.category.color,
            sort_order: Number(lastCategories[0]?.sort_order ?? -1) + 1,
          },
        })
        break
      }
      case "updateCategory": {
        const updates: Record<string, unknown> = {}
        if (body.updates.name !== undefined) updates.name = body.updates.name
        if (body.updates.color !== undefined) updates.color = body.updates.color
        if (body.updates.sortOrder !== undefined) {
          updates.sort_order = body.updates.sortOrder
        }
        await supabaseRest(`categories?id=eq.${encodeURIComponent(body.id)}`, {
          method: "PATCH",
          body: updates,
        })
        break
      }
      case "deleteCategory": {
        await supabaseRest(`categories?id=eq.${encodeURIComponent(body.id)}`, {
          method: "DELETE",
        })
        break
      }
      case "reorderCategories": {
        if (
          !Array.isArray(body.orderedIds) ||
          body.orderedIds.some((id: unknown) => typeof id !== "string")
        ) {
          return NextResponse.json(
            { error: "Invalid category order" },
            { status: 400 }
          )
        }

        const existingCategories = await supabaseRest<Array<{ id: string }>>(
          "categories",
          { query: { select: "id" } }
        )
        const existingIds = new Set(existingCategories.map((category) => category.id))
        const orderedIds = body.orderedIds as string[]
        const requestedIds = new Set(orderedIds)
        if (
          orderedIds.length !== existingIds.size ||
          requestedIds.size !== existingIds.size ||
          orderedIds.some((id) => !existingIds.has(id))
        ) {
          return NextResponse.json(
            { error: "Category order is out of date; refresh and try again" },
            { status: 409 }
          )
        }

        await Promise.all(
          orderedIds.map((id, index) =>
            supabaseRest(`categories?id=eq.${encodeURIComponent(id)}`, {
              method: "PATCH",
              body: { sort_order: index },
            })
          )
        )
        break
      }
      case "addItem": {
        await supabaseRest("menu_items", {
          method: "POST",
          body: {
            id: body.item.id,
            name: body.item.name,
            price: body.item.price,
            category_id: body.item.category,
          },
        })
        break
      }
      case "updateItem": {
        const updates: Record<string, unknown> = {}
        if (body.updates.name !== undefined) updates.name = body.updates.name
        if (body.updates.price !== undefined) updates.price = body.updates.price
        if (body.updates.category !== undefined) updates.category_id = body.updates.category

        await supabaseRest(`menu_items?id=eq.${encodeURIComponent(body.id)}`, {
          method: "PATCH",
          body: updates,
        })
        break
      }
      case "deleteItem": {
        await supabaseRest(`menu_items?id=eq.${encodeURIComponent(body.id)}`, {
          method: "DELETE",
        })
        break
      }
      case "addVariation": {
        await supabaseRest("product_variations", {
          method: "POST",
          body: {
            id: body.variation.id,
            item_id: body.itemId,
            name: body.variation.name,
            price_modifier: body.variation.priceModifier,
          },
        })
        break
      }
      case "removeVariation": {
        await supabaseRest(
          `product_variations?id=eq.${encodeURIComponent(body.variationId)}&item_id=eq.${encodeURIComponent(body.itemId)}`,
          { method: "DELETE" }
        )
        break
      }
      case "addAddOn": {
        await supabaseRest("product_add_ons", {
          method: "POST",
          body: {
            id: body.addOn.id,
            item_id: body.itemId,
            name: body.addOn.name,
            price: body.addOn.price,
          },
        })
        break
      }
      case "removeAddOn": {
        await supabaseRest(
          `product_add_ons?id=eq.${encodeURIComponent(body.addOnId)}&item_id=eq.${encodeURIComponent(body.itemId)}`,
          { method: "DELETE" }
        )
        break
      }
      default:
        return NextResponse.json({ error: "Unknown menu action" }, { status: 400 })
    }

    const data = await getMenuPayload()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Menu action failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
