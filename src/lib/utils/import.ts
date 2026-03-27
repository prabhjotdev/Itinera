import type { ExportData } from '@/types'

export function parseImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string)
        if (!raw.version || !Array.isArray(raw.trips)) {
          reject(new Error('Invalid export file format'))
          return
        }
        resolve(raw as ExportData)
      } catch {
        reject(new Error('File is not valid JSON'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
