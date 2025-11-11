import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

import { Archivo as V0_Font_Archivo } from 'next/font/google'

// Initialize fonts
const _archivo = V0_Font_Archivo({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"], variable: '--v0-font-archivo' })
const _v0_fontVariables = `${_archivo.variable}`

export const metadata: Metadata = {
  title: "KFC Planificador de Turnos",
  description: "Aplicación para gestionar turnos de trabajo en KFC",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${_v0_fontVariables}`}>{children}</body>
    </html>
  )
}
