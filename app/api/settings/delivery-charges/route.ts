import { NextResponse } from "next/server"
import { supabaseRest } from "@/lib/server/supabase-rest"

export const dynamic = "force-dynamic"

type DbDeliveryCharge = {
  postcode_prefix: string
  charge: number
}

function normalizePrefix(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase()
}

export async function GET() {
  try {
    const rows = await supabaseRest<DbDeliveryCharge[]>("delivery_postcode_charges", {
      query: {
        select: "postcode_prefix,charge",
        order: "postcode_prefix.asc",
      },
    })

    return NextResponse.json({
      deliveryCharges: rows.map((r) => ({
        postcodePrefix: r.postcode_prefix,
        charge: Number(r.charge),
      })),
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load delivery charges"
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

    if (body.action === "upsertCharge") {
      const postcodePrefix = normalizePrefix(body.postcodePrefix || "")
      const charge = Number(body.charge)

      if (!postcodePrefix) {
        return NextResponse.json({ error: "Postcode prefix is required" }, { status: 400 })
      }
      if (!Number.isFinite(charge) || charge < 0) {
        return NextResponse.json(
          { error: "Charge must be a valid non-negative number" },
          { status: 400 }
        )
      }

      await supabaseRest("delivery_postcode_charges", {
        method: "POST",
        body: { postcode_prefix: postcodePrefix, charge },
        prefer: "resolution=merge-duplicates",
      })
    } else if (body.action === "deleteCharge") {
      const postcodePrefix = normalizePrefix(body.postcodePrefix || "")
      if (!postcodePrefix) {
        return NextResponse.json({ error: "Postcode prefix is required" }, { status: 400 })
      }

      await supabaseRest(
        `delivery_postcode_charges?postcode_prefix=eq.${encodeURIComponent(postcodePrefix)}`,
        { method: "DELETE" }
      )
    } else {
      return NextResponse.json({ error: "Unknown settings action" }, { status: 400 })
    }

    const rows = await supabaseRest<DbDeliveryCharge[]>("delivery_postcode_charges", {
      query: {
        select: "postcode_prefix,charge",
        order: "postcode_prefix.asc",
      },
    })

    return NextResponse.json({
      deliveryCharges: rows.map((r) => ({
        postcodePrefix: r.postcode_prefix,
        charge: Number(r.charge),
      })),
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Settings update failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

