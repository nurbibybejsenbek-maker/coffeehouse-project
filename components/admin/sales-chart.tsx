"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { useLocale } from 'next-intl'

interface SalesData {
  placedAt: Date | string
  totalAmount: number
}

interface SalesChartProps {
  data: SalesData[]
}

// Казахские названия месяцев
const kkMonths = [
  'Қаң', 'Ақп', 'Нау', 'Сәу', 'Мам', 'Мау',
  'Шіл', 'Там', 'Қыр', 'Қаз', 'Қар', 'Жел'
]

// Функция для форматирования даты в казахском формате
function formatDateKazakh(date: Date): string {
  const month = kkMonths[date.getMonth()]
  const day = date.getDate()
  return `${month} ${day}`
}

export function SalesChart({ data }: SalesChartProps) {
  const locale = useLocale()
  
  // Group data by day
  const groupedData = data.reduce((acc, item) => {
    const dateObj = new Date(item.placedAt)
    const date = locale === 'kk' 
      ? formatDateKazakh(dateObj)
      : format(dateObj, 'MMM d')
    const existing = acc.find((d) => d.date === date)
    if (existing) {
      existing.amount += item.totalAmount
      existing.count += 1
    } else {
      acc.push({ date, amount: item.totalAmount, count: 1 })
    }
    return acc
  }, [] as Array<{ date: string; amount: number; count: number }>)

  if (groupedData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={groupedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(0)} ₸`, 'Revenue']}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

