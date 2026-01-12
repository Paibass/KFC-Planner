import type { TimeRange } from "@/types/schedule"

export const timesOverlap = (time1: TimeRange, time2: TimeRange): boolean => {
  const start1 = Number.parseInt(time1.start.replace(":", ""))
  const end1 = Number.parseInt(time1.end.replace(":", ""))
  const start2 = Number.parseInt(time2.start.replace(":", ""))
  const end2 = Number.parseInt(time2.end.replace(":", ""))

  const adjustedEnd1 = end1 < start1 ? end1 + 2400 : end1
  const adjustedEnd2 = end2 < start2 ? end2 + 2400 : end2

  return start1 < adjustedEnd2 && start2 < adjustedEnd1
}
