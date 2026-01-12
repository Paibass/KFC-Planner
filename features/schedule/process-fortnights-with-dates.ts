import type { StoredData, FortnightData, MonthData } from "@/types/schedule"
import { MONTH_NAMES } from "@/constants/months"

export const processFortnightsWithDates = (updatedData: StoredData): StoredData => {
  console.log("\n=== PROCESANDO QUINCENAS CON FECHAS REALES ===")

  const newFortnights: { [key: string]: FortnightData } = {}
  const newMonths: { [key: string]: MonthData } = {}

  const fortnightGroups: { [key: string]: any[] } = {}
  const monthGroups: { [key: string]: any[] } = {}

  Object.values(updatedData.weeks).forEach((week) => {
    if (week.userStats?.dailyBreakdown) {
      week.userStats.dailyBreakdown.forEach((day) => {
        const fortnightKey = `${day.year}-${day.month}-${day.fortnight}`
        if (!fortnightGroups[fortnightKey]) {
          fortnightGroups[fortnightKey] = []
        }
        fortnightGroups[fortnightKey].push(day)

        const monthKey = `${day.year}-${day.month}`
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = []
        }
        monthGroups[monthKey].push(day)
      })
    }
  })

  Object.entries(fortnightGroups).forEach(([fortnightKey, days]) => {
    const [year, month, fortnightNumber] = fortnightKey.split("-").map(Number)

    const totalHours = days.reduce((sum, day) => sum + day.hours, 0)
    const totalNightHours = days.reduce((sum, day) => sum + day.nightHours, 0)
    const totalDaysWorked = days.length

    const expectedDays = fortnightNumber === 1 ? 15 : new Date(year, month + 1, 0).getDate() - 15
    const completionPercentage = (days.length / Math.min(expectedDays, 15)) * 100

    if (completionPercentage >= 60) {
      const fortnightData: FortnightData = {
        id: fortnightKey,
        year,
        month,
        fortnightNumber,
        weeks: [],
        totalHours: Math.round(totalHours * 10) / 10,
        totalNightHours: Math.round(totalNightHours * 10) / 10,
        totalDaysWorked,
        period: `${fortnightNumber === 1 ? "Primera" : "Segunda"} quincena de ${MONTH_NAMES[month]} ${year}`,
        completedAt: new Date().toISOString(),
        dailyBreakdown: days.sort(
          (a, b) =>
            new Date(a.date.split("/").reverse().join("-")).getTime() -
            new Date(b.date.split("/").reverse().join("-")).getTime(),
        ),
      }

      newFortnights[fortnightKey] = fortnightData
      console.log(`✅ Quincena completa: ${fortnightData.period} (${totalDaysWorked} días, ${totalHours}h)`)
    } else {
      console.log(
        `⏳ Quincena incompleta: ${MONTH_NAMES[month]} ${year} Q${fortnightNumber} (${days.length} días, ${completionPercentage.toFixed(1)}% completa)`,
      )
    }
  })

  Object.entries(monthGroups).forEach(([monthKey, days]) => {
    const [year, month] = monthKey.split("-").map(Number)

    const totalHours = days.reduce((sum, day) => sum + day.hours, 0)
    const totalNightHours = days.reduce((sum, day) => sum + day.nightHours, 0)
    const totalDaysWorked = days.length

    const monthData: MonthData = {
      id: monthKey,
      year,
      month,
      totalHours: Math.round(totalHours * 10) / 10,
      totalNightHours: Math.round(totalNightHours * 10) / 10,
      totalDaysWorked,
      period: `${MONTH_NAMES[month]} ${year}`,
      fortnights: Object.keys(newFortnights).filter((key) => key.startsWith(`${year}-${month}-`)),
      dailyBreakdown: days.sort(
        (a, b) =>
          new Date(a.date.split("/").reverse().join("-")).getTime() -
          new Date(b.date.split("/").reverse().join("-")).getTime(),
      ),
    }

    newMonths[monthKey] = monthData
    console.log(`📅 Mes procesado: ${monthData.period} (${totalDaysWorked} días, ${totalHours}h)`)
  })

  return {
    ...updatedData,
    fortnights: newFortnights,
    months: newMonths,
  }
}
