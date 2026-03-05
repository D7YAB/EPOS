const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

function getConfig() {
  if (!SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!SUPABASE_KEY) {
    throw new Error(
      "Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)."
    )
  }

  return { url: SUPABASE_URL, key: SUPABASE_KEY }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  prefer?: string
}

export async function supabaseRest<T>(
  path: string,
  { method = "GET", query, body, prefer }: RequestOptions = {}
): Promise<T> {
  const { url, key } = getConfig()
  const qs = new URLSearchParams()

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) qs.set(k, String(v))
    })
  }

  const endpoint = `${url}/rest/v1/${path}${qs.toString() ? `?${qs}` : ""}`

  const res = await fetch(endpoint, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  if (!res.ok) {
    let message = `Supabase request failed (${res.status})`
    try {
      const err = await res.json()
      if (err?.message) message = err.message
    } catch {
      // ignore parse failures
    }
    throw new Error(message)
  }

  if (res.status === 204) {
    return null as T
  }

  const text = await res.text()
  if (!text.trim()) {
    return null as T
  }

  return JSON.parse(text) as T
}
