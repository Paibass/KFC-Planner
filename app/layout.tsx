import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

import { Archivo as V0_Font_Archivo, Inconsolata as V0_Font_Inconsolata, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// Initialize fonts
const _archivo = V0_Font_Archivo({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"], variable: '--v0-font-archivo' })
const _inconsolata = V0_Font_Inconsolata({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"], variable: '--v0-font-inconsolata' })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"], variable: '--v0-font-source-serif-4' })
const _v0_fontVariables = `${_archivo.variable}`

export const metadata: Metadata = {
  title: "KFC Liniers",
  description: "Aplicación para ver tus horarios",
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
