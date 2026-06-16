"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Employee } from "@/types/schedule"
import { Clock, Moon, AlarmClockOff } from "lucide-react"

interface WeeklySummaryCardProps {
  currentUser: Employee
}

function isRest(schedule: string): boolean {
  if (!schedule) return true
  const v = schedule.toLowerCase().trim()
  return v === "" || v.includes("descanso") || v.includes("off") || v === "-"
}

function formatHoursMinutes(value: number): string {
  const totalMinutes = Math.round(value * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function WeeklySummaryCard({ currentUser }: WeeklySummaryCardProps) {
  const totalHours = currentUser.dailySchedules.reduce((sum, day) => sum + day.hours, 0)
  const nightHours = currentUser.dailySchedules.reduce((sum, day) => sum + day.nightHours, 0)
  const restCount = currentUser.dailySchedules.filter((day) => isRest(day.schedule)).length

  const stats = [
    {
      label: "Horas totales",
      value: formatHoursMinutes(totalHours),
      icon: Clock,
      iconClass: "text-blue-600",
      bgClass: "bg-blue-50 border-blue-200",
    },
    {
      label: "Descansos",
      value: `${restCount} ${restCount === 1 ? "día" : "días"}`,
      icon: AlarmClockOff ,
      iconClass: "text-gray-600",
      bgClass: "bg-gray-50 border-gray-200",
    },
    {
      label: "Horas nocturnas",
      value: formatHoursMinutes(nightHours),
      icon: Moon,
      iconClass: "text-indigo-600",
      bgClass: "bg-indigo-50 border-indigo-200",
    },
  ]

  return (
    <Card className="shadow-lg border-green-200">
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4">Resumen semanal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={`flex items-center gap-3 rounded-xl border-2 p-3 sm:p-4 ${stat.bgClass}`}
              >
                <Icon className={`h-6 w-6 shrink-0 ${stat.iconClass}`} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">{stat.label}</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-800">{stat.value}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
