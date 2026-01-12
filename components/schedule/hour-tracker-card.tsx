"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, RefreshCw } from "lucide-react"
import type { Employee, WeeklyHourTracker } from "@/types/schedule"
import { DAYS, DAY_NAMES } from "@/constants/days"

interface HourTrackerCardProps {
  currentUser: Employee
  weeklyHourTracker: WeeklyHourTracker
  hourTrackerTab: "planned" | "actual"
  setHourTrackerTab: (tab: "planned" | "actual") => void
  onUpdatePlannedHours: (hours: number) => void
  onAddPlannedHours: () => void
  onUpdateActualHours: (day: string, checkIn: string, checkOut: string) => void
  onResetFortnightTracker: () => void
}

export function HourTrackerCard({
  currentUser,
  weeklyHourTracker,
  hourTrackerTab,
  setHourTrackerTab,
  onUpdatePlannedHours,
  onAddPlannedHours,
  onUpdateActualHours,
  onResetFortnightTracker,
}: HourTrackerCardProps) {
  return (
    <Card className="shadow-lg border-indigo-200">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl text-indigo-700 flex items-center gap-2">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
          Contador de Horas Quincenal
        </CardTitle>
        <CardDescription className="text-base sm:text-lg">Control de horas previstas vs reales</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:pt-6">
        <Tabs value={hourTrackerTab} onValueChange={(v) => setHourTrackerTab(v as "planned" | "actual")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="planned" className="text-xs sm:text-sm">
              📋 Horas Previstas
            </TabsTrigger>
            <TabsTrigger value="actual" className="text-xs sm:text-sm">
              ✅ Horas Reales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="planned" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="planned-hours" className="text-base font-semibold text-gray-700">
                📝 Horas de esta semana
              </Label>
              <Input
                id="planned-hours"
                type="number"
                placeholder="Ej: 19.5"
                value={weeklyHourTracker.planned || ""}
                onChange={(e) => onUpdatePlannedHours(Number(e.target.value))}
                className="text-lg h-12 border-2 border-indigo-200 focus:border-indigo-400"
                step="0.5"
                min="0"
              />
              <Button
                onClick={onAddPlannedHours}
                disabled={weeklyHourTracker.planned <= 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                ➕ Sumar al Total Quincenal
              </Button>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 text-center">
                <div className="text-sm text-indigo-600 mb-1">📊 Acumulado quincenal</div>
                <div className="text-2xl font-bold text-indigo-700">{weeklyHourTracker.totalPlanned}h</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actual" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">⏰ Ingresa la hora de entrada y salida para cada día</p>
              {DAYS.map((day) => {
                const daySchedule = currentUser.dailySchedules.find((d) => d.dayName === day)
                const isRest = daySchedule?.schedule.toLowerCase().includes("descanso")
                const actualEntry = weeklyHourTracker.actual[day]

                if (isRest) return null

                return (
                  <div key={day} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-700 mb-3">📅{DAY_NAMES[day as keyof typeof DAY_NAMES]}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${day}-in`} className="text-sm text-gray-600">
                          🟢 Entrada
                        </Label>
                        <Input
                          id={`${day}-in`}
                          type="time"
                          value={actualEntry?.checkIn || ""}
                          onChange={(e) => onUpdateActualHours(day, e.target.value, actualEntry?.checkOut || "")}
                          className="h-10 border-indigo-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${day}-out`} className="text-sm text-gray-600">
                          🔴 Salida
                        </Label>
                        <Input
                          id={`${day}-out`}
                          type="time"
                          value={actualEntry?.checkOut || ""}
                          onChange={(e) => onUpdateActualHours(day, actualEntry?.checkIn || "", e.target.value)}
                          className="h-10 border-indigo-200"
                        />
                      </div>
                    </div>
                    {actualEntry && actualEntry.totalHours > 0 && (
                      <div className="mt-2 text-sm text-green-600 font-medium">✅ Total: {actualEntry.totalHours}h</div>
                    )}
                  </div>
                )
              })}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                <div className="text-sm text-green-600 mb-1">📊 Acumulado quincenal</div>
                <div className="text-2xl font-bold text-green-700">{weeklyHourTracker.totalActual.toFixed(2)}h</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {weeklyHourTracker.totalPlanned > 0 && weeklyHourTracker.totalActual > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
            <div className="text-lg font-bold text-yellow-700">
              📊 Diferencia: {Math.abs(weeklyHourTracker.totalActual - weeklyHourTracker.totalPlanned).toFixed(2)}h
            </div>
            <div className="text-sm text-yellow-600">
              {weeklyHourTracker.totalActual > weeklyHourTracker.totalPlanned
                ? "⬆️ Has trabajado más horas de las previstas"
                : weeklyHourTracker.totalActual < weeklyHourTracker.totalPlanned
                  ? "⬇️ Has trabajado menos horas de las previstas"
                  : "✅ Has trabajado exactamente las horas previstas"}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button
            onClick={onResetFortnightTracker}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Nueva Quincena
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
