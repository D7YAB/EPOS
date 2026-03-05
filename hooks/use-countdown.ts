"use client"

import { useState, useEffect } from "react"

const PREP_TIME_MS = 20 * 60 * 1000 // 20 minutes

export function useCountdown(createdAt: Date) {
  const readyBy = new Date(createdAt.getTime() + PREP_TIME_MS)

  const [remaining, setRemaining] = useState(() => {
    const diff = readyBy.getTime() - Date.now()
    return Math.max(0, diff)
  })

  useEffect(() => {
    if (remaining <= 0) return

    const interval = setInterval(() => {
      const diff = readyBy.getTime() - Date.now()
      if (diff <= 0) {
        setRemaining(0)
        clearInterval(interval)
      } else {
        setRemaining(diff)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [readyBy, remaining])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  const isOverdue = remaining <= 0
  const isUrgent = remaining > 0 && remaining <= 5 * 60 * 1000 // under 5 mins

  const elapsed = PREP_TIME_MS - remaining
  const progress = Math.min(1, elapsed / PREP_TIME_MS)

  const readyByFormatted = readyBy.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  const countdownText = isOverdue
    ? "OVERDUE"
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  return { readyBy, readyByFormatted, countdownText, isOverdue, isUrgent, progress, minutes, seconds }
}
