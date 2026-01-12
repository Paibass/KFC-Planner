"use client"

import type React from "react"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users } from "lucide-react"
import type { Employee, WeekData } from "@/types/schedule"
import { DAY_NAMES } from "@/constants/days"
import { getBossesForDate } from "@/features/schedule/get-bosses-for-date"
import { findShiftChanges } from "@/features/schedule/find-shift-changes"

interface CoincidencesCardProps {
  currentUser: Employee
  currentWeekData: WeekData
  coincidences: { [key: string]: Employee[] }
  dayTabs: { [key: string]: "coincidences" | "shifts" }
  setDayTabs: React.Dispatch<React.SetStateAction<{ [key: string]: "coincidences" | "shifts" }>>
  highlightDay: string | null
}

export function CoincidencesCard({
  currentUser,
  currentWeekData,
  coincidences,
  dayTabs,
  setDayTabs,
  highlightDay,
}: CoincidencesCardProps) {
  return (
    <Card className="shadow-lg border-green-200">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl text-green-700 flex items-center gap-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6" />
          Coincidencias y Pases
        </CardTitle>
        <CardDescription className="text-base sm:text-lg">
          Compañeros que trabajan contigo y posibles pases
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:pt-6">
        <div className="space-y-4 sm:space-y-6">
          {currentUser.dailySchedules
            .filter((daySchedule) => !daySchedule.schedule.toLowerCase().includes("descanso"))
            .map((daySchedule) => {
              const dayCoincidences = coincidences[daySchedule.dayName] || []
              const shifts = findShiftChanges(daySchedule.dayName, currentUser, currentWeekData.employees)
              const bossesForDay = getBossesForDate(daySchedule.day, daySchedule.month + 1)
              const activeTab = dayTabs[daySchedule.dayName] || "coincidences"

              return (
                <div
                  key={daySchedule.date}
                  id={`coincidence-${daySchedule.dayName}`}
                  className={`scroll-mt-4 p-4 sm:p-6 rounded-xl border-2 transition-all ${
                    highlightDay === daySchedule.dayName
                      ? "border-blue-500 ring-4 ring-blue-300"
                      : "border-green-200 bg-green-50"
                  }`}
                >
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-green-700">
                        📅 {DAY_NAMES[daySchedule.dayName as keyof typeof DAY_NAMES]}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-sm sm:text-base bg-green-100 text-green-700 border-green-300 w-fit"
                      >
                        ⏰ {daySchedule.schedule}
                      </Badge>
                    </div>

                    {bossesForDay.length > 0 ? (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          👔 Lideres en turno
                        </div>
                        <div className="space-y-1">
                          {bossesForDay.map((boss, idx) => (
                            <div key={idx} className="text-sm text-gray-700">
                              • {boss.name} – {boss.schedule}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500">Sin jefe asignado</div>
                      </div>
                    )}
                  </div>

                  <Tabs
                    value={activeTab}
                    onValueChange={(value) =>
                      setDayTabs((prev) => ({
                        ...prev,
                        [daySchedule.dayName]: value as "coincidences" | "shifts",
                      }))
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="coincidences" className="text-xs sm:text-sm">
                        👥 Coincidencias ({dayCoincidences.length})
                      </TabsTrigger>
                      <TabsTrigger value="shifts" className="text-xs sm:text-sm">
                        🔄 Pases ({shifts.canCoverMe.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="coincidences">
                      {dayCoincidences.length > 0 ? (
                        <div className="space-y-3">
                          {dayCoincidences.map((emp) => (
                            <div
                              key={emp.cuil}
                              className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-green-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="font-semibold text-base sm:text-lg text-gray-800">👤 {emp.name}</div>
                                <Badge className="bg-blue-600 text-white text-sm sm:text-base w-fit">
                                  ⏰ {emp.weeklySchedule[daySchedule.dayName as keyof typeof emp.weeklySchedule]}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-6 sm:p-8 text-gray-500 bg-gray-50 rounded-lg">
                          <p className="text-base sm:text-lg">😴 No hay coincidencias este día</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="shifts">
                      {shifts.canCoverMe.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 mb-3">🔄 Teams con los que te cruzas</p>
                          {shifts.canCoverMe.map((emp) => (
                            <div
                              key={emp.cuil}
                              className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="font-semibold text-base sm:text-lg text-gray-800">👤 {emp.name}</div>
                                <Badge className="bg-blue-600 text-white text-sm sm:text-base w-fit">
                                  ⏰ {emp.weeklySchedule[daySchedule.dayName as keyof typeof emp.weeklySchedule]}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-6 sm:p-8 text-gray-500 bg-gray-50 rounded-lg">
                          <p className="text-base sm:text-lg">🔒 No hay pases disponibles este día</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )
            })}
        </div>
      </CardContent>
    </Card>
  )
}
