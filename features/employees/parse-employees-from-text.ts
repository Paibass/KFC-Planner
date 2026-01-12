import type { Employee } from "@/types/schedule"
import { cleanPDFText } from "@/features/pdf/clean-pdf-text"
import { generateWeekDates } from "@/features/schedule/generate-week-dates"
import { calculateDayHours } from "./calculate-day-hours"

export const parseEmployeesFromText = (text: string, weekStartDate: Date): Employee[] => {
  const employees: Employee[] = []
  const usedNames = new Set<string>()
  const weekDates = generateWeekDates(weekStartDate)

  const cleanedText = cleanPDFText(text)

  console.log("=== PARSING OPTIMIZADO PARA EMPLEADOS ===")
  console.log(
    "Fechas de la semana:",
    weekDates.map((d) => `${d.dayName}: ${d.date}`),
  )

  const cuilPattern = /(\d{2})[\s-]*(\d{7,9})[\s-]*(\d)/g
  const cuilMatches = [...cleanedText.matchAll(cuilPattern)]

  console.log(`\nCUILs detectados: ${cuilMatches.length}`)
  cuilMatches.forEach((match, idx) => {
    const cuil = `${match[1]}-${match[2]}-${match[3]}`
    console.log(`  ${idx + 1}. ${cuil} en posición ${match.index}`)
  })

  const failedCuils: Array<{ cuil: string; rawText: string }> = []

  for (let i = 0; i < cuilMatches.length; i++) {
    const match = cuilMatches[i]
    const cuil = `${match[1]}-${match[2]}-${match[3]}`
    const cuilIndex = match.index!
    const cuilEndIndex = cuilIndex + match[0].length

    console.log(`\n--- CUIL ${i + 1}/${cuilMatches.length}: ${cuil} ---`)

    const nameSearchStart = i > 0 ? cuilMatches[i - 1].index! + cuilMatches[i - 1][0].length : 0
    const nameSearchEnd = cuilIndex
    const nameSegment = cleanedText.substring(nameSearchStart, nameSearchEnd).trim()

    let name = ""

    const namePattern1 =
      /([A-ZÁÉÍÓÚÑ']+(?:\s+[A-ZÁÉÍÓÚÑ']+)*)\s*,\s*([A-ZÁÉÍÓÚÑa-záéíóúñ']+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ']+)*)\s*$/i
    const nameMatch1 = nameSegment.match(namePattern1)

    if (nameMatch1) {
      name = `${nameMatch1[1].trim()} , ${nameMatch1[2].trim()}`
    } else {
      const words = nameSegment.split(/\s+/).filter((w) => w.length > 1 && /^[A-ZÁÉÍÓÚÑa-záéíóúñ']+$/.test(w))
      if (words.length >= 2) {
        const lastName = words[words.length - 2]
        const firstName = words[words.length - 1]
        name = `${lastName}, ${firstName}`
      }
    }

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

    const scheduleSearchStart = cuilEndIndex
    const scheduleSearchEnd = i < cuilMatches.length - 1 ? cuilMatches[i + 1].index! : cleanedText.length
    const scheduleSegment = cleanedText.substring(scheduleSearchStart, scheduleSearchEnd)

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

      const lines = failed.rawText.split(/\s{2,}/)

      for (const line of lines) {
        if (!line.includes(failed.cuil)) continue

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

  return employees
}
