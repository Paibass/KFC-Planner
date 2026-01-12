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
import { loadCuil, saveCuil } from "@/features/storage/cuil-storage"
import { findCoincidences } from "@/features/schedule/find-coincidences"
import { parsePDF } from "@/features/pdf/parse-pdf-text"
import { detectWeekInfo } from "@/features/pdf/detect-week-info"
import { parseEmployeesFromText } from "@/features/employees/parse-employees-from-text"
import { calculateUserStatsWithDates } from "@/features/schedule/calculate-user-stats-with-dates"
import { processFortnightsWithDates } from "@/features/schedule/process-fortnights-with-dates"

export const useSchedule = (pdfLoaded: boolean) => {
  const [cuilInput, setCuilInput] = useState("")
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
    const savedCuil = loadCuil()
    if (savedCuil) {
      setCuilInput(savedCuil)
    }
  }, [])

  useEffect(() => {
    if (cuilInput) {
      saveCuil(cuilInput)
    }
  }, [cuilInput])

  useEffect(() => {
    if (currentWeekData && cuilInput) {
      findCurrentUser()
    }
  }, [cuilInput, currentWeekData])

  const formatCUIL = (value: string): string => {
    if (!value) return ""
    const numbers = value.replace(/\D/g, "")
    const limited = numbers.slice(0, 11)
    if (limited.length >= 10) {
      return `${limited.slice(0, 2)}-${limited.slice(2, 10)}-${limited.slice(10)}`
    } else if (limited.length >= 2) {
      return `${limited.slice(0, 2)}-${limited.slice(2)}`
    }
    return limited
  }

  const getFormattedCUIL = (): string => {
    return formatCUIL(cuilInput)
  }

  const handleCuilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCUIL(e.target.value)
    setCuilInput(formatted)
  }

  const findCurrentUser = useCallback(() => {
    if (!currentWeekData) return

    const formattedCuil = getFormattedCUIL()
    if (!formattedCuil || formattedCuil.length < 11) return

    console.log(`Buscando usuario con CUIL: ${formattedCuil}`)

    const user = currentWeekData.employees.find((emp) => {
      const empCuilClean = emp.cuil.replace(/-/g, "")
      const searchCuilClean = formattedCuil.replace(/-/g, "")
      return emp.cuil === formattedCuil || empCuilClean === searchCuilClean
    })

    if (user) {
      console.log(`✅ Usuario encontrado: ${user.name}`)
      setCurrentUser(user)
      const userCoincidences = findCoincidences(user, currentWeekData.employees)
      setCoincidences(userCoincidences)
      setError("")
    } else if (currentWeekData.employees.length > 0) {
      console.log(`❌ No se encontró usuario con CUIL: ${formattedCuil}`)
      setError(`No se encontró ningún empleado con CUIL: ${formattedCuil}`)
      setCurrentUser(null)
      setCoincidences({})
    }
  }, [currentWeekData, cuilInput])

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
      console.log("🔄 Procesando PDF con nueva lógica de fechas...")
      const rawText = await parsePDF(file)
      const weekInfo = detectWeekInfo(rawText)

      console.log(`📅 Semana detectada: ${weekInfo.period}`)
      console.log(`📅 Fecha inicio: ${weekInfo.startDate.toLocaleDateString("es-AR")}`)
      console.log(`📅 Fecha fin: ${weekInfo.endDate.toLocaleDateString("es-AR")}`)

      const parsedEmployees = parseEmployeesFromText(rawText, weekInfo.startDate)

      if (parsedEmployees.length === 0) {
        setError("No se pudieron extraer empleados del PDF. Verifica que el formato sea correcto.")
        return
      }

      const weekId = `${weekInfo.startDate.getFullYear()}-${String(weekInfo.startDate.getMonth() + 1).padStart(2, "0")}-${String(weekInfo.startDate.getDate()).padStart(2, "0")}_${String(weekInfo.endDate.getDate()).padStart(2, "0")}`

      console.log(`📝 Guardando semana con ID: ${weekId}`)

      let userStats:
        | {
            totalHours: number
            nightHours: number
            daysWorked: number
            dailyBreakdown: DailySchedule[]
          }
        | undefined

      const formattedCuil = getFormattedCUIL()
      if (formattedCuil) {
        const user = parsedEmployees.find(
          (emp) => emp.cuil === formattedCuil || emp.cuil.replace(/-/g, "") === formattedCuil.replace(/-/g, ""),
        )
        if (user) {
          userStats = calculateUserStatsWithDates(user)
          console.log(`👤 Usuario encontrado: ${user.name}`)
          console.log(
            `📊 Horarios:`,
            user.dailySchedules.map((d) => `${d.dayName}: ${d.schedule}`),
          )
        } else {
          console.log(`⚠️ Usuario con CUIL ${formattedCuil} no encontrado`)
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

      console.log(`✅ Semana procesada con fechas reales. Total: ${Object.keys(updatedData.weeks).length} semanas`)
      console.log(`📊 Quincenas: ${Object.keys(updatedData.fortnights).length}`)
      console.log(`📅 Meses: ${Object.keys(updatedData.months || {}).length}`)

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
    setStoredData(getEmptyStoredData())
    setCurrentWeekData(null)
    setCurrentUser(null)
    setCoincidences({})
    setError("")
  }

  return {
    cuilInput,
    setCuilInput,
    currentWeekData,
    currentUser,
    loading,
    error,
    setError,
    coincidences,
    storedData,
    handleCuilChange,
    handleFileUpload,
    clearStoredData: clearStoredDataHandler,
    getFormattedCUIL,
  }
}
