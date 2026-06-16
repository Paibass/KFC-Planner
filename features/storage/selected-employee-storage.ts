const STORAGE_KEY = "kfc-selected-employee"

export const loadSelectedEmployee = (): string | null => {
  return localStorage.getItem(STORAGE_KEY)
}

export const saveSelectedEmployee = (cuil: string): void => {
  localStorage.setItem(STORAGE_KEY, cuil)
}

export const clearSelectedEmployee = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}
