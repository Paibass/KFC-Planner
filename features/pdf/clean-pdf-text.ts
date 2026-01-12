export const cleanPDFText = (text: string): string => {
  return text
    .replace(/Departamento:.*?Domingo/gi, "")
    .replace(/Apellido y Nombre.*?Domingo/gi, "")
    .replace(/CUIL\s+Lunes.*?Domingo/gi, "")
    .replace(/Página \d+/gi, "")
    .replace(/https?:\/\/[^\s]+/gi, "")
    .replace(/\f/g, " ")
    .replace(/[ƟƟ]/g, "t")
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}
