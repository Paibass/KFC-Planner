"use client"

import { useEffect, useState } from "react"
import { HeaderCard } from "@/components/schedule/header-card"
import { AllSchedulesTable } from "@/components/schedule/all-schedules-table"
import { Card, CardContent } from "@/components/ui/card"
import { loadScheduleData } from "@/features/storage/schedule-storage"
import type { Employee } from "@/types/schedule"

export default function AllSchedulesPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null)


  useEffect(() => {
    const data = loadScheduleData()
    if (data && data.currentWeek && data.weeks[data.currentWeek]) {
      const week = data.weeks[data.currentWeek]
      setEmployees(week.employees)
    } else {
      setEmployees([])
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-2 sm:p-4 font-light font-mono">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <HeaderCard navHref="/" navLabel="Volver a mi horario" navVariant="back" />

        {employees === null ? null : employees.length > 0 ? (
          <AllSchedulesTable employees={employees} />
        ) : (
          <Card className="shadow-lg border-orange-200">
            <CardContent className="p-8 text-center text-gray-500">
              <p className="text-base sm:text-lg">
                No hay horarios cargados todavía. Volvé a la pantalla principal y cargá un PDF.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
