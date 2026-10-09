import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Нормализует номер телефона для единообразного хранения в БД
 * Убирает пробелы, дефисы и другие разделители, оставляет только цифры и +
 */
export function normalizePhone(phone: string): string {
  if (!phone) return phone
  
  // Убираем все пробелы, дефисы, скобки и другие разделители
  // Оставляем только цифры и знак +
  return phone.replace(/[\s\-\(\)\.]/g, '').trim()
}
