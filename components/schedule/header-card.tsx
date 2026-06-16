import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, CalendarDays, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface HeaderCardProps {
  navHref?: string
  navLabel?: string
  navVariant?: "forward" | "back"
}

export function HeaderCard({ navHref, navLabel, navVariant = "forward" }: HeaderCardProps) {
  return (
    <Card className="border-red-200 shadow-lg bg-gradient-to-r from-red-600 to-orange-600 text-white">
      <CardHeader className="text-center p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <Calendar className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="text-center">KFC Plaza Liniers</span>
        </CardTitle>
        <CardDescription className="text-lg sm:text-xl text-red-100 font-medium mt-2">
          Sistema de Horarios
        </CardDescription>

        {navHref && (
          <div className="mt-4 flex justify-center">
            <Button
              asChild
              variant="secondary"
              className="bg-white text-red-700 hover:bg-red-50 font-semibold w-full sm:w-auto"
            >
              <Link href={navHref}>
                {navVariant === "back" ? (
                  <ArrowLeft className="h-4 w-4 mr-2" />
                ) : (
                  <CalendarDays className="h-4 w-4 mr-2" />
                )}
                {navLabel}
              </Link>
            </Button>
          </div>
        )}
      </CardHeader>
    </Card>
  )
}
