"use client"

import type React from "react"

import { useState } from "react"
import { usePdf } from "@/hooks/use-pdf"
import { useSchedule } from "@/hooks/use-schedule"
import { HeaderCard } from "@/components/schedule/header-card"
import { ConfigCard } from "@/components/schedule/config-card"
import { UserScheduleCard } from "@/components/schedule/user-schedule-card"
import { CoincidencesCard } from "@/components/schedule/coincidences-card"

export default function KFCScheduleApp() {
  const { pdfLoaded, error: pdfError } = usePdf()
  const {
    selectedCuil,
    employees,
    currentWeekData,
    currentUser,
    loading,
    error,
    coincidences,
    handleEmployeeChange,
    handleFileUpload,
    clearStoredData,
  } = useSchedule(pdfLoaded)

  const [dayTabs, setDayTabs] = useState<{ [key: string]: "coincidences" | "shifts" }>({})
  const [highlightDay, setHighlightDay] = useState<string | null>(null)

  const scrollToCoincidence = (day: string) => {
    const element = document.getElementById(`coincidence-${day}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.classList.add("ring-4", "ring-blue-500")
      setTimeout(() => {
        element.classList.remove("ring-4", "ring-blue-500")
      }, 2000)
    }
  }

  const handleDayClick = (dayName: string, isRest: boolean) => {
    if (!isRest) {
      scrollToCoincidence(dayName)
      setHighlightDay(dayName)
      setTimeout(() => setHighlightDay(null), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-2 sm:p-4 font-light font-mono">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <HeaderCard navHref="/todos-los-horarios" navLabel="Ver todos los horarios" navVariant="forward" />

        <ConfigCard
          employees={employees}
          selectedCuil={selectedCuil}
          onEmployeeChange={handleEmployeeChange}
          onFileUpload={handleFileUpload}
          onClearData={clearStoredData}
          loading={loading}
          pdfLoaded={pdfLoaded}
          error={error || pdfError}
        />

        {currentWeekData && currentUser && (
          <>
            <UserScheduleCard currentUser={currentUser} highlightDay={highlightDay} onDayClick={handleDayClick} />

            <CoincidencesCard
              currentUser={currentUser}
              currentWeekData={currentWeekData}
              coincidences={coincidences}
              dayTabs={dayTabs}
              setDayTabs={setDayTabs}
              highlightDay={highlightDay}
            />
          </>
        )}
      </div>
    </div>
  )
}
