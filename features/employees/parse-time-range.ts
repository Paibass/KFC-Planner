import type { TimeRange } from "@/types/schedule"

export const parseTimeRange = (timeStr: string): TimeRange | null => {
  if (!timeStr || timeStr.toLowerCase().includes("descanso")) {
    return null
  }

  const match = timeStr.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
  if (match) {
    return { start: match[1], end: match[2] }
  }
  return null
}
