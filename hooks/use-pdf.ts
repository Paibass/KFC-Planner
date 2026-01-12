"use client"

import { useState, useEffect } from "react"
import { loadPDFJS, getPdfjsLib } from "@/features/pdf/load-pdfjs"

export const usePdf = () => {
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadPDFJS()
      .then(() => {
        setPdfLoaded(true)
      })
      .catch(() => {
        setError("Error al cargar la librería PDF. Recarga la página.")
      })
  }, [])

  return {
    pdfLoaded,
    error,
    getPdfjsLib,
  }
}
