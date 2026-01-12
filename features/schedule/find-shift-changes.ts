import type { Employee } from "@/types/schedule"
import { parseTimeRange } from "@/features/employees/parse-time-range"

export const findShiftChanges = (
  dayName: string,
  currentUser: Employee | null,
  allEmployees: Employee[],
): { canCoverMe: Employee[] } => {
  const canCoverMe: Employee[] = []

  if (!currentUser) return { canCoverMe }

  const userSchedule = currentUser.weeklySchedule[dayName as keyof typeof currentUser.weeklySchedule]
  const userTime = parseTimeRange(userSchedule)

  if (!userTime || userSchedule.toLowerCase().includes("descanso")) {
    return { canCoverMe }
  }

  allEmployees.forEach((emp) => {
    if (emp.cuil === currentUser.cuil) return

    const empSchedule = emp.weeklySchedule[dayName as keyof typeof emp.weeklySchedule]
    const empTime = parseTimeRange(empSchedule)

    if (!empTime || empSchedule.toLowerCase().includes("descanso")) {
      return
    }

    const userStart = userTime.start
    const userEnd = userTime.end
    const empStart = empTime.start
    const empEnd = empTime.end

    const exactEndMatch = empStart === userEnd
    const exactStartMatch = empEnd === userStart

    if (exactStartMatch || exactEndMatch) {
      canCoverMe.push(emp)
    }
  })

  return { canCoverMe }
}
