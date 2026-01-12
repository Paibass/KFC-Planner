import type { DailySchedule } from "@/types/schedule"
import { DAYS } from "@/constants/days"

export const generateWeekDates = (startDate: Date): DailySchedule[] => {
  const dates: DailySchedule[] = []
  const current = new Date(startDate)

  const dayOfWeek = current.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  current.setDate(current.getDate() + daysToMonday)

  console.log(`📅 Generando fechas de semana desde: ${current.toLocaleDateString("es-AR")}`)

  for (let i = 0; i < 7; i++) {
    const dateStr = current.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

    const month = current.getMonth()
    const day = current.getDate()
    const year = current.getFullYear()

    const fortnight = day <= 15 ? 1 : 2

    dates.push({
      date: dateStr,
      dayName: DAYS[i],
      schedule: "",
      hours: 0,
      nightHours: 0,
      month,
      year,
      day,
      fortnight,
    })

    console.log(`  ${DAYS[i]}: ${dateStr} (Mes: ${month + 1}, Quincena: ${fortnight})`)

    current.setDate(current.getDate() + 1)
  }

  return dates
}
