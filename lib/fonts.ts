import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google"

export const geist = Geist({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--v0-font-geist",
})

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--v0-font-geist-mono",
})

export const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--v0-font-source-serif-4",
})

export const fontVariables = `${geist.variable} ${geistMono.variable} ${sourceSerif4.variable}`
