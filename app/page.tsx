"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Upload, Calendar, Users, Clock, Download, FileText, Trash2 } from "lucide-react"

// Importar PDF.js de manera que funcione en el navegador
let pdfjsLib: any = null

// Cargar PDF.js dinámicamente
const loadPDFJS = async () => {
  if (typeof window !== "undefined" && !pdfjsLib) {
    // Cargar PDF.js desde CDN
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    document.head.appendChild(script)

    return new Promise((resolve) => {
      script.onload = () => {
        pdfjsLib = (window as any).pdfjsLib
        // Configurar worker
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        resolve(pdfjsLib)
      }
    })
  }
  return pdfjsLib
}

interface Employee {
  name: string
  cuil: string
  schedule: {
    lunes: string
    martes: string
    miercoles: string
    jueves: string
    viernes: string
    sabado: string
    domingo: string
  }
}

interface TimeRange {
  start: string
  end: string
}

interface StoredData {
  employees: Employee[]
  csvData: string
  loadedAt: string
}

const DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
const DAY_NAMES = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
}

export default function KFCScheduleApp() {
  const [cuilInput, setCuilInput] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currentUser, setCurrentUser] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [coincidences, setCoincidences] = useState<{ [key: string]: Employee[] }>({})
  const [csvData, setCsvData] = useState("")
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [dataLoadedAt, setDataLoadedAt] = useState<string | null>(null)
  const [hasStoredData, setHasStoredData] = useState(false)

  // Cargar PDF.js al iniciar
  useEffect(() => {
    loadPDFJS()
      .then(() => {
        setPdfLoaded(true)
      })
      .catch(() => {
        setError("Error al cargar la librería PDF. Recarga la página.")
      })
  }, [])

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    loadStoredData()
  }, [])

  // Cargar CUIL del localStorage al iniciar
  useEffect(() => {
    const savedCuil = localStorage.getItem("kfc-cuil")
    if (savedCuil) {
      setCuilInput(savedCuil)
    }
  }, [])

  // Guardar CUIL en localStorage cuando cambie
  useEffect(() => {
    if (cuilInput) {
      localStorage.setItem("kfc-cuil", cuilInput)
    }
  }, [cuilInput])

  // Buscar usuario cuando cambie el CUIL o los empleados
  useEffect(() => {
    if (employees.length > 0 && cuilInput) {
      findCurrentUser()
    }
  }, [cuilInput, employees])

  // Función para cargar datos del localStorage
  const loadStoredData = () => {
    try {
      const storedDataStr = localStorage.getItem("kfc-schedule-data")
      if (storedDataStr) {
        const storedData: StoredData = JSON.parse(storedDataStr)

        // Verificar que los datos sean válidos
        if (storedData.employees && Array.isArray(storedData.employees) && storedData.employees.length > 0) {
          setEmployees(storedData.employees)
          setCsvData(storedData.csvData || "")
          setDataLoadedAt(storedData.loadedAt)
          setHasStoredData(true)
          console.log(`Cargados ${storedData.employees.length} empleados desde localStorage`)
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del localStorage:", error)
      // Limpiar datos corruptos
      localStorage.removeItem("kfc-schedule-data")
    }
  }

  // Función para guardar datos en localStorage
  const saveDataToStorage = (employeesData: Employee[], csvDataStr: string) => {
    try {
      const dataToStore: StoredData = {
        employees: employeesData,
        csvData: csvDataStr,
        loadedAt: new Date().toISOString(),
      }

      localStorage.setItem("kfc-schedule-data", JSON.stringify(dataToStore))
      setDataLoadedAt(dataToStore.loadedAt)
      setHasStoredData(true)
      console.log("Datos guardados en localStorage")
    } catch (error) {
      console.error("Error al guardar en localStorage:", error)
      // Si hay error de espacio, intentar limpiar datos antiguos
      try {
        localStorage.removeItem("kfc-schedule-data")
        localStorage.setItem(
          "kfc-schedule-data",
          JSON.stringify({
            employees: employeesData,
            csvData: csvDataStr,
            loadedAt: new Date().toISOString(),
          }),
        )
      } catch (secondError) {
        console.error("Error crítico de localStorage:", secondError)
      }
    }
  }

  // Función para limpiar datos almacenados
  const clearStoredData = () => {
    localStorage.removeItem("kfc-schedule-data")
    setEmployees([])
    setCsvData("")
    setCurrentUser(null)
    setCoincidences({})
    setDataLoadedAt(null)
    setHasStoredData(false)
    setError("")
  }

  // Función para buscar usuario actual
  const findCurrentUser = () => {
    const formattedCuil = getFormattedCUIL()
    if (!formattedCuil || formattedCuil.length < 13) return

    const user = employees.find(
      (emp) => emp.cuil === formattedCuil || emp.cuil.replace(/-/g, "") === formattedCuil.replace(/-/g, ""),
    )

    if (user) {
      setCurrentUser(user)
      const userCoincidences = findCoincidences(user, employees)
      setCoincidences(userCoincidences)
      setError("")
    } else if (employees.length > 0) {
      setError(`No se encontró ningún empleado con CUIL: ${formattedCuil}`)
      setCurrentUser(null)
      setCoincidences({})
    }
  }

  // Función para formatear CUIL automáticamente
  const formatCUIL = (value: string): string => {
    // Remover todo lo que no sea número
    const numbers = value.replace(/\D/g, "")

    // Limitar a 11 dígitos
    const limited = numbers.slice(0, 11)

    // Formatear con guiones
    if (limited.length >= 10) {
      return `${limited.slice(0, 2)}-${limited.slice(2, 10)}-${limited.slice(10)}`
    } else if (limited.length >= 2) {
      return `${limited.slice(0, 2)}-${limited.slice(2)}`
    }

    return limited
  }

  // Función para obtener CUIL formateado
  const getFormattedCUIL = (): string => {
    return formatCUIL(cuilInput)
  }

  // Función para manejar cambio en input de CUIL
  const handleCuilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCUIL(e.target.value)
    setCuilInput(formatted)
  }

  // Función para parsear horario
  const parseTimeRange = (timeStr: string): TimeRange | null => {
    if (!timeStr || timeStr.toLowerCase().includes("descanso")) {
      return null
    }

    const match = timeStr.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
    if (match) {
      return { start: match[1], end: match[2] }
    }
    return null
  }

  // Función para verificar si dos horarios se superponen
  const timesOverlap = (time1: TimeRange, time2: TimeRange): boolean => {
    const start1 = Number.parseInt(time1.start.replace(":", ""))
    const end1 = Number.parseInt(time1.end.replace(":", ""))
    const start2 = Number.parseInt(time2.start.replace(":", ""))
    const end2 = Number.parseInt(time2.end.replace(":", ""))

    // Manejar horarios que cruzan medianoche
    const adjustedEnd1 = end1 < start1 ? end1 + 2400 : end1
    const adjustedEnd2 = end2 < start2 ? end2 + 2400 : end2
    const adjustedStart1 = start1
    const adjustedStart2 = start2

    return adjustedStart1 < adjustedEnd2 && adjustedStart2 < adjustedEnd1
  }

  // Función para encontrar coincidencias
  const findCoincidences = (user: Employee, allEmployees: Employee[]) => {
    const result: { [key: string]: Employee[] } = {}

    DAYS.forEach((day) => {
      const userTime = parseTimeRange(user.schedule[day as keyof typeof user.schedule])
      if (!userTime) {
        result[day] = []
        return
      }

      const matches = allEmployees.filter((emp) => {
        if (emp.cuil === user.cuil) return false

        const empTime = parseTimeRange(emp.schedule[day as keyof typeof emp.schedule])
        if (!empTime) return false

        return timesOverlap(userTime, empTime)
      })

      result[day] = matches
    })

    return result
  }

  // Función para leer PDF usando pdfjs-dist
  const readPDF = async (file: File): Promise<string> => {
    if (!pdfjsLib) {
      throw new Error("PDF.js no está cargado")
    }

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    let fullText = ""

    // Leer todas las páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Extraer texto de cada item
      const pageText = textContent.items.map((item: any) => item.str || "").join(" ")

      fullText += pageText + " "
    }

    return fullText.trim()
  }

  // Función para limpiar el texto del PDF
  const cleanPDFText = (text: string): string => {
    // Eliminar encabezados, títulos y texto no relevante
    const cleanText = text
      // Eliminar encabezados comunes
      .replace(/PLANILLA DE HORARIOS.*?(?=\w+,|\d{2}-)/gi, "")
      .replace(/Departamento:.*?(?=\w+,|\d{2}-)/gi, "")
      .replace(/Semana del.*?(?=\w+,|\d{2}-)/gi, "")
      .replace(/Apellido y Nombre.*?Domingo/gi, "")
      .replace(/CUIL.*?Domingo/gi, "")
      // Eliminar saltos de página y caracteres especiales
      .replace(/Página \d+/gi, "")
      .replace(/\f/g, " ") // Form feed
      .replace(/\r\n/g, " ")
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")
      // Normalizar espacios
      .replace(/\s+/g, " ")
      .trim()

    return cleanText
  }

  // Función mejorada para parsear empleados del texto limpio
  const parseEmployeesFromText = (text: string): Employee[] => {
    const employees: Employee[] = []

    // Dividir el texto en segmentos más manejables
    // Buscar todos los CUILs primero
    const cuilMatches = [...text.matchAll(/(\d{2}-\d{8}-\d)/g)]

    for (let i = 0; i < cuilMatches.length; i++) {
      const match = cuilMatches[i]
      const cuil = match[1]
      const cuilIndex = match.index!

      // Determinar los límites para buscar el nombre
      const prevCuilIndex = i > 0 ? cuilMatches[i - 1].index! + cuilMatches[i - 1][0].length : 0
      const textSegment = text.substring(prevCuilIndex, cuilIndex).trim()

      // Buscar el nombre al final del segmento (justo antes del CUIL)
      // Evitar capturar horarios o "Descanso"
      const namePattern = /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s,]*[A-ZÁÉÍÓÚÑ])\s*$/i
      const nameMatch = textSegment.match(namePattern)

      if (!nameMatch) continue

      let name = nameMatch[1].trim()

      // Limpiar el nombre de posibles horarios o "Descanso"
      name = name
        .replace(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/g, "") // Remover horarios
        .replace(/\bDescanso\b/gi, "") // Remover "Descanso"
        .replace(/\s+/g, " ") // Normalizar espacios
        .trim()

      // Validar que el nombre sea válido (al menos 3 caracteres, solo letras y espacios/comas)
      if (name.length < 3 || !/^[A-ZÁÉÍÓÚÑ\s,]+$/i.test(name)) {
        continue
      }

      // Buscar horarios después del CUIL
      const afterCuil = text.substring(cuilIndex + cuil.length).trim()

      // Patrón mejorado para horarios
      const schedulePattern = /(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}|Descanso)(?=\s|$)/gi
      const scheduleMatches = []
      let scheduleMatch

      // Limitar la búsqueda a los primeros 300 caracteres después del CUIL
      const scheduleSearchText = afterCuil.substring(0, 300)

      while ((scheduleMatch = schedulePattern.exec(scheduleSearchText)) !== null && scheduleMatches.length < 7) {
        scheduleMatches.push(scheduleMatch[1].trim())
      }

      // Verificar que tenemos exactamente 7 horarios
      if (scheduleMatches.length === 7) {
        const employee: Employee = {
          name: name,
          cuil: cuil,
          schedule: {
            lunes: scheduleMatches[0],
            martes: scheduleMatches[1],
            miercoles: scheduleMatches[2],
            jueves: scheduleMatches[3],
            viernes: scheduleMatches[4],
            sabado: scheduleMatches[5],
            domingo: scheduleMatches[6],
          },
        }
        employees.push(employee)
      }
    }

    return employees
  }

  // Función para crear CSV en memoria
  const createCSV = (employees: Employee[]): string => {
    const headers = [
      "Apellido y Nombre",
      "CUIL",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ]

    const csvRows = [
      headers.join(","), // Encabezados
      ...employees.map((emp) =>
        [
          `"${emp.name}"`, // Comillas para nombres con comas
          emp.cuil,
          emp.schedule.lunes,
          emp.schedule.martes,
          emp.schedule.miercoles,
          emp.schedule.jueves,
          emp.schedule.viernes,
          emp.schedule.sabado,
          emp.schedule.domingo,
        ].join(","),
      ),
    ]

    return csvRows.join("\n")
  }

  // Función para descargar CSV
  const downloadCSV = () => {
    if (!csvData) return

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", "horarios_kfc.csv")
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para calcular horas trabajadas y horas nocturnas
  const calculateWorkingHours = (employee: Employee): { total: number; nocturnas: number } => {
    let totalHours = 0
    let nightHours = 0

    DAYS.forEach((day) => {
      const schedule = employee.schedule[day as keyof typeof employee.schedule]
      if (!schedule.toLowerCase().includes("descanso")) {
        const timeRange = parseTimeRange(schedule)
        if (timeRange) {
          const startHour = Number.parseInt(timeRange.start.split(":")[0])
          const startMinute = Number.parseInt(timeRange.start.split(":")[1])
          const endHour = Number.parseInt(timeRange.end.split(":")[0])
          const endMinute = Number.parseInt(timeRange.end.split(":")[1])

          // Convertir a minutos desde medianoche
          const startMinutes = startHour * 60 + startMinute
          let endMinutes = endHour * 60 + endMinute

          // Manejar horarios que cruzan medianoche
          if (endMinutes < startMinutes) {
            endMinutes += 24 * 60 // Agregar 24 horas
          }

          // Calcular horas totales
          const totalMinutes = endMinutes - startMinutes
          totalHours += totalMinutes / 60

          // Calcular horas nocturnas (21:00 - 06:00)
          const nightStart = 21 * 60 // 21:00 en minutos
          const nightEnd = 6 * 60 // 06:00 en minutos
          const nextDayNightEnd = nightEnd + 24 * 60 // 06:00 del día siguiente

          // Verificar intersección con horario nocturno
          let nightMinutes = 0

          // Caso 1: Turno que no cruza medianoche
          if (endMinutes <= 24 * 60) {
            // Intersección con 21:00-24:00
            if (startMinutes < 24 * 60 && endMinutes > nightStart) {
              const intersectStart = Math.max(startMinutes, nightStart)
              const intersectEnd = Math.min(endMinutes, 24 * 60)
              nightMinutes += Math.max(0, intersectEnd - intersectStart)
            }
            // Intersección con 00:00-06:00
            if (startMinutes < nightEnd && endMinutes > 0) {
              const intersectStart = Math.max(startMinutes, 0)
              const intersectEnd = Math.min(endMinutes, nightEnd)
              nightMinutes += Math.max(0, intersectEnd - intersectStart)
            }
          } else {
            // Caso 2: Turno que cruza medianoche
            // Parte antes de medianoche (21:00-24:00)
            if (startMinutes < 24 * 60) {
              const intersectStart = Math.max(startMinutes, nightStart)
              const intersectEnd = 24 * 60
              nightMinutes += Math.max(0, intersectEnd - intersectStart)
            }
            // Parte después de medianoche (00:00-06:00)
            const afterMidnightEnd = endMinutes - 24 * 60
            if (afterMidnightEnd > 0) {
              const intersectStart = 0
              const intersectEnd = Math.min(afterMidnightEnd, nightEnd)
              nightMinutes += Math.max(0, intersectEnd - intersectStart)
            }
          }

          nightHours += nightMinutes / 60
        }
      }
    })

    return {
      total: Math.round(totalHours * 10) / 10, // Redondear a 1 decimal
      nocturnas: Math.round(nightHours * 10) / 10, // Redondear a 1 decimal
    }
  }

  // Manejar subida de archivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== "application/pdf") {
      setError("Por favor selecciona un archivo PDF válido")
      return
    }

    if (!pdfLoaded) {
      setError("PDF.js aún se está cargando. Espera un momento e intenta de nuevo.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // 1. Leer el PDF completamente
      console.log("Leyendo PDF...")
      const rawText = await readPDF(file)

      // 2. Limpiar el texto eliminando encabezados y títulos
      console.log("Limpiando texto...")
      const cleanText = cleanPDFText(rawText)

      // 3. Detectar y parsear empleados
      console.log("Parseando empleados...")
      const parsedEmployees = parseEmployeesFromText(cleanText)

      if (parsedEmployees.length === 0) {
        setError("No se pudieron extraer empleados del PDF. Verifica que el formato sea correcto.")
        return
      }

      // 4. Crear CSV en memoria
      console.log("Creando CSV...")
      const csv = createCSV(parsedEmployees)

      // 5. Guardar en localStorage
      saveDataToStorage(parsedEmployees, csv)

      // 6. Actualizar estado
      setEmployees(parsedEmployees)
      setCsvData(csv)

      console.log(`Procesados ${parsedEmployees.length} empleados exitosamente`)
    } catch (err: any) {
      setError(`Error al procesar el PDF: ${err.message}`)
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Función para formatear fecha
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header optimizado para móvil */}
        <Card className="border-red-200 shadow-lg bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <Calendar className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="text-center">KFC Plaza Liniers</span>
            </CardTitle>
            <CardDescription className="text-lg sm:text-xl text-red-100 font-medium mt-2">
              🍗 Consulta tus horarios y coincidencias
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Input Section optimizado para móvil */}
        <Card className="shadow-lg border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-red-700">
              <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
              {hasStoredData ? "Datos Cargados" : "Cargar Horarios"}
            </CardTitle>
            <CardDescription className="text-base sm:text-lg mt-2">
              {hasStoredData
                ? `📄 Datos cargados el ${dataLoadedAt ? formatDate(dataLoadedAt) : "fecha desconocida"}`
                : "📄 Sube el PDF oficial de horarios"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:pt-6">
            <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="cuil" className="text-base sm:text-lg font-semibold text-gray-700">
                  🆔 Tu CUIL (solo números)
                </Label>
                <Input
                  id="cuil"
                  type="text"
                  placeholder="20123456789"
                  value={cuilInput}
                  onChange={handleCuilChange}
                  className="text-base sm:text-lg h-12 border-2 border-orange-200 focus:border-red-400"
                  maxLength={13}
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="pdf" className="text-base sm:text-lg font-semibold text-gray-700">
                  📁 {hasStoredData ? "Cargar Nuevo PDF" : "Archivo PDF"}
                </Label>
                <Input
                  id="pdf"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={loading || !pdfLoaded}
                  className="text-sm sm:text-lg h-12 border-2 border-orange-200 focus:border-red-400"
                />
                {!pdfLoaded && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Cargando...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de gestión de datos */}
            {hasStoredData && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={clearStoredData}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar Datos
                </Button>
              </div>
            )}

            {loading && (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-5 w-5 animate-spin text-blue-600" />
                <AlertDescription className="text-base sm:text-lg font-medium text-blue-800">
                  🔄 Procesando PDF y guardando datos...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="border-red-300">
                <AlertDescription className="text-base sm:text-lg font-medium">❌ {error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results optimizado para móvil */}
        {currentUser && (
          <div className="space-y-4 sm:space-y-6">
            {/* User Schedule - Pantalla completa en móvil */}
            <Card className="shadow-lg border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl text-green-700 flex items-center gap-2">
                  👤 <span className="truncate">{currentUser.name}</span>
                </CardTitle>
                <CardDescription className="text-base sm:text-lg font-medium">🆔 {currentUser.cuil}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:pt-6">
                <div className="space-y-3 sm:space-y-4">
                  {DAYS.map((day) => {
                    const schedule = currentUser.schedule[day as keyof typeof currentUser.schedule]
                    const isRest = schedule.toLowerCase().includes("descanso")

                    return (
                      <div
                        key={day}
                        className={`flex justify-between items-center p-3 sm:p-4 rounded-xl transition-all ${
                          isRest ? "bg-gray-100 border-2 border-gray-200" : "bg-blue-50 border-2 border-blue-200"
                        }`}
                      >
                        <span className="font-bold text-base sm:text-lg text-gray-700">
                          {DAY_NAMES[day as keyof typeof DAY_NAMES]}
                        </span>
                        <Badge
                          variant={isRest ? "secondary" : "default"}
                          className={`text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2 ${
                            isRest ? "bg-gray-200 text-gray-700" : "bg-blue-600 text-white"
                          }`}
                        >
                          {isRest ? "😴 Descanso" : `⏰ ${schedule}`}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Coincidences - Pantalla completa en móvil */}
            <Card className="shadow-lg border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl text-blue-700 flex items-center gap-2">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />👥 Coincidencias
                </CardTitle>
                <CardDescription className="text-base sm:text-lg">Compañeros que trabajan contigo</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:pt-6">
                <div className="space-y-3 sm:space-y-4">
                  {DAYS.map((day) => {
                    const dayCoincidences = coincidences[day] || []
                    const userSchedule = currentUser.schedule[day as keyof typeof currentUser.schedule]

                    if (userSchedule.toLowerCase().includes("descanso")) {
                      return (
                        <div key={day} className="p-3 sm:p-4 rounded-xl bg-gray-100 border-2 border-gray-200">
                          <div className="font-bold text-base sm:text-lg text-gray-600 flex items-center gap-2">
                            😴 {DAY_NAMES[day as keyof typeof DAY_NAMES]} - Descanso
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={day}
                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                          dayCoincidences.length > 0 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
                        }`}
                      >
                        <div className="font-bold text-base sm:text-lg mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="flex items-center gap-2">
                            {dayCoincidences.length > 0 ? "👥" : "🚶‍♂️"} {DAY_NAMES[day as keyof typeof DAY_NAMES]}
                          </span>
                          <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                            ⏰ {userSchedule}
                          </Badge>
                        </div>
                        {dayCoincidences.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-green-700 mb-2">
                              🤝 {dayCoincidences.length} coincidencia{dayCoincidences.length > 1 ? "s" : ""}:
                            </div>
                            {dayCoincidences.map((emp) => (
                              <div
                                key={emp.cuil}
                                className="bg-white p-2 sm:p-3 rounded-lg border border-green-200 shadow-sm"
                              >
                                <div className="font-semibold text-sm sm:text-base text-gray-800 truncate">
                                  {emp.name}
                                </div>
                                <div className="text-green-600 font-medium text-sm">
                                  ⏰ {emp.schedule[day as keyof typeof emp.schedule]}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-orange-600 font-medium text-sm sm:text-base">
                            🚶‍♂️ Trabajas solo este día
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistics simplificadas */}
        {employees.length > 0 && currentUser && (
          <Card className="shadow-lg border-indigo-200">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl text-indigo-700 flex items-center gap-2">
                📊 Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Días trabajados */}
                <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-green-700 mb-1 sm:mb-2">
                    {
                      DAYS.filter(
                        (day) =>
                          !currentUser.schedule[day as keyof typeof currentUser.schedule]
                            .toLowerCase()
                            .includes("descanso"),
                      ).length
                    }
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-green-600">💼 Días Trabajas</div>
                </div>

                {/* Horas totales */}
                <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-700 mb-1 sm:mb-2">
                    {calculateWorkingHours(currentUser).total}h
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-blue-600">⏰ Horas Totales</div>
                </div>

                {/* Horas nocturnas */}
                <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-purple-700 mb-1 sm:mb-2">
                    {calculateWorkingHours(currentUser).nocturnas}h
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-purple-600">🌙 Horas Nocturnas</div>
                  <div className="text-xs text-purple-500 mt-1">(21:00 - 06:00)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
