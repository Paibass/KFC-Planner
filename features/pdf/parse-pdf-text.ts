import { getPdfjsLib } from "./load-pdfjs"
import { cleanPDFText } from "./clean-pdf-text"

export const parsePDF = async (file: File): Promise<string> => {
  const pdfjsLib = getPdfjsLib()
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

  return cleanPDFText(fullText.trim())
}

export const readPDF = async (file: File): Promise<string> => {
  const pdfjsLib = getPdfjsLib()
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
