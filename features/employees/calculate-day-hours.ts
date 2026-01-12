import { parseTimeRange } from "./parse-time-range"

export const calculateDayHours = (schedule: string): { hours: number; nightHours: number } => {
  if (!schedule || schedule.toLowerCase().includes("descanso")) {
    return { hours: 0, nightHours: 0 }
  }

  const timeRange = parseTimeRange(schedule)
  if (!timeRange) {
    return { hours: 0, nightHours: 0 }
  }

  const startHour = Number.parseInt(timeRange.start.split(":")[0])
  const startMinute = Number.parseInt(timeRange.start.split(":")[1])
  const endHour = Number.parseInt(timeRange.end.split(":")[0])
  const endMinute = Number.parseInt(timeRange.end.split(":")[1])

  const startMinutes = startHour * 60 + startMinute
  let endMinutes = endHour * 60 + endMinute

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  const totalMinutes = endMinutes - startMinutes
  const hours = totalMinutes / 60

  const nightStart = 22 * 60
  const nightEnd = 6 * 60
  let nightMinutes = 0

  if (endMinutes <= 24 * 60) {
    if (startMinutes < 24 * 60 && endMinutes > nightStart) {
      const intersectStart = Math.max(startMinutes, nightStart)
      const intersectEnd = Math.min(endMinutes, 24 * 60)
      nightMinutes += Math.max(0, intersectEnd - intersectStart)
    }
    if (startMinutes < nightEnd && endMinutes > 0) {
      const intersectStart = Math.max(startMinutes, 0)
      const intersectEnd = Math.min(endMinutes, nightEnd)
      nightMinutes += Math.max(0, intersectEnd - intersectStart)
    }
  } else {
    if (startMinutes < 24 * 60) {
      const intersectStart = Math.max(startMinutes, nightStart)
      const intersectEnd = 24 * 60
      nightMinutes += Math.max(0, intersectEnd - intersectStart)
    }
    const afterMidnightEnd = endMinutes - 24 * 60
    if (afterMidnightEnd > 0) {
      const intersectStart = 0
      const intersectEnd = Math.min(afterMidnightEnd, nightEnd)
      nightMinutes += Math.max(0, intersectEnd - intersectStart)
    }
  }

  const nightHours = nightMinutes / 60

  return {
    hours: Math.round(hours * 10) / 10,
    nightHours: Math.round(nightHours * 10) / 10,
  }
}
