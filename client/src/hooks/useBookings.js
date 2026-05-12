import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/api'

function cleanFilters(filters) {
  const query = {}
  if (filters?.date) query.date = filters.date
  if (filters?.dateFrom) query.dateFrom = filters.dateFrom
  if (filters?.dateTo) query.dateTo = filters.dateTo
  if (filters?.vehicleIds?.length) query.vehicleId = filters.vehicleIds.join(',')
  if (filters?.driverId) query.driverId = filters.driverId
  if (filters?.status && filters.status !== 'all') query.status = filters.status
  if (filters?.usageType && filters.usageType !== 'all') query.usageType = filters.usageType
  return query
}

export default function useBookings(filters = {}) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const query = useMemo(() => cleanFilters(filters), [filters])

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/bookings', { params: query })
      setBookings(data?.data?.bookings || [])
    } catch (loadError) {
      setBookings([])
      setError(loadError?.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadBookings()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadBookings])

  const checkAvailability = useCallback(async ({ date_from, date_to }) => {
    const { data } = await api.get('/bookings/availability', {
      params: { date_from, date_to },
    })
    return data?.data?.vehicles || []
  }, [])

  return {
    bookings,
    loading,
    error,
    reloadBookings: loadBookings,
    checkAvailability,
  }
}
