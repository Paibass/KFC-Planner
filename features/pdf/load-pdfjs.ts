let pdfjsLib: any = null

export const loadPDFJS = async (): Promise<any> => {
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

export const getPdfjsLib = () => pdfjsLib
