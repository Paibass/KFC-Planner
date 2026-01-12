import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { WeekData } from "@/types/schedule"

interface SummaryCardProps {
  currentWeekData: WeekData
}

export function SummaryCard({ currentWeekData }: SummaryCardProps) {
  return (
    <Card className="shadow-lg border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl text-blue-700 flex items-center gap-2">📊 Resumen</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <div className="text-2xl font-bold text-green-700">{currentWeekData.userStats?.daysWorked || 0}</div>
            <div className="text-sm font-semibold text-green-600">📆 Días Trabajados</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <div className="text-2xl font-bold text-blue-700">{currentWeekData.userStats?.totalHours || 0}h</div>
            <div className="text-sm font-semibold text-blue-600">⏱️ Horas Totales</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
            <div className="text-2xl font-bold text-purple-700">{currentWeekData.userStats?.nightHours || 0}h</div>
            <div className="text-sm font-semibold text-purple-600">🌙 Horas Nocturnas</div>
            <div className="text-xs text-purple-500">(22:00 - 06:00)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
