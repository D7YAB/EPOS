"use client"

import { useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

export type DeliveryCharge = {
  postcodePrefix: string
  charge: number
}

type SettingsPanelProps = {
  deliveryCharges: DeliveryCharge[]
  onUpsertCharge: (postcodePrefix: string, charge: number) => Promise<void> | void
  onDeleteCharge: (postcodePrefix: string) => Promise<void> | void
}

function normalizePrefix(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase()
}

export function SettingsPanel({
  deliveryCharges,
  onUpsertCharge,
  onDeleteCharge,
}: SettingsPanelProps) {
  const [postcodePrefix, setPostcodePrefix] = useState("")
  const [charge, setCharge] = useState("")

  const sortedCharges = useMemo(
    () =>
      [...deliveryCharges].sort((a, b) =>
        a.postcodePrefix.localeCompare(b.postcodePrefix)
      ),
    [deliveryCharges]
  )

  const submit = async () => {
    const normalized = normalizePrefix(postcodePrefix)
    const parsedCharge = Number(charge)
    if (!normalized || !Number.isFinite(parsedCharge) || parsedCharge < 0) return

    await onUpsertCharge(normalized, parsedCharge)
    setPostcodePrefix("")
    setCharge("")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 lg:p-6">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-border bg-card">
        <div className="shrink-0 border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-card-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Delivery charges by postcode prefix (e.g. PR5, PR1).
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
            <input
              value={postcodePrefix}
              onChange={(e) => setPostcodePrefix(e.target.value)}
              placeholder="Postcode prefix (e.g. PR5)"
              className="rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                £
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-input py-3 pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={submit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Save
            </button>
          </div>

          {sortedCharges.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              No postcode delivery charges configured yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedCharges.map((entry) => (
                <div
                  key={entry.postcodePrefix}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">
                      {entry.postcodePrefix}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Delivery charge: £{entry.charge.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteCharge(entry.postcodePrefix)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

