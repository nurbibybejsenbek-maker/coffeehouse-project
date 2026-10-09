"use client"

import { useState, useMemo } from 'react'

export interface FilterConfig<T> {
  [key: string]: {
    filterFn: (item: T, value: any) => boolean
    defaultValue?: any
  }
}

export function useFilters<T>(data: T[], config: FilterConfig<T>) {
  const [filters, setFilters] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    Object.keys(config).forEach((key) => {
      initial[key] = config[key].defaultValue ?? ''
    })
    return initial
  })

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === '') return true
        return config[key].filterFn(item, value)
      })
    })
  }, [data, filters, config])

  const setFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    const cleared: Record<string, any> = {}
    Object.keys(config).forEach((key) => {
      cleared[key] = config[key].defaultValue ?? ''
    })
    setFilters(cleared)
  }

  const clearFilter = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: config[key].defaultValue ?? '' }))
  }

  return {
    filters,
    filteredData,
    setFilter,
    clearFilters,
    clearFilter,
  }
}

