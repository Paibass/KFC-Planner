"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Employee } from "@/types/schedule"
import { DAY_NAMES } from "@/constants/days"

interface UserScheduleCardProps {
  currentUser: Employee
  highlightDay: string | null
  onDayClick: (dayName: string, isRest: boolean) => void
}

export function UserScheduleCard({ currentUser, highlightDay, onDayClick }: UserScheduleCardProps) {
  return (
    <Card className="shadow-lg border-green-200">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl text-green-700 flex items-center gap-2">
          👤 <span className="truncate">{currentUser.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:pt-6">
        <div className="space-y-3 sm:space-y-4">
          {currentUser.dailySchedules.map((daySchedule) => {
            const isRest = daySchedule.schedule.toLowerCase().includes("descanso")

            return (
              <div
                key={daySchedule.date}
                onClick={() => onDayClick(daySchedule.dayName, isRest)}
                className={`flex justify-between items-center p-3 sm:p-4 rounded-xl transition-all ${
                  isRest
                    ? "bg-gray-100 border-2 border-gray-200"
                    : "bg-blue-50 border-2 border-blue-200 cursor-pointer hover:bg-blue-100 hover:border-blue-300 hover:shadow-md"
                } ${highlightDay === daySchedule.dayName ? "ring-2 ring-blue-400 shadow-lg" : ""}`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-base sm:text-lg text-gray-700">
                    {isRest ? "😴" : "💼"} {DAY_NAMES[daySchedule.dayName as keyof typeof DAY_NAMES]}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={isRest ? "secondary" : "default"}
                    className={`text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2 ${
                      isRest ? "bg-gray-200 text-gray-700" : "bg-blue-600 text-white"
                    }`}
                  >
                    {isRest ? "😴 Descanso" : `⏰ ${daySchedule.schedule}`}
                  </Badge>
                  {!isRest && (
                    <div className="text-xs text-gray-500">
                      ⏱️ {daySchedule.hours}h {daySchedule.nightHours > 0 && `(🌙 ${daySchedule.nightHours}h nocturnas)`}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
