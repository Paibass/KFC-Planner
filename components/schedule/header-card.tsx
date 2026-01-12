import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar } from "lucide-react"

export function HeaderCard() {
  return (
    <Card className="border-red-200 shadow-lg bg-gradient-to-r from-red-600 to-orange-600 text-white">
      <CardHeader className="text-center p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <Calendar className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="text-center">🍗 KFC Plaza Liniers</span>
        </CardTitle>
        <CardDescription className="text-lg sm:text-xl text-red-100 font-medium mt-2">
          Sistema de Horarios y Control de Horas
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
