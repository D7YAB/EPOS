import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const IDEAL_POSTCODES_API_KEY = process.env.IDEAL_POSTCODES_API_KEY

type IdealPostcodesAddress = {
  udprn?: number | string
  line_1?: string
  line_2?: string
  line_3?: string
  post_town?: string
  postcode?: string
}

function buildLabel(addr: IdealPostcodesAddress): string {
  const parts = [
    addr.line_1,
    addr.line_2,
    addr.line_3,
    addr.post_town,
    addr.postcode,
  ].filter(Boolean)
  return parts.join(", ")
}

export async function GET(req: Request) {
  try {
    if (!IDEAL_POSTCODES_API_KEY) {
      return NextResponse.json(
        { error: "Missing IDEAL_POSTCODES_API_KEY" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(req.url)
    const postcode = searchParams.get("postcode")?.trim()
    if (!postcode) {
      return NextResponse.json(
        { error: "Postcode is required" },
        { status: 400 }
      )
    }

    const apiUrl = new URL("https://api.ideal-postcodes.co.uk/v1/addresses")
    apiUrl.searchParams.set("query", postcode)
    apiUrl.searchParams.set("api_key", IDEAL_POSTCODES_API_KEY)

    const res = await fetch(apiUrl.toString(), { cache: "no-store" })
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const message =
        data?.message || data?.error || "Ideal Postcodes lookup failed"
      return NextResponse.json({ error: message }, { status: res.status })
    }

    const hits: IdealPostcodesAddress[] = data?.result?.hits ?? []
    const addresses = hits.map((addr, index) => ({
      id: String(addr.udprn ?? index),
      line1: addr.line_1 ?? "",
      line2: addr.line_2 ?? "",
      line3: addr.line_3 ?? "",
      city: addr.post_town ?? "",
      postcode: addr.postcode ?? postcode,
      label: buildLabel(addr),
    }))

    return NextResponse.json({ addresses })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Postcode lookup failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

