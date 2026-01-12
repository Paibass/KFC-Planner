"use client"

import { useState, useEffect } from "react"
import type { WeeklyHourTracker } from "@/types/schedule"
import {
  loadHourTracker,
  saveHourTracker,
  clearHourTracker,
  getEmptyHourTracker,
} from "@/features/storage/hour-tracker-storage"

export const useHourTracker = () => {
  const [weeklyHourTracker, setWeeklyHourTracker] = useState<WeeklyHourTracker>(getEmptyHourTracker())

  useEffect(() => {
    const tracker = loadHourTracker()
    if (tracker) {
      setWeeklyHourTracker(tracker)
    }
  }, [])

  useEffect(() => {
    saveHourTracker(weeklyHourTracker)
  }, [weeklyHourTracker])

  const calculateActualHours = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0

    const [inHour, inMinute] = checkIn.split(":").map(Number)
    const [outHour, outMinute] = checkOut.split(":").map(Number)

    if (isNaN(inHour) || isNaN(inMinute) || isNaN(outHour) || isNaN(outMinute)) return 0

    const inMinutes = inHour * 60 + inMinute
    let outMinutes = outHour * 60 + outMinute

    if (outMinutes < inMinutes) {
      outMinutes += 24 * 60
    }

    const totalMinutes = outMinutes - inMinutes
    return Math.round((totalMinutes / 60) * 100) / 100
  }

  const updateActualHours = (day: string, checkIn: string, checkOut: string) => {
    const totalHours = calculateActualHours(checkIn, checkOut)

    setWeeklyHourTracker((prev) => {
      const newActual = {
        ...prev.actual,
        [day]: {
          checkIn,
          checkOut,
          totalHours,
        },
      }

      return {
        ...prev,
        actual: newActual,
        totalActual: prev.totalActual - (prev.actual[day]?.totalHours || 0) + totalHours,
      }
    })
  }

  const addPlannedHours = () => {
    setWeeklyHourTracker((prev) => ({
      ...prev,
      totalPlanned: prev.totalPlanned + prev.planned,
    }))
  }

  const updatePlannedHours = (hours: number) => {
    setWeeklyHourTracker((prev) => ({
      ...prev,
      planned: hours,
    }))
  }

  const resetFortnightTracker = () => {
    if (confirm("¿Estás seguro de que deseas reiniciar el contador de quincena?")) {
      setWeeklyHourTracker(getEmptyHourTracker())
      clearHourTracker()
    }
  }

  const resetWeeklyInputs = () => {
    setWeeklyHourTracker((prev) => ({
      ...prev,
      planned: 0,
      actual: {},
    }))
  }

  return {
    weeklyHourTracker,
    updateActualHours,
    addPlannedHours,
    updatePlannedHours,
    resetFortnightTracker,
    resetWeeklyInputs,
  }
}
