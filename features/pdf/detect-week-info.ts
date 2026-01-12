export const detectWeekInfo = (text: string): { startDate: Date; endDate: Date; period: string } => {
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
