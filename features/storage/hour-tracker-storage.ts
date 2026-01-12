import type { WeeklyHourTracker } from "@/types/schedule"

const STORAGE_KEY = "kfc-hour-tracker"

export const loadHourTracker = (): WeeklyHourTracker | null => {
  try {
    const savedTracker = localStorage.getItem(STORAGE_KEY)
    if (savedTracker) {
      const tracker: WeeklyHourTracker = JSON.parse(savedTracker)
      console.log("📊 Contador de horas cargado desde localStorage")
      return tracker
    }
    return null
  } catch (error) {
    console.error("Error al cargar contador de horas:", error)
    return null
  }
}

export const saveHourTracker = (tracker: WeeklyHourTracker): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker))
}

export const clearHourTracker = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}

export const getEmptyHourTracker = (): WeeklyHourTracker => ({
  planned: 0,
  actual: {},
  totalPlanned: 0,
  totalActual: 0,
})
