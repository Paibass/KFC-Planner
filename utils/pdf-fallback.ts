// Fallback PDF text extraction using basic parsing
export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const uint8Array = new Uint8Array(arrayBuffer)

        // Convert to string and extract text between stream objects
        const text = ""
        const inTextObject = false
        const currentText = ""

        // Simple text extraction - look for text patterns
        const decoder = new TextDecoder("latin1")
        const pdfString = decoder.decode(uint8Array)

        // Extract text using regex patterns for PDF text objects
        const textMatches = pdfString.match(/$$(.*?)$$/g) || []
        const cleanedText = textMatches
          .map((match) => match.slice(1, -1)) // Remove parentheses
          .filter((text) => text.length > 0)
          .join(" ")

        // Also try to extract text from Tj operators
        const tjMatches = pdfString.match(/\[(.*?)\]\s*TJ/g) || []
        const tjText = tjMatches.map((match) => match.replace(/\[(.*?)\]\s*TJ/, "$1")).join(" ")

        const finalText = (cleanedText + " " + tjText).trim()

        if (finalText.length > 100) {
          resolve(finalText)
        } else {
          reject(new Error("No se pudo extraer texto suficiente del PDF"))
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Error al leer el archivo"))
    reader.readAsArrayBuffer(file)
  })
}
