import type { Employee, DailySchedule } from "@/types/schedule"

export const calculateUserStatsWithDates = (
  employee: Employee,
): {
  totalHours: number
  nightHours: number
  daysWorked: number
  dailyBreakdown: DailySchedule[]
} => {
  console.log(`\n=== Calculando estadísticas con fechas para ${employee.name} ===`)

  const dailyBreakdown = employee.dailySchedules.filter((day) => day.hours > 0)
  const totalHours = employee.dailySchedules.reduce((sum, day) => sum + day.hours, 0)
  const nightHours = employee.dailySchedules.reduce((sum, day) => sum + day.nightHours, 0)
  const daysWorked = dailyBreakdown.length

  console.log(`Días trabajados: ${daysWorked}`)
  console.log(`Horas totales: ${totalHours}h`)
  console.log(`Horas nocturnas: ${nightHours}h`)
  console.log(`Desglose por fecha:`)
  dailyBreakdown.forEach((day) => {
    console.log(`  ${day.date} (${day.dayName}): ${day.schedule} - ${day.hours}h (${day.nightHours}h nocturnas)`)
  })

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    nightHours: Math.round(nightHours * 10) / 10,
    daysWorked,
    dailyBreakdown,
  }
}
