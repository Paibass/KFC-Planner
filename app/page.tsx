"use client"

import type React from "react"

import { useState } from "react"
import { usePdf } from "@/hooks/use-pdf"
import { useSchedule } from "@/hooks/use-schedule"
import { useHourTracker } from "@/hooks/use-hour-tracker"
import { HeaderCard } from "@/components/schedule/header-card"
import { ConfigCard } from "@/components/schedule/config-card"
import { SummaryCard } from "@/components/schedule/summary-card"
import { UserScheduleCard } from "@/components/schedule/user-schedule-card"
import { HourTrackerCard } from "@/components/schedule/hour-tracker-card"
import { CoincidencesCard } from "@/components/schedule/coincidences-card"

export default function KFCScheduleApp() {
  const { pdfLoaded, error: pdfError } = usePdf()
  const {
    cuilInput,
    currentWeekData,
    currentUser,
    loading,
    error,
    coincidences,
    handleCuilChange,
    handleFileUpload,
    clearStoredData,
  } = useSchedule(pdfLoaded)

  const {
    weeklyHourTracker,
    updateActualHours,
    addPlannedHours,
    updatePlannedHours,
    resetFortnightTracker,
    resetWeeklyInputs,
  } = useHourTracker()

  const [dayTabs, setDayTabs] = useState<{ [key: string]: "coincidences" | "shifts" }>({})
  const [hourTrackerTab, setHourTrackerTab] = useState<"planned" | "actual">("planned")
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

  const handleFileUploadWithReset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const success = await handleFileUpload(event)
    if (success) {
      resetWeeklyInputs()
    }
  }

  const handleClearAllData = () => {
    clearStoredData()
    resetFortnightTracker()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-2 sm:p-4 font-light font-mono">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <HeaderCard />

        <ConfigCard
          cuilInput={cuilInput}
          onCuilChange={handleCuilChange}
          onFileUpload={handleFileUploadWithReset}
          onClearData={handleClearAllData}
          loading={loading}
          pdfLoaded={pdfLoaded}
          error={error || pdfError}
        />

        {currentWeekData && currentUser && (
          <>
            <SummaryCard currentWeekData={currentWeekData} />

            <UserScheduleCard currentUser={currentUser} highlightDay={highlightDay} onDayClick={handleDayClick} />

            <HourTrackerCard
              currentUser={currentUser}
              weeklyHourTracker={weeklyHourTracker}
              hourTrackerTab={hourTrackerTab}
              setHourTrackerTab={setHourTrackerTab}
              onUpdatePlannedHours={updatePlannedHours}
              onAddPlannedHours={addPlannedHours}
              onUpdateActualHours={updateActualHours}
              onResetFortnightTracker={resetFortnightTracker}
            />

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
