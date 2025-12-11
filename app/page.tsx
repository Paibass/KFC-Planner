"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, Clock, Trash2, RefreshCw } from "lucide-react"

// Importar PDF.js de manera que funcione en el navegador
let pdfjsLib: any = null

// Cargar PDF.js dinámicamente
const loadPDFJS = async () => {
  if (typeof window !== "undefined" && !pdfjsLib) {
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    document.head.appendChild(script)

    return new Promise((resolve) => {
      script.onload = () => {
        pdfjsLib = (window as any).pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        resolve(pdfjsLib)
      }
    })
  }
  return pdfjsLib
}

interface DailySchedule {
  date: string // "DD/MM/YYYY"
  dayName: string // "lunes", "martes" etc.
  schedule: string // "08:00-16:00" o "Descanso"
  hours: number
  nightHours: number
  month: number // 0-11 (enero = 0)
  year: number
  day: number // 1-31
  fortnight: number // 1 o 2
}

interface Employee {
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
  dailySchedules: DailySchedule[] // Nueva estructura con fechas reales
}

interface WeekData {
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

interface FortnightData {
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
  dailyBreakdown: DailySchedule[] // Días específicos de esta quincena
}

interface MonthData {
  id: string
  year: number
  month: number
  totalHours: number
  totalNightHours: number
  totalDaysWorked: number
  period: string
  fortnights: string[] // IDs de quincenas
  dailyBreakdown: DailySchedule[]
}

interface TimeRange {
  start: string
  end: string
}

interface StoredData {
  weeks: { [weekId: string]: WeekData }
  fortnights: { [fortnightId: string]: FortnightData }
  months: { [monthId: string]: MonthData }
  currentWeek: string | null
  loadedAt: string
}

// Agregar interfaz para el contador de horas
interface WeeklyHourTracker {
  planned: number // Horas previstas ingresadas manualmente para la semana actual
  actual: {
    // Para cada día de la semana
    [day: string]: {
      checkIn: string // "HH:MM"
      checkOut: string // "HH:MM"
      totalHours: number // Calculado automáticamente para el día
    }
  }
  totalPlanned: number // Acumulado quincenal de horas previstas
  totalActual: number // Acumulado quincenal de horas reales
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

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

// Función para generar fechas de la semana a partir de la fecha de inicio
const generateWeekDates = (startDate: Date): DailySchedule[] => {
  const dates: DailySchedule[] = []
  const current = new Date(startDate)

  // Asegurar que empezamos en lunes
  const dayOfWeek = current.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  current.setDate(current.getDate() + daysToMonday)

  console.log(`📅 Generando fechas de semana desde: ${current.toLocaleDateString("es-AR")}`)

  for (let i = 0; i < 7; i++) {
    const dateStr = current.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

    const month = current.getMonth()
    const day = current.getDate()
    const year = current.getFullYear()

    // Determinar quincena (1-15 = primera, 16-fin = segunda)
    const fortnight = day <= 15 ? 1 : 2

    dates.push({
      date: dateStr,
      dayName: DAYS[i],
      schedule: "",
      hours: 0,
      nightHours: 0,
      month,
      year,
      day,
      fortnight,
    })

    console.log(`  ${DAYS[i]}: ${dateStr} (Mes: ${month + 1}, Quincena: ${fortnight})`)

    current.setDate(current.getDate() + 1)
  }

  return dates
}

// Función para parsear PDF con lógica mejorada de extracción
const parsePDF = async (file: File): Promise<string> => {
  if (!pdfjsLib) {
    throw new Error("PDF.js no está cargado")
  }

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  let fullText = ""

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str || "").join(" ")
    fullText += pageText + " "
  }

  // Limpiar el texto extraído para facilitar el parsing
  return cleanPDFText(fullText.trim())
}

const cleanPDFText = (text: string): string => {
  // No eliminar pie de página ya que algunos empleados aparecen después
  return text
    .replace(/Departamento:.*?Domingo/gi, "") // Solo remover encabezados
    .replace(/Apellido y Nombre.*?Domingo/gi, "")
    .replace(/CUIL\s+Lunes.*?Domingo/gi, "")
    .replace(/Página \d+/gi, "")
    .replace(/https?:\/\/[^\s]+/gi, "") // Remover URLs
    .replace(/\f/g, " ")
    .replace(/[ƟƟ]/g, "t") // Normalizar caracteres especiales
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s{2,}/g, " ") // Normalizar espacios
    .trim()
}

const detectWeekInfo = (text: string): { startDate: Date; endDate: Date; period: string } => {
  const datePatterns = [
    /semana del (\d{1,2}\/\d{1,2}\/\d{2,4})\s*al?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /del (\d{1,2}\/\d{1,2}\/\d{2,4})\s*al?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  ]

  let startDate = new Date()
  let endDate = new Date()
  let period = "Semana sin fecha"

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      const startStr = match[1]
      const endStr = match[2]

      const parseDate = (dateStr: string): Date => {
        const parts = dateStr.split("/")
        if (parts.length === 3) {
          let year = Number.parseInt(parts[2])
          if (year < 100) year += 2000
          return new Date(year, Number.parseInt(parts[1]) - 1, Number.parseInt(parts[0]))
        }
        return new Date()
      }

      startDate = parseDate(startStr)
      endDate = parseDate(endStr)
      period = `${startStr} - ${endStr}`
      break
    }
  }

  return { startDate, endDate, period }
}

const retryFailedCuilExtraction = (
  cleanedText: string,
  cuil: string,
  cuilIndex: number,
  nextCuilIndex: number,
  prevCuilIndex: number,
  weekDates: any[],
  usedNames: Set<string>, // Agregar conjunto de nombres ya utilizados
): Employee | null => {
  console.log(`🔄 REINTENTANDO extracción para CUIL: ${cuil}`)

  const expandedNameStart = Math.max(0, prevCuilIndex - 200)
  const expandedNameEnd = cuilIndex
  const expandedNameSegment = cleanedText.substring(expandedNameStart, expandedNameEnd)

  let name = ""

  // Método Alt 1: Buscar patrón con coma más cercano al CUIL
  const allNamesWithComma = [
    ...expandedNameSegment.matchAll(
      /([A-ZÁÉÍÓÚÑ]+(?:\s+[A-ZÁÉÍÓÚÑ]+)*\s*,\s*[A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)*)/gi,
    ),
  ]

  if (allNamesWithComma.length > 0) {
    for (let i = allNamesWithComma.length - 1; i >= 0; i--) {
      const candidateName = allNamesWithComma[i][1].trim()
      if (!usedNames.has(candidateName)) {
        name = candidateName
        console.log(`   Método Alt 1: Nombre con coma encontrado: "${name}"`)
        break
      } else {
        console.log(`   ⚠️ Nombre "${candidateName}" ya está asignado a otro CUIL, buscando siguiente...`)
      }
    }
  }

  // Método Alt 2: Buscar desde la última coma hacia atrás
  if (!name || name.length < 3) {
    const lastCommaIndex = expandedNameSegment.lastIndexOf(",")
    if (lastCommaIndex > 0) {
      const beforeLastComma = expandedNameSegment.lastIndexOf(",", lastCommaIndex - 1)
      const startIndex = beforeLastComma > 0 ? beforeLastComma + 1 : Math.max(0, lastCommaIndex - 50)
      const candidateName = expandedNameSegment.substring(startIndex, lastCommaIndex + 50).trim()

      const nameExtract = candidateName.match(
        /([A-ZÁÉÍÓÚÑ]+(?:\s+[A-ZÁÉÍÓÚÑ]+)*\s*,\s*[A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)*)/i,
      )
      if (nameExtract) {
        const extractedName = nameExtract[1].trim()
        if (!usedNames.has(extractedName)) {
          name = extractedName
          console.log(`   Método Alt 2: Nombre por búsqueda de coma: "${name}"`)
        } else {
          console.log(`   ⚠️ Nombre "${extractedName}" ya está asignado, saltando método 2`)
        }
      }
    }
  }

  // Método Alt 3: Buscar cualquier texto con mayúsculas y coma antes del CUIL
  if (!name || name.length < 3) {
    const simplePattern = expandedNameSegment.match(
      /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+,\s*[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)(?=\s*\d{2}[\s-]*\d)/i,
    )
    if (simplePattern) {
      const extractedName = simplePattern[1].trim()
      if (!usedNames.has(extractedName)) {
        name = extractedName
        console.log(`   Método Alt 3: Nombre con patrón simple: "${name}"`)
      } else {
        console.log(`   ⚠️ Nombre "${extractedName}" ya está asignado, saltando método 3`)
      }
    }
  }

  // Método Alt 4: Buscar línea completa antes del CUIL que contenga coma
  if (!name || name.length < 3) {
    const lines = expandedNameSegment.split(/\n/)
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (
        line.includes(",") &&
        line.length >= 5 &&
        line.length <= 80 &&
        /[A-ZÁÉÍÓÚÑ]/i.test(line) &&
        !/\d{2}:\d{2}/.test(line) &&
        !line.toLowerCase().includes("descanso")
      ) {
        if (!usedNames.has(line)) {
          name = line
          console.log(`   Método Alt 4: Nombre por línea con coma: "${name}"`)
          break
        } else {
          console.log(`   ⚠️ Nombre "${line}" ya está asignado, continuando búsqueda...`)
        }
      }
    }
  }

  if (!name || name.length < 3) {
    console.log(`   ❌ No se pudo extraer nombre con métodos alternativos`)
    return null
  }

  // Limpiar nombre
  name = name
    .replace(/\d{1,2}:\d{2}\s*[-–—~]\s*\d{1,2}:\d{2}/g, "")
    .replace(/\bDescanso\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()

  console.log(`   ✅ Nombre extraído: "${name}"`)

  // Buscar horarios con métodos alternativos
  const expandedScheduleStart = cuilIndex
  const expandedScheduleEnd = nextCuilIndex
  const expandedScheduleSegment = cleanedText.substring(expandedScheduleStart, expandedScheduleEnd)

  const scheduleMatches: string[] = []

  // Método Alt 1: Patrón estándar más flexible
  const pattern1 = /(\d{1,2}:\d{2}\s*[-–—~]\s*\d{1,2}:\d{2}|Descanso)/gi
  let match
  pattern1.lastIndex = 0
  while ((match = pattern1.exec(expandedScheduleSegment)) !== null && scheduleMatches.length < 7) {
    scheduleMatches.push(match[1].trim().replace(/[-–—~]/g, "-"))
    if (pattern1.lastIndex === match.index) pattern1.lastIndex++
  }

  // Método Alt 2: Buscar horarios en líneas separadas
  if (scheduleMatches.length < 7) {
    console.log(`   🔄 Método Alt: Buscando horarios en líneas separadas`)
    const lines = expandedScheduleSegment.split(/\n/)
    const lineSchedules: string[] = []

    for (const line of lines) {
      if (lineSchedules.length >= 7) break
      const lineMatch = line.match(/(\d{1,2}:\d{2}\s*[-–—~]\s*\d{1,2}:\d{2})/i)
      if (lineMatch) {
        lineSchedules.push(lineMatch[1].trim().replace(/[-–—~]/g, "-"))
      } else if (/descanso/i.test(line) && !line.match(/\d{2}:\d{2}/)) {
        lineSchedules.push("Descanso")
      }
    }

    if (lineSchedules.length === 7) {
      scheduleMatches.length = 0
      scheduleMatches.push(...lineSchedules)
      console.log(`   ✅ Horarios encontrados por líneas: ${scheduleMatches.length}`)
    }
  }

  // Método Alt 3: Buscar día por día con palabras clave
  if (scheduleMatches.length < 7) {
    console.log(`   🔄 Método Alt: Buscando horarios día por día`)
    const dayKeywords = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
    const daySchedules: string[] = []

    for (const dayName of dayKeywords) {
      const dayRegex = new RegExp(`${dayName}[^\\d]*(\\d{1,2}:\\d{2}\\s*[-–—~]\\s*\\d{1,2}:\\d{2}|Descanso)`, "i")
      const dayMatch = expandedScheduleSegment.match(dayRegex)
      if (dayMatch) {
        daySchedules.push(dayMatch[1].trim().replace(/[-–—~]/g, "-"))
      }
    }

    if (daySchedules.length === 7) {
      scheduleMatches.length = 0
      scheduleMatches.push(...daySchedules)
      console.log(`   ✅ Horarios encontrados por día: ${scheduleMatches.length}`)
    }
  }

  console.log(`   Horarios finales: ${scheduleMatches.length}/7`)

  if (scheduleMatches.length === 7) {
    const weeklySchedule = {
      lunes: scheduleMatches[0],
      martes: scheduleMatches[1],
      miercoles: scheduleMatches[2],
      jueves: scheduleMatches[3],
      viernes: scheduleMatches[4],
      sabado: scheduleMatches[5],
      domingo: scheduleMatches[6],
    }

    const dailySchedules = weekDates.map((dateInfo: any, index: number) => {
      const schedule = scheduleMatches[index]
      const { hours, nightHours } = calculateDayHours(schedule)
      return { ...dateInfo, schedule, hours, nightHours }
    })

    console.log(`   ✅ Reintento exitoso para ${name}`)
    return { name, cuil, weeklySchedule, dailySchedules }
  }

  console.log(`   ❌ Reintento fallido: solo ${scheduleMatches.length}/7 horarios`)
  return null
}

// Función mejorada para parsear empleados con fechas reales
const parseEmployeesFromText = (text: string, weekStartDate: Date): Employee[] => {
  const employees: Employee[] = []
  const usedNames = new Set<string>()
  const weekDates = generateWeekDates(weekStartDate)

  const cleanedText = cleanPDFText(text)

  console.log("=== PARSING OPTIMIZADO PARA 22 EMPLEADOS ===")
  console.log(
    "Fechas de la semana:",
    weekDates.map((d) => `${d.dayName}: ${d.date}`),
  )

  // Buscar todos los CUILs con patrón flexible
  const cuilPattern = /(\d{2})[\s-]*(\d{7,9})[\s-]*(\d)/g
  const cuilMatches = [...cleanedText.matchAll(cuilPattern)]

  console.log(`\nCUILs detectados: ${cuilMatches.length}`)
  cuilMatches.forEach((match, idx) => {
    const cuil = `${match[1]}-${match[2]}-${match[3]}`
    console.log(`  ${idx + 1}. ${cuil} en posición ${match.index}`)
  })

  const failedCuils: Array<{ cuil: string; rawText: string }> = []

  // Procesar cada CUIL
  for (let i = 0; i < cuilMatches.length; i++) {
    const match = cuilMatches[i]
    const cuil = `${match[1]}-${match[2]}-${match[3]}`
    const cuilIndex = match.index!
    const cuilEndIndex = cuilIndex + match[0].length

    console.log(`\n--- CUIL ${i + 1}/${cuilMatches.length}: ${cuil} ---`)

    // Definir segmento de búsqueda para el nombre (antes del CUIL)
    const nameSearchStart = i > 0 ? cuilMatches[i - 1].index! + cuilMatches[i - 1][0].length : 0
    const nameSearchEnd = cuilIndex
    const nameSegment = cleanedText.substring(nameSearchStart, nameSearchEnd).trim()

    // Extraer nombre con patrón robusto
    let name = ""

    // Patrón 1: Buscar "APELLIDO , Nombre" o "APELLIDO, Nombre" (con espacios opcionales alrededor de la coma)
    const namePattern1 =
      /([A-ZÁÉÍÓÚÑ']+(?:\s+[A-ZÁÉÍÓÚÑ']+)*)\s*,\s*([A-ZÁÉÍÓÚÑa-záéíóúñ']+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ']+)*)\s*$/i
    const nameMatch1 = nameSegment.match(namePattern1)

    if (nameMatch1) {
      name = `${nameMatch1[1].trim()} , ${nameMatch1[2].trim()}` // Preservar formato con espacio antes de coma
    } else {
      // Patrón 2: Últimas 2-4 palabras antes del CUIL
      const words = nameSegment.split(/\s+/).filter((w) => w.length > 1 && /^[A-ZÁÉÍÓÚÑa-záéíóúñ']+$/.test(w))
      if (words.length >= 2) {
        const lastName = words[words.length - 2]
        const firstName = words[words.length - 1]
        name = `${lastName}, ${firstName}`
      }
    }

    // Limpiar nombre de restos
    name = name
      .replace(/\d{1,2}:\d{2}/g, "")
      .replace(/Descanso/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim()

    if (!name || name.length < 3 || usedNames.has(name)) {
      console.log(`❌ Nombre inválido o duplicado para ${cuil}: "${name}"`)
      const nextIndex = i < cuilMatches.length - 1 ? cuilMatches[i + 1].index! : cleanedText.length
      failedCuils.push({
        cuil,
        rawText: cleanedText.substring(nameSearchStart, nextIndex),
      })
      continue
    }

    console.log(`✓ Nombre: "${name}"`)

    // Buscar horarios (después del CUIL hasta el siguiente CUIL)
    const scheduleSearchStart = cuilEndIndex
    const scheduleSearchEnd = i < cuilMatches.length - 1 ? cuilMatches[i + 1].index! : cleanedText.length
    const scheduleSegment = cleanedText.substring(scheduleSearchStart, scheduleSearchEnd)

    // Extraer exactamente 7 horarios en orden
    const schedulePattern = /(\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}|Descanso)/gi
    const scheduleMatches: string[] = []
    let scheduleMatch

    while ((scheduleMatch = schedulePattern.exec(scheduleSegment)) !== null && scheduleMatches.length < 7) {
      const schedule = scheduleMatch[1].trim().replace(/[-–—]/g, "-")
      scheduleMatches.push(schedule)
    }

    console.log(`  Horarios: ${scheduleMatches.length}/7`)

    if (scheduleMatches.length !== 7) {
      console.log(`⚠️ Solo ${scheduleMatches.length} horarios, marcando para reintento`)
      failedCuils.push({
        cuil,
        rawText: cleanedText.substring(nameSearchStart, scheduleSearchEnd),
      })
      continue
    }

    // Crear estructura de horarios
    const weeklySchedule = {
      lunes: scheduleMatches[0],
      martes: scheduleMatches[1],
      miercoles: scheduleMatches[2],
      jueves: scheduleMatches[3],
      viernes: scheduleMatches[4],
      sabado: scheduleMatches[5],
      domingo: scheduleMatches[6],
    }

    const dailySchedules = weekDates.map((dateInfo, index) => {
      const schedule = scheduleMatches[index]
      const { hours, nightHours } = calculateDayHours(schedule)
      return { ...dateInfo, schedule, hours, nightHours }
    })

    employees.push({ name, cuil, weeklySchedule, dailySchedules })
    usedNames.add(name)
    console.log(`✅ ${employees.length}. ${name} - ${cuil}`)
  }

  if (failedCuils.length > 0) {
    console.log(`\n=== REINTENTOS PARA ${failedCuils.length} CUILS FALLIDOS ===`)

    for (const failed of failedCuils) {
      console.log(`\nReintentando CUIL: ${failed.cuil}`)

      // Método alternativo: buscar por línea completa
      const lines = failed.rawText.split(/\s{2,}/)

      for (const line of lines) {
        if (!line.includes(failed.cuil)) continue

        // Extraer nombre
        const beforeCuil = line.substring(0, line.indexOf(failed.cuil.replace(/-/g, ""))).trim()
        const nameMatch = beforeCuil.match(
          /([A-ZÁÉÍÓÚÑ']+(?:\s+[A-ZÁÉÍÓÚÑ']+)*)\s*,\s*([A-ZÁÉÍÓÚÑa-záéíóúñ']+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ']+)*)$/i,
        )

        if (!nameMatch) continue

        const name = `${nameMatch[1].trim()} , ${nameMatch[2].trim()}`

        if (usedNames.has(name)) {
          console.log(`  Nombre duplicado: "${name}", omitiendo`)
          continue
        }

        // Extraer horarios
        const afterCuil = line.substring(
          line.indexOf(failed.cuil.replace(/-/g, "")) + failed.cuil.replace(/-/g, "").length,
        )
        const scheduleMatches = [...afterCuil.matchAll(/(\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}|Descanso)/gi)]

        if (scheduleMatches.length === 7) {
          const schedules = scheduleMatches.map((m) => m[1].trim().replace(/[-–—]/g, "-"))

          const weeklySchedule = {
            lunes: schedules[0],
            martes: schedules[1],
            miercoles: schedules[2],
            jueves: schedules[3],
            viernes: schedules[4],
            sabado: schedules[5],
            domingo: schedules[6],
          }

          const dailySchedules = weekDates.map((dateInfo, index) => {
            const schedule = schedules[index]
            const { hours, nightHours } = calculateDayHours(schedule)
            return { ...dateInfo, schedule, hours, nightHours }
          })

          employees.push({ name, cuil: failed.cuil, weeklySchedule, dailySchedules })
          usedNames.add(name)
          console.log(`✅ RECUPERADO: ${employees.length}. ${name} - ${failed.cuil}`)
          break
        }
      }
    }
  }

  console.log(`\n=== RESULTADO FINAL: ${employees.length} EMPLEADOS PROCESADOS ===`)

  if (employees.length < 22) {
    console.warn(`⚠️ ADVERTENCIA: Solo se procesaron ${employees.length}/22 empleados esperados`)
  }

  return employees
}

// Función para calcular horas de un día específico
const calculateDayHours = (schedule: string): { hours: number; nightHours: number } => {
  if (!schedule || schedule.toLowerCase().includes("descanso")) {
    return { hours: 0, nightHours: 0 }
  }

  const timeRange = parseTimeRange(schedule)
  if (!timeRange) {
    return { hours: 0, nightHours: 0 }
  }

  const startHour = Number.parseInt(timeRange.start.split(":")[0])
  const startMinute = Number.parseInt(timeRange.start.split(":")[1])
  const endHour = Number.parseInt(timeRange.end.split(":")[0])
  const endMinute = Number.parseInt(timeRange.end.split(":")[1])

  const startMinutes = startHour * 60 + startMinute
  let endMinutes = endHour * 60 + endMinute

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  const totalMinutes = endMinutes - startMinutes
  const hours = totalMinutes / 60

  // Calcular horas nocturnas (22:00 - 06:00)
  const nightStart = 22 * 60
  const nightEnd = 6 * 60
  let nightMinutes = 0

  if (endMinutes <= 24 * 60) {
    if (startMinutes < 24 * 60 && endMinutes > nightStart) {
      const intersectStart = Math.max(startMinutes, nightStart)
      const intersectEnd = Math.min(endMinutes, 24 * 60)
      nightMinutes += Math.max(0, intersectEnd - intersectStart)
    }
    if (startMinutes < nightEnd && endMinutes > 0) {
      const intersectStart = Math.max(startMinutes, 0)
      const intersectEnd = Math.min(endMinutes, nightEnd)
      nightMinutes += Math.max(0, intersectEnd - intersectStart)
    }
  } else {
    if (startMinutes < 24 * 60) {
      const intersectStart = Math.max(startMinutes, nightStart)
      const intersectEnd = 24 * 60
      nightMinutes += Math.max(0, intersectEnd - intersectStart)
    }
    const afterMidnightEnd = endMinutes - 24 * 60
    if (afterMidnightEnd > 0) {
      const intersectStart = 0
      const intersectEnd = Math.min(afterMidnightEnd, nightEnd)
      nightMinutes += Math.max(0, intersectEnd - intersectStart)
    }
  }

  const nightHours = nightMinutes / 60

  return {
    hours: Math.round(hours * 10) / 10,
    nightHours: Math.round(nightHours * 10) / 10,
  }
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

// Función para calcular estadísticas del usuario con fechas reales
const calculateUserStatsWithDates = (
  employee: Employee,
): {
  totalHours: number
  nightHours: number
  daysWorked: number
  dailyBreakdown: DailySchedule[]
} => {
  console.log(`\n=== Calculando estadísticas con fechas para ${employee.name} ===`)

  const dailyBreakdown = employee.dailySchedules.filter((day) => day.hours > 0)
  const totalHours = employee.dailySchedules.reduce((sum, day) => sum + day.hours, 0)
  const nightHours = employee.dailySchedules.reduce((sum, day) => sum + day.nightHours, 0)
  const daysWorked = dailyBreakdown.length

  console.log(`Días trabajados: ${daysWorked}`)
  console.log(`Horas totales: ${totalHours}h`)
  console.log(`Horas nocturnas: ${nightHours}h`)
  console.log(`Desglose por fecha:`)
  dailyBreakdown.forEach((day) => {
    console.log(`  ${day.date} (${day.dayName}): ${day.schedule} - ${day.hours}h (${day.nightHours}h nocturnas)`)
  })

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    nightHours: Math.round(nightHours * 10) / 10,
    daysWorked,
    dailyBreakdown,
  }
}

// Función para procesar quincenas con fechas reales
const processFortnightsWithDates = (updatedData: StoredData): StoredData => {
  console.log("\n=== PROCESANDO QUINCENAS CON FECHAS REALES ===")

  const newFortnights: { [key: string]: FortnightData } = {}
  const newMonths: { [key: string]: MonthData } = {}

  // Agrupar todos los días trabajados por quincena
  const fortnightGroups: { [key: string]: DailySchedule[] } = {}
  const monthGroups: { [key: string]: DailySchedule[] } = {}

  Object.values(updatedData.weeks).forEach((week) => {
    if (week.userStats?.dailyBreakdown) {
      week.userStats.dailyBreakdown.forEach((day) => {
        // Agrupar por quincena
        const fortnightKey = `${day.year}-${day.month}-${day.fortnight}`
        if (!fortnightGroups[fortnightKey]) {
          fortnightGroups[fortnightKey] = []
        }
        fortnightGroups[fortnightKey].push(day)

        // Agrupar por mes
        const monthKey = `${day.year}-${day.month}`
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = []
        }
        monthGroups[monthKey].push(day)
      })
    }
  })

  // Procesar quincenas
  Object.entries(fortnightGroups).forEach(([fortnightKey, days]) => {
    const [year, month, fortnightNumber] = fortnightKey.split("-").map(Number)

    // Calcular totales
    const totalHours = days.reduce((sum, day) => sum + day.hours, 0)
    const totalNightHours = days.reduce((sum, day) => sum + day.nightHours, 0)
    const totalDaysWorked = days.length

    // Determinar si la quincena está completa (al menos 10 días trabajados en 15 días posibles)
    const expectedDays = fortnightNumber === 1 ? 15 : new Date(year, month + 1, 0).getDate() - 15
    const completionPercentage = (days.length / Math.min(expectedDays, 15)) * 100

    if (completionPercentage >= 60) {
      // Considerar completa si tiene al menos 60% de cobertura
      const fortnightData: FortnightData = {
        id: fortnightKey,
        year,
        month,
        fortnightNumber,
        weeks: [], // Se llenará después
        totalHours: Math.round(totalHours * 10) / 10,
        totalNightHours: Math.round(totalNightHours * 10) / 10,
        totalDaysWorked,
        period: `${fortnightNumber === 1 ? "Primera" : "Segunda"} quincena de ${MONTH_NAMES[month]} ${year}`,
        completedAt: new Date().toISOString(),
        dailyBreakdown: days.sort(
          (a, b) =>
            new Date(a.date.split("/").reverse().join("-")).getTime() -
            new Date(b.date.split("/").reverse().join("-")).getTime(),
        ),
      }

      newFortnights[fortnightKey] = fortnightData
      console.log(`✅ Quincena completa: ${fortnightData.period} (${totalDaysWorked} días, ${totalHours}h)`)
    } else {
      console.log(
        `⏳ Quincena incompleta: ${MONTH_NAMES[month]} ${year} Q${fortnightNumber} (${days.length} días, ${completionPercentage.toFixed(1)}% completa)`,
      )
    }
  })

  // Procesar meses
  Object.entries(monthGroups).forEach(([monthKey, days]) => {
    const [year, month] = monthKey.split("-").map(Number)

    const totalHours = days.reduce((sum, day) => sum + day.hours, 0)
    const totalNightHours = days.reduce((sum, day) => sum + day.nightHours, 0)
    const totalDaysWorked = days.length

    const monthData: MonthData = {
      id: monthKey,
      year,
      month,
      totalHours: Math.round(totalHours * 10) / 10,
      totalNightHours: Math.round(totalNightHours * 10) / 10,
      totalDaysWorked,
      period: `${MONTH_NAMES[month]} ${year}`,
      fortnights: Object.keys(newFortnights).filter((key) => key.startsWith(`${year}-${month}-`)),
      dailyBreakdown: days.sort(
        (a, b) =>
          new Date(a.date.split("/").reverse().join("-")).getTime() -
          new Date(b.date.split("/").reverse().join("-")).getTime(),
      ),
    }

    newMonths[monthKey] = monthData
    console.log(`📅 Mes procesado: ${monthData.period} (${totalDaysWorked} días, ${totalHours}h)`)
  })

  return {
    ...updatedData,
    fortnights: newFortnights,
    months: newMonths,
  }
}

export default function KFCScheduleApp() {
  const [cuilInput, setCuilInput] = useState("")
  const [currentWeekData, setCurrentWeekData] = useState<WeekData | null>(null)
  const [currentUser, setCurrentUser] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [coincidences, setCoincidences] = useState<{ [key: string]: Employee[] }>({})
  const [dayTabs, setDayTabs] = useState<{ [key: string]: "coincidences" | "shifts" }>({})
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [storedData, setStoredData] = useState<StoredData>({
    weeks: {},
    fortnights: {},
    months: {},
    currentWeek: null,
    loadedAt: new Date().toISOString(),
  })
  const [hourTrackerTab, setHourTrackerTab] = useState<"planned" | "actual">("planned")
  const [weeklyHourTracker, setWeeklyHourTracker] = useState<WeeklyHourTracker>({
    planned: 0,
    actual: {},
    totalPlanned: 0,
    totalActual: 0,
  })

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

  // Buscar usuario cuando cambie el CUIL o la semana actual
  useEffect(() => {
    if (currentWeekData && cuilInput) {
      findCurrentUser()
    }
  }, [cuilInput, currentWeekData])

  // Auto-cargar último PDF (simulado)
  useEffect(() => {
    if (pdfLoaded && cuilInput && Object.keys(storedData.weeks).length === 0) {
      // Simular carga automática del último PDF
      console.log("🔄 Buscando último PDF en carpeta /Horarios...")
      // En una implementación real, aquí se leería el archivo más reciente
    }
  }, [pdfLoaded, cuilInput, storedData.weeks])

  useEffect(() => {
    const savedTracker = localStorage.getItem("kfc-hour-tracker")
    if (savedTracker) {
      try {
        const tracker: WeeklyHourTracker = JSON.parse(savedTracker)
        setWeeklyHourTracker(tracker)
        console.log("📊 Contador de horas cargado desde localStorage")
      } catch (error) {
        console.error("Error al cargar contador de horas:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("kfc-hour-tracker", JSON.stringify(weeklyHourTracker))
  }, [weeklyHourTracker])

  const loadStoredData = () => {
    try {
      const storedDataStr = localStorage.getItem("kfc-schedule-data")
      if (storedDataStr) {
        console.log("Cargando datos del localStorage...")
        const data: StoredData = JSON.parse(storedDataStr)

        Object.values(data.weeks).forEach((week) => {
          week.startDate = new Date(week.startDate)
          week.endDate = new Date(week.endDate)
        })

        console.log(
          `Datos cargados: ${Object.keys(data.weeks).length} semanas, ${Object.keys(data.fortnights).length} quincenas, ${Object.keys(data.months || {}).length} meses`,
        )

        setStoredData(data)

        if (data.currentWeek && data.weeks[data.currentWeek]) {
          console.log(`Cargando semana actual: ${data.currentWeek}`)
          setCurrentWeekData(data.weeks[data.currentWeek])
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del localStorage:", error)
      localStorage.removeItem("kfc-schedule-data")
    }
  }

  const saveDataToStorage = (data: StoredData) => {
    try {
      localStorage.setItem("kfc-schedule-data", JSON.stringify(data))
      console.log("Datos guardados en localStorage")
    } catch (error) {
      console.error("Error al guardar en localStorage:", error)
    }
  }

  const clearStoredData = () => {
    localStorage.removeItem("kfc-schedule-data")
    setStoredData({
      weeks: {},
      fortnights: {},
      months: {},
      currentWeek: null,
      loadedAt: new Date().toISOString(),
    })
    setCurrentWeekData(null)
    setCurrentUser(null)
    setCoincidences({})
    setError("")
    // Limpiar también el contador de horas al limpiar todos los datos
    setWeeklyHourTracker({
      planned: 0,
      actual: {},
      totalPlanned: 0,
      totalActual: 0,
    })
    localStorage.removeItem("kfc-hour-tracker")
  }

  const findCurrentUser = () => {
    if (!currentWeekData) return

    const formattedCuil = getFormattedCUIL()
    if (!formattedCuil || formattedCuil.length < 11) return

    console.log(`Buscando usuario con CUIL: ${formattedCuil}`)

    const user = currentWeekData.employees.find((emp) => {
      const empCuilClean = emp.cuil.replace(/-/g, "")
      const searchCuilClean = formattedCuil.replace(/-/g, "")
      return emp.cuil === formattedCuil || empCuilClean === searchCuilClean
    })

    if (user) {
      console.log(`✅ Usuario encontrado: ${user.name}`)
      setCurrentUser(user)
      const userCoincidences = findCoincidences(user, currentWeekData.employees)
      setCoincidences(userCoincidences)
      setError("")
    } else if (currentWeekData.employees.length > 0) {
      console.log(`❌ No se encontró usuario con CUIL: ${formattedCuil}`)
      setError(`No se encontró ningún empleado con CUIL: ${formattedCuil}`)
      setCurrentUser(null)
      setCoincidences({})
    }
  }

  const formatCUIL = (value: string): string => {
    if (!value) return ""

    const numbers = value.replace(/\D/g, "")
    const limited = numbers.slice(0, 11)

    if (limited.length >= 10) {
      return `${limited.slice(0, 2)}-${limited.slice(2, 10)}-${limited.slice(10)}`
    } else if (limited.length >= 2) {
      return `${limited.slice(0, 2)}-${limited.slice(2)}`
    }

    return limited
  }

  const getFormattedCUIL = (): string => {
    return formatCUIL(cuilInput)
  }

  const handleCuilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCUIL(e.target.value)
    setCuilInput(formatted)
  }

  const timesOverlap = (time1: TimeRange, time2: TimeRange): boolean => {
    const start1 = Number.parseInt(time1.start.replace(":", ""))
    const end1 = Number.parseInt(time1.end.replace(":", ""))
    const start2 = Number.parseInt(time2.start.replace(":", ""))
    const end2 = Number.parseInt(time2.end.replace(":", ""))

    const adjustedEnd1 = end1 < start1 ? end1 + 2400 : end1
    const adjustedEnd2 = end2 < start2 ? end2 + 2400 : end2

    return start1 < adjustedEnd2 && start2 < adjustedEnd1
  }

  const findCoincidences = (user: Employee, allEmployees: Employee[]) => {
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

  const readPDF = async (file: File): Promise<string> => {
    if (!pdfjsLib) {
      throw new Error("PDF.js no está cargado")
    }

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    let fullText = ""

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str || "").join(" ")
      fullText += pageText + " "
    }

    return fullText.trim()
  }

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
      console.log("🔄 Procesando PDF con nueva lógica de fechas...")
      const rawText = await parsePDF(file) // Usar parsePDF que ya incluye clean y detectWeekInfo
      const weekInfo = detectWeekInfo(rawText) // Re-detectar semana info por si acaso el parsePDF no lo hiciera internamente

      console.log(`📅 Semana detectada: ${weekInfo.period}`)
      console.log(`📅 Fecha inicio: ${weekInfo.startDate.toLocaleDateString("es-AR")}`)

      const parsedEmployees = parseEmployeesFromText(rawText, weekInfo.startDate)

      if (parsedEmployees.length === 0) {
        setError("No se pudieron extraer empleados del PDF. Verifica que el formato sea correcto.")
        return
      }

      const weekId = `${weekInfo.startDate.getFullYear()}-${String(weekInfo.startDate.getMonth() + 1).padStart(2, "0")}-${String(weekInfo.startDate.getDate()).padStart(2, "0")}_${String(weekInfo.endDate.getDate()).padStart(2, "0")}`

      const existingWeek = Object.values(storedData.weeks).find(
        (week) =>
          week.startDate.getTime() === weekInfo.startDate.getTime() &&
          week.endDate.getTime() === weekInfo.endDate.getTime(),
      )

      if (existingWeek) {
        setError(`Esta semana (${weekInfo.period}) ya está cargada.`)
        return
      }

      let userStats:
        | {
            totalHours: number
            nightHours: number
            daysWorked: number
            dailyBreakdown: DailySchedule[]
          }
        | undefined

      const formattedCuil = getFormattedCUIL()
      if (formattedCuil) {
        const user = parsedEmployees.find(
          (emp) => emp.cuil === formattedCuil || emp.cuil.replace(/-/g, "") === formattedCuil.replace(/-/g, ""),
        )
        if (user) {
          userStats = calculateUserStatsWithDates(user)
        }
      }

      const weekData: WeekData = {
        id: weekId,
        weekNumber: Math.ceil(
          ((weekInfo.startDate.getTime() - new Date(weekInfo.startDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) /
            7,
        ),
        year: weekInfo.startDate.getFullYear(),
        startDate: weekInfo.startDate,
        endDate: weekInfo.endDate,
        period: weekInfo.period,
        employees: parsedEmployees,
        userStats,
        loadedAt: new Date().toISOString(),
      }

      let updatedData: StoredData = {
        ...storedData,
        weeks: {
          ...storedData.weeks,
          [weekId]: weekData,
        },
        currentWeek: weekId,
        loadedAt: new Date().toISOString(),
      }

      // Procesar quincenas y meses con fechas reales
      updatedData = processFortnightsWithDates(updatedData)

      setStoredData(updatedData)
      setCurrentWeekData(weekData)
      saveDataToStorage(updatedData)

      setWeeklyHourTracker((prev) => ({
        ...prev,
        planned: 0, // Resetear input de horas previstas
        actual: {}, // Resetear inputs de horas reales
        // totalPlanned y totalActual se mantienen (acumulado quincenal)
      }))

      console.log(`✅ Semana procesada con fechas reales. Total: ${Object.keys(updatedData.weeks).length} semanas`)
      console.log(`📊 Quincenas: ${Object.keys(updatedData.fortnights).length}`)
      console.log(`📅 Meses: ${Object.keys(updatedData.months || {}).length}`)
    } catch (err: any) {
      setError(`Error al procesar el PDF: ${err.message}`)
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

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

  const getCurrentFortnight = (): FortnightData | null => {
    if (!currentWeekData || !currentWeekData.userStats?.dailyBreakdown) return null

    // Buscar quincena que contenga días de la semana actual
    const currentDays = currentWeekData.userStats.dailyBreakdown

    for (const fortnight of Object.values(storedData.fortnights)) {
      const hasMatchingDays = currentDays.some((day) => fortnight.dailyBreakdown.some((fDay) => fDay.date === day.date))
      if (hasMatchingDays) {
        return fortnight
      }
    }

    return null
  }

  const getCurrentMonth = (): MonthData | null => {
    if (!currentWeekData || !currentWeekData.userStats?.dailyBreakdown) return null

    const currentDays = currentWeekData.userStats.dailyBreakdown

    for (const month of Object.values(storedData.months || {})) {
      const hasMatchingDays = currentDays.some((day) => month.dailyBreakdown.some((mDay) => mDay.date === day.date))
      if (hasMatchingDays) {
        return month
      }
    }

    return null
  }

  const calculateActualHours = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0

    const [inHour, inMinute] = checkIn.split(":").map(Number)
    const [outHour, outMinute] = checkOut.split(":").map(Number)

    if (isNaN(inHour) || isNaN(inMinute) || isNaN(outHour) || isNaN(outMinute)) return 0

    const inMinutes = inHour * 60 + inMinute
    let outMinutes = outHour * 60 + outMinute

    // Si la salida es menor que la entrada, es del día siguiente
    if (outMinutes < inMinutes) {
      outMinutes += 24 * 60
    }

    const totalMinutes = outMinutes - inMinutes
    return Math.round((totalMinutes / 60) * 100) / 100
  }

  const updateActualHours = (day: string, checkIn: string, checkOut: string) => {
    const totalHours = calculateActualHours(checkIn, checkOut)

    setWeeklyHourTracker((prev) => {
      const newActual = {
        ...prev.actual,
        [day]: {
          checkIn,
          checkOut,
          totalHours,
        },
      }

      const weekTotal = Object.values(newActual).reduce((sum, entry) => sum + entry.totalHours, 0)

      return {
        ...prev,
        actual: newActual,
        totalActual: prev.totalActual - (prev.actual[day]?.totalHours || 0) + totalHours,
      }
    })
  }

  const addPlannedHours = () => {
    setWeeklyHourTracker((prev) => ({
      ...prev,
      totalPlanned: prev.totalPlanned + prev.planned,
    }))
  }

  const updatePlannedHours = (hours: number) => {
    setWeeklyHourTracker((prev) => ({
      ...prev,
      planned: hours,
    }))
  }

  const resetFortnightTracker = () => {
    if (confirm("¿Estás seguro de que deseas reiniciar el contador de quincena?")) {
      setWeeklyHourTracker({
        planned: 0,
        actual: {},
        totalPlanned: 0,
        totalActual: 0,
      })
      localStorage.removeItem("kfc-hour-tracker")
    }
  }

  const scrollToCoincidence = (day: string) => {
    const element = document.getElementById(`coincidence-${day}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      // Resaltar temporalmente el elemento
      element.classList.add("ring-4", "ring-blue-500")
      setTimeout(() => {
        element.classList.remove("ring-4", "ring-blue-500")
      }, 2000)
    }
  }

  const findShiftReplacements = (userSchedule: string, day: string, allEmployees: Employee[]) => {
    if (!userSchedule || userSchedule.toLowerCase().includes("descanso")) {
      return { canCoverMe: [] }
    }

    const userTime = parseTimeRange(userSchedule)
    if (!userTime) {
      return { canCoverMe: [] }
    }

    const canCoverMe: Employee[] = []

    allEmployees.forEach((emp) => {
      if (emp.cuil === currentUser?.cuil) return

      const empSchedule = emp.weeklySchedule[day as keyof typeof emp.weeklySchedule]

      // Solo considerar empleados que trabajan ese día
      if (empSchedule && !empSchedule.toLowerCase().includes("descanso")) {
        const empTime = parseTimeRange(empSchedule)
        if (!empTime) return

        const userStart = userTime.start // "HH:MM"
        const userEnd = userTime.end // "HH:MM"
        const empStart = empTime.start
        const empEnd = empTime.end

        // Limita si su salida es exactamente mi entrada, o su entrada es exactamente mi salida
        const coversAtStart = empEnd === userStart // Su salida = Mi entrada
        const coversAtEnd = empStart === userEnd // Su entrada = Mi salida

        if (coversAtStart || coversAtEnd) {
          canCoverMe.push(emp)
        }
      }
    })

    return { canCoverMe }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-2 sm:p-4 font-light font-mono">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
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

        {/* Input Section */}
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
                <Label htmlFor="cuil" className="text-base sm:text-lg font-semibold text-gray-700">
                  🆔 Tu CUIL
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
                  📄 Cargar PDF Semanal
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
                    <span className="text-sm">⏳ Cargando sistema...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={clearStoredData}
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
                  🔄 Procesando PDF...
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

        {currentWeekData && currentUser && (
          <>
            <Card className="shadow-lg border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl text-blue-700 flex items-center gap-2">📊 Resumen</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {currentWeekData.userStats?.daysWorked || 0}
                    </div>
                    <div className="text-sm font-semibold text-green-600">📆 Días Trabajados</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {currentWeekData.userStats?.totalHours || 0}h
                    </div>
                    <div className="text-sm font-semibold text-blue-600">⏱️ Horas Totales</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-purple-700">
                      {currentWeekData.userStats?.nightHours || 0}h
                    </div>
                    <div className="text-sm font-semibold text-purple-600">🌙 Horas Nocturnas</div>
                    <div className="text-xs text-purple-500">(22:00 - 06:00)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl text-green-700 flex items-center gap-2">
                  👤 <span className="truncate">{currentUser.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:pt-6">
                <div className="space-y-3 sm:space-y-4">
                  {currentUser.dailySchedules.map((daySchedule) => {
                    const isRest = daySchedule.schedule.toLowerCase().includes("descanso")

                    return (
                      <div
                        key={daySchedule.date}
                        // Añadir onClick para hacer scroll a la coincidencia si no es descanso
                        onClick={() => !isRest && scrollToCoincidence(daySchedule.dayName)}
                        className={`flex justify-between items-center p-3 sm:p-4 rounded-xl transition-all ${
                          isRest
                            ? "bg-gray-100 border-2 border-gray-200"
                            : // Añadir estilos para hacer el div clicable y visible
                              "bg-blue-50 border-2 border-blue-200 cursor-pointer hover:bg-blue-100 hover:border-blue-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-base sm:text-lg text-gray-700">
                            {isRest ? "😴" : "💼"} {DAY_NAMES[daySchedule.dayName as keyof typeof DAY_NAMES]}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant={isRest ? "secondary" : "default"}
                            className={`text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2 ${
                              isRest ? "bg-gray-200 text-gray-700" : "bg-blue-600 text-white"
                            }`}
                          >
                            {isRest ? "😴 Descanso" : `⏰ ${daySchedule.schedule}`}
                          </Badge>
                          {!isRest && (
                            <div className="text-xs text-gray-500">
                              ⏱️ {daySchedule.hours}h{" "}
                              {daySchedule.nightHours > 0 && `(🌙 ${daySchedule.nightHours}h nocturnas)`}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

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
                        onChange={(e) => updatePlannedHours(Number(e.target.value))}
                        className="text-lg h-12 border-2 border-indigo-200 focus:border-indigo-400"
                        step="0.5"
                        min="0"
                      />
                      <Button
                        onClick={addPlannedHours}
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
                            <div className="font-medium text-gray-700 mb-3">
                              📅{DAY_NAMES[day as keyof typeof DAY_NAMES]}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`${day}-in`} className="text-sm text-gray-600">
                                  🟢 Entrada
                                </Label>
                                <Input
                                  id={`${day}-in`}
                                  type="time"
                                  value={actualEntry?.checkIn || ""}
                                  onChange={(e) => updateActualHours(day, e.target.value, actualEntry?.checkOut || "")}
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
                                  onChange={(e) => updateActualHours(day, actualEntry?.checkIn || "", e.target.value)}
                                  className="h-10 border-indigo-200"
                                />
                              </div>
                            </div>
                            {actualEntry && actualEntry.totalHours > 0 && (
                              <div className="mt-2 text-sm text-green-600 font-medium">
                                ✅ Total: {actualEntry.totalHours}h
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                        <div className="text-sm text-green-600 mb-1">📊 Acumulado quincenal</div>
                        <div className="text-2xl font-bold text-green-700">
                          {weeklyHourTracker.totalActual.toFixed(2)}h
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {weeklyHourTracker.totalPlanned > 0 && weeklyHourTracker.totalActual > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                    <div className="text-lg font-bold text-yellow-700">
                      📊 Diferencia:{" "}
                      {Math.abs(weeklyHourTracker.totalActual - weeklyHourTracker.totalPlanned).toFixed(2)}h
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
                    onClick={resetFortnightTracker}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Nueva Quincena
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl text-blue-700 flex items-center gap-2">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />👥 Coincidencias y Pases
                </CardTitle>
                <CardDescription className="text-base sm:text-lg">
                  Con quien trabajas y a quien le haces el pase
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:pt-6">
                <div className="space-y-3 sm:space-y-4">
                  {DAYS.map((day) => {
                    const dayCoincidences = coincidences[day] || []
                    const userSchedule = currentUser.weeklySchedule[day as keyof typeof currentUser.weeklySchedule]
                    const { canCoverMe } = findShiftReplacements(userSchedule, day, currentWeekData.employees)
                    const currentTab = dayTabs[day] || "coincidences"

                    if (userSchedule.toLowerCase().includes("descanso")) {
                      return (
                        <div
                          key={day}
                          // Añadir ID para hacer scroll
                          id={`coincidence-${day}`}
                          className="p-3 sm:p-4 rounded-xl bg-gray-100 border-2 border-gray-200 transition-all"
                        >
                          <div className="font-bold text-base sm:text-lg text-gray-600 flex items-center gap-2">
                            😴 {DAY_NAMES[day as keyof typeof DAY_NAMES]} - Descanso
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={day}
                        // Añadir ID para hacer scroll
                        id={`coincidence-${day}`}
                        className="p-3 sm:p-4 rounded-xl border-2 bg-white border-blue-200 transition-all"
                      >
                        <div className="font-bold text-base sm:text-lg mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="flex items-center gap-2">📅 {DAY_NAMES[day as keyof typeof DAY_NAMES]}</span>
                          <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                            ⏰ {userSchedule}
                          </Badge>
                        </div>

                        <Tabs
                          value={currentTab}
                          onValueChange={(v) =>
                            setDayTabs((prev) => ({ ...prev, [day]: v as "coincidences" | "shifts" }))
                          }
                          className="mt-3"
                        >
                          <TabsList className="grid w-full grid-cols-2 mb-3">
                            <TabsTrigger value="coincidences" className="text-xs sm:text-sm">
                              👥 Coincidencias ({dayCoincidences.length})
                            </TabsTrigger>
                            <TabsTrigger value="shifts" className="text-xs sm:text-sm">
                              🔄 Pases ({canCoverMe.length})
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="coincidences" className="mt-0">
                            {dayCoincidences.length > 0 ? (
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-green-700 mb-2">
                                  ✅ {dayCoincidences.length} coincidencia{dayCoincidences.length > 1 ? "s" : ""}:
                                </div>
                                {dayCoincidences.map((emp) => (
                                  <div
                                    key={emp.cuil}
                                    className="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200 shadow-sm"
                                  >
                                    <div className="font-semibold text-sm sm:text-base text-gray-800 truncate">
                                      👤 {emp.name}
                                    </div>
                                    <div className="text-green-600 font-medium text-sm">
                                      ⏰ {emp.weeklySchedule[day as keyof typeof emp.weeklySchedule]}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-orange-600 font-medium text-sm sm:text-base py-2">
                                ⚠️ Trabajas solo este día
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="shifts" className="mt-0">
                            <div className="space-y-3">
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="text-sm font-semibold text-blue-700 mb-2">
                                  🔄 Entra/sale por mi ({canCoverMe.length}):
                                </div>
                                {canCoverMe.length > 0 ? (
                                  <div className="space-y-2">
                                    {canCoverMe.map((emp) => (
                                      <div key={emp.cuil} className="bg-white p-2 rounded border border-blue-100">
                                        <div className="font-medium text-sm text-gray-800 truncate">👤 {emp.name}</div>
                                        <div className="text-blue-600 text-xs">
                                          ⏰ Trabaja: {emp.weeklySchedule[day as keyof typeof emp.weeklySchedule]}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-gray-500 text-sm">
                                    ⚠️ No hay empleados que limitan con tu horario
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Eliminar pestañas de Quincena, Mes, Historial */}
      </div>
    </div>
  )
}
