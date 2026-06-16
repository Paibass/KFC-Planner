"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Moon } from "lucide-react"
import type { Employee } from "@/types/schedule"
import { DAYS, DAY_NAMES } from "@/constants/days"

interface AllSchedulesTableProps {
  employees: Employee[]
}

function isRestValue(value: string): boolean {
  if (!value) return true
  const v = value.toLowerCase().trim()
  return v === "" || v.includes("descanso") || v.includes("off") || v === "-"
}

function getEmployeeTotals(employee: Employee): { totalHours: number; offCount: number } {
  const totalHours = employee.dailySchedules.reduce((sum, day) => sum + day.hours, 0)

  let offCount = 0
  for (const day of DAYS) {
    const value = employee.weeklySchedule[day as keyof typeof employee.weeklySchedule]
    if (isRestValue(value)) offCount++
  }

  return { totalHours: Math.round(totalHours * 10) / 10, offCount }
}

export function AllSchedulesTable({ employees }: AllSchedulesTableProps) {
  const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name, "es"))

  return (
    <Card className="shadow-lg border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl text-red-700 flex items-center gap-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6" />
          Horarios Generales
        </CardTitle>
        <CardDescription className="text-base">
          {sortedEmployees.length} empleados · Lunes a Domingo
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div className="max-h-[70vh] overflow-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-100">
                <th className="sticky left-0 z-30 bg-gray-100 px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap border-b border-gray-200">
                  Apellido y Nombre
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="bg-gray-100 px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap border-b border-gray-200"
                  >
                    {DAY_NAMES[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map((emp, idx) => {
                const { totalHours, offCount } = getEmployeeTotals(emp)
                return (
                  <tr key={emp.cuil} className={idx % 2 === 0 ? "bg-white" : "bg-orange-50/40"}>
                    <td className="sticky left-0 z-10 px-3 py-3 font-semibold text-gray-800 whitespace-nowrap border-b border-gray-100 bg-inherit">
                      <div>{emp.name}</div>
                      <div className="text-xs font-normal text-gray-500">
                        {totalHours}hs | {offCount} off
                      </div>
                    </td>
                    {DAYS.map((day) => {
                      const value = emp.weeklySchedule[day as keyof typeof emp.weeklySchedule]
                      const rest = isRestValue(value)
                      return (
                        <td key={day} className="px-3 py-3 whitespace-nowrap border-b border-gray-100">
                          {rest ? (
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-500 font-medium gap-1 border border-gray-200"
                            >
                              <Moon className="h-3 w-3" />
                              Descanso
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-600 text-white font-medium">{value}</Badge>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
