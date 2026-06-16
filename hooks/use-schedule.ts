"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import type { WeekData, Employee, StoredData, DailySchedule } from "@/types/schedule"
import {
  loadScheduleData,
  saveScheduleData,
  clearScheduleData,
  getEmptyStoredData,
} from "@/features/storage/schedule-storage"
import {
  loadSelectedEmployee,
  saveSelectedEmployee,
  clearSelectedEmployee,
} from "@/features/storage/selected-employee-storage"
import { findCoincidences } from "@/features/schedule/find-coincidences"
import { parsePDF } from "@/features/pdf/parse-pdf-text"
import { detectWeekInfo } from "@/features/pdf/detect-week-info"
import { parseEmployeesFromText } from "@/features/employees/parse-employees-from-text"
import { calculateUserStatsWithDates } from "@/features/schedule/calculate-user-stats-with-dates"
import { processFortnightsWithDates } from "@/features/schedule/process-fortnights-with-dates"

export const useSchedule = (pdfLoaded: boolean) => {
  const [selectedCuil, setSelectedCuil] = useState("")
  const [currentWeekData, setCurrentWeekData] = useState<WeekData | null>(null)
  const [currentUser, setCurrentUser] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [coincidences, setCoincidences] = useState<{ [key: string]: Employee[] }>({})
  const [storedData, setStoredData] = useState<StoredData>(getEmptyStoredData())

  useEffect(() => {
    const data = loadScheduleData()
    if (data) {
      setStoredData(data)
      if (data.currentWeek && data.weeks[data.currentWeek]) {
        setCurrentWeekData(data.weeks[data.currentWeek])
      }
    }
  }, [])

  useEffect(() => {
    const saved = loadSelectedEmployee()
    if (saved) {
      setSelectedCuil(saved)
    }
  }, [])

  // Once we have both a week and a selected employee, resolve the user.
  useEffect(() => {
    if (!currentWeekData) return

    if (!selectedCuil) {
      setCurrentUser(null)
      setCoincidences({})
      setError("")
      return
    }

    const user = currentWeekData.employees.find((emp) => emp.cuil === selectedCuil)

    if (user) {
      setCurrentUser(user)
      setCoincidences(findCoincidences(user, currentWeekData.employees))
      setError("")
    } else if (currentWeekData.employees.length > 0) {
      // The previously saved employee no longer exists in this PDF.
      setCurrentUser(null)
      setCoincidences({})
      setError("El empleado guardado ya no existe en este PDF. Por favor seleccioná otro.")
    }
  }, [selectedCuil, currentWeekData])

  const handleEmployeeChange = useCallback((cuil: string) => {
    setSelectedCuil(cuil)
    saveSelectedEmployee(cuil)
    setError("")
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== "application/pdf") {
      setError("Por favor selecciona un archivo PDF válido")
      return
    }

    if (!pdfLoaded) {
      setError("PDF.js aún se está cargando. Espera un momento e intenta de nuevo.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const rawText = await parsePDF(file)
      const weekInfo = detectWeekInfo(rawText)

      const parsedEmployees = parseEmployeesFromText(rawText, weekInfo.startDate)

      if (parsedEmployees.length === 0) {
        setError("No se pudieron extraer empleados del PDF. Verifica que el formato sea correcto.")
        return
      }

      const weekId = `${weekInfo.startDate.getFullYear()}-${String(weekInfo.startDate.getMonth() + 1).padStart(2, "0")}-${String(weekInfo.startDate.getDate()).padStart(2, "0")}_${String(weekInfo.endDate.getDate()).padStart(2, "0")}`

      let userStats:
        | {
            totalHours: number
            nightHours: number
            daysWorked: number
            dailyBreakdown: DailySchedule[]
          }
        | undefined

      if (selectedCuil) {
        const user = parsedEmployees.find((emp) => emp.cuil === selectedCuil)
        if (user) {
          userStats = calculateUserStatsWithDates(user)
        }
      }

      const weekData: WeekData = {
        id: weekId,
        weekNumber: Math.ceil(
          ((weekInfo.startDate.getTime() - new Date(weekInfo.startDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) /
            7,
        ),
        year: weekInfo.startDate.getFullYear(),
        startDate: weekInfo.startDate,
        endDate: weekInfo.endDate,
        period: weekInfo.period,
        employees: parsedEmployees,
        userStats,
        loadedAt: new Date().toISOString(),
      }

      let updatedData: StoredData = {
        ...storedData,
        weeks: {
          ...storedData.weeks,
          [weekId]: weekData,
        },
        currentWeek: weekId,
        loadedAt: new Date().toISOString(),
      }

      updatedData = processFortnightsWithDates(updatedData)

      setStoredData(updatedData)
      setCurrentWeekData(weekData)
      saveScheduleData(updatedData)

      return true
    } catch (err: any) {
      setError(`Error al procesar el PDF: ${err.message}`)
      console.error("Error:", err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const clearStoredDataHandler = () => {
    clearScheduleData()
    clearSelectedEmployee()
    setStoredData(getEmptyStoredData())
    setCurrentWeekData(null)
    setCurrentUser(null)
    setSelectedCuil("")
    setCoincidences({})
    setError("")
  }

  return {
    selectedCuil,
    employees: currentWeekData?.employees ?? [],
    currentWeekData,
    currentUser,
    loading,
    error,
    setError,
    coincidences,
    storedData,
    handleEmployeeChange,
    handleFileUpload,
    clearStoredData: clearStoredDataHandler,
  }
}
