export interface DailySchedule {
  date: string
  dayName: string
  schedule: string
  hours: number
  nightHours: number
  month: number
  year: number
  day: number
  fortnight: number
}

export interface Employee {
  name: string
  cuil: string
  weeklySchedule: {
    lunes: string
    martes: string
    miercoles: string
    jueves: string
    viernes: string
    sabado: string
    domingo: string
  }
  dailySchedules: DailySchedule[]
}

export interface WeekData {
  id: string
  weekNumber: number
  year: number
  startDate: Date
  endDate: Date
  period: string
  employees: Employee[]
  userStats?: {
    totalHours: number
    nightHours: number
    daysWorked: number
    dailyBreakdown: DailySchedule[]
  }
  loadedAt: string
}

export interface FortnightData {
  id: string
  year: number
  month: number
  fortnightNumber: number
  weeks: string[]
  totalHours: number
  totalNightHours: number
  totalDaysWorked: number
  period: string
  completedAt: string
  dailyBreakdown: DailySchedule[]
}

export interface MonthData {
  id: string
  year: number
  month: number
  totalHours: number
  totalNightHours: number
  totalDaysWorked: number
  period: string
  fortnights: string[]
  dailyBreakdown: DailySchedule[]
}

export interface TimeRange {
  start: string
  end: string
}

export interface StoredData {
  weeks: { [weekId: string]: WeekData }
  fortnights: { [fortnightId: string]: FortnightData }
  months: { [monthId: string]: MonthData }
  currentWeek: string | null
  loadedAt: string
}

export interface BossSchedule {
  [day: number]: string
}

export interface BossesScheduleMap {
  [bossName: string]: BossSchedule
}
