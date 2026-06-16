"use client"

import type React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Trash2, Clock } from "lucide-react"
import type { Employee } from "@/types/schedule"

interface ConfigCardProps {
  employees: Employee[]
  selectedCuil: string
  onEmployeeChange: (cuil: string) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearData: () => void
  loading: boolean
  pdfLoaded: boolean
  error: string
}

export function ConfigCard({
  employees,
  selectedCuil,
  onEmployeeChange,
  onFileUpload,
  onClearData,
  loading,
  pdfLoaded,
  error,
}: ConfigCardProps) {
  const hasEmployees = employees.length > 0

  return (
    <Card className="shadow-lg border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-red-700">
          <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" />
          Configuración
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:pt-6">
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="employee" className="text-base sm:text-lg font-semibold text-gray-700">
              Tu nombre
            </Label>
            <Select value={selectedCuil} onValueChange={onEmployeeChange} disabled={!hasEmployees}>
              <SelectTrigger id="employee" className="text-base sm:text-lg">
                <SelectValue placeholder={hasEmployees ? "Selecciona tu nombre" : "Carga un PDF primero"} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.cuil} value={emp.cuil}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="pdf" className="text-base sm:text-lg font-semibold text-gray-700">
              Cargar PDF Semanal
            </Label>
            <Input
              id="pdf"
              type="file"
              accept=".pdf"
              onChange={onFileUpload}
              disabled={loading || !pdfLoaded}
              className="text-sm sm:text-lg h-12 border-2 border-orange-200 focus:border-red-400"
            />
            {!pdfLoaded && (
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm">Cargando sistema...</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onClearData}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Todos los Datos
          </Button>
        </div>

        {loading && (
          <Alert className="border-blue-200 bg-blue-50">
            <Clock className="h-5 w-5 animate-spin text-blue-600" />
            <AlertDescription className="text-base sm:text-lg font-medium text-blue-800">
              Procesando PDF...
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="border-red-300">
            <AlertDescription className="text-base sm:text-lg font-medium">{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
