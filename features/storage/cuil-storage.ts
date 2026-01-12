const STORAGE_KEY = "kfc-cuil"

export const loadCuil = (): string | null => {
  return localStorage.getItem(STORAGE_KEY)
}

export const saveCuil = (cuil: string): void => {
  localStorage.setItem(STORAGE_KEY, cuil)
}

export const clearCuil = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}
