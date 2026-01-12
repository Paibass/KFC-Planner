import type { StoredData } from "@/types/schedule"

const STORAGE_KEY = "kfc-schedule-data"

export const loadScheduleData = (): StoredData | null => {
  try {
    const storedDataStr = localStorage.getItem(STORAGE_KEY)
    if (storedDataStr) {
      console.log("Cargando datos del localStorage...")
      const data: StoredData = JSON.parse(storedDataStr)

      Object.values(data.weeks).forEach((week) => {
        week.startDate = new Date(week.startDate)
        week.endDate = new Date(week.endDate)
      })

      console.log(
        `Datos cargados: ${Object.keys(data.weeks).length} semanas, ${Object.keys(data.fortnights).length} quincenas, ${Object.keys(data.months || {}).length} meses`,
      )

      return data
    }
    return null
  } catch (error) {
    console.error("Error al cargar datos del localStorage:", error)
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export const saveScheduleData = (data: StoredData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    console.log("Datos guardados en localStorage")
  } catch (error) {
    console.error("Error al guardar en localStorage:", error)
  }
}

export const clearScheduleData = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}

export const getEmptyStoredData = (): StoredData => ({
  weeks: {},
  fortnights: {},
  months: {},
  currentWeek: null,
  loadedAt: new Date().toISOString(),
})
