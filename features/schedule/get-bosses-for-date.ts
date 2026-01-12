import { BOSSES_SCHEDULE } from "@/constants/bosses-schedule"

export const getBossesForDate = (day: number, month: number): Array<{ name: string; schedule: string }> => {
  const bosses: Array<{ name: string; schedule: string }> = []

  Object.entries(BOSSES_SCHEDULE).forEach(([bossName, schedule]) => {
    const daySchedule = schedule[day as keyof typeof schedule]

    if (daySchedule && daySchedule !== "off" && !daySchedule.toLowerCase().includes("off")) {
      let normalizedSchedule = daySchedule.trim()

      const parts = normalizedSchedule.split(/[-–—]/).map((part) => part.trim())

      if (parts.length === 2) {
        const [startPart, endPart] = parts
        const startHour = startPart.split(":")[0] || startPart
        const startMinute = startPart.split(":")[1] || "00"
        const endHour = endPart.split(":")[0] || endPart
        const endMinute = endPart.split(":")[1] || "00"

        normalizedSchedule = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")} - ${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`
      } else {
        const timeMatch = normalizedSchedule.match(/(\d{1,2}):?(\d{0,2})\s*-\s*(\d{1,2}):?(\d{0,2})/)
        if (timeMatch) {
          normalizedSchedule = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2].padEnd(2, "0")} - ${timeMatch[3].padStart(2, "0")}:${timeMatch[4].padEnd(2, "0")}`
        } else {
          console.warn(`Horario de jefe '${bossName}' no pudo ser normalizado completamente: '${daySchedule}'`)
        }
      }

      bosses.push({
        name: bossName,
        schedule: normalizedSchedule,
      })
    }
  })

  return bosses
}
