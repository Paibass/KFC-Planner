import type { Employee } from "@/types/schedule"
import { DAYS } from "@/constants/days"
import { parseTimeRange } from "@/features/employees/parse-time-range"
import { timesOverlap } from "./times-overlap"

export const findCoincidences = (user: Employee, allEmployees: Employee[]): { [key: string]: Employee[] } => {
  const result: { [key: string]: Employee[] } = {}

  DAYS.forEach((day) => {
    const userTime = parseTimeRange(user.weeklySchedule[day as keyof typeof user.weeklySchedule])
    if (!userTime) {
      result[day] = []
      return
    }

    const matches = allEmployees.filter((emp) => {
      if (emp.cuil === user.cuil) return false

      const empTime = parseTimeRange(emp.weeklySchedule[day as keyof typeof emp.weeklySchedule])
      if (!empTime) return false

      return timesOverlap(userTime, empTime)
    })

    result[day] = matches
  })

  return result
}
