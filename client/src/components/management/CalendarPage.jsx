import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../shared/Navbar'
import api from '../../api/api'
import useBookings from '../../hooks/useBookings'
import MonthView from './MonthView'
import WeekView from './WeekView'
import DayView from './DayView'
import BookingModal from './BookingModal'
import NewBookingModal from './NewBookingModal'

const viewLabels = ['month', 'week', 'day']
const SKELETON_ITEM_COUNT = 14

const vehiclePalette = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-cyan-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-indigo-600',
]

export default function CalendarPage() {
  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [newBookingDate, setNewBookingDate] = useState(null)
  const [toast, setToast] = useState('')
  const [filters, setFilters] = useState({ vehicleIds: [], driverId: '', usageType: 'all', status: 'all' })

  const range = useMemo(() => getRangeForView(currentDate, view), [currentDate, view])
  const bookingFilters = useMemo(
    () => ({
      dateFrom: range.start.toISOString(),
      dateTo: range.end.toISOString(),
      vehicleIds: filters.vehicleIds,
      driverId: filters.driverId,
      usageType: filters.usageType,
      status: filters.status,
    }),
    [filters.driverId, filters.status, filters.usageType, filters.vehicleIds, range.end, range.start],
  )

  const { bookings, loading, error, reloadBookings, checkAvailability } = useBookings(bookingFilters)

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [{ data: vehiclesData }, { data: driversData }] = await Promise.all([
          api.get('/vehicles'),
          api.get('/bookings/drivers'),
        ])
        setVehicles(vehiclesData?.data?.vehicles || [])
        setDrivers(driversData?.data?.drivers || [])
      } catch {
        setVehicles([])
        setDrivers([])
      }
    }
    loadReferenceData()
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        setCurrentDate((prev) => shiftDate(prev, view, -1))
      }
      if (event.key === 'ArrowRight') {
        setCurrentDate((prev) => shiftDate(prev, view, 1))
      }
      if (event.key === 'Escape') {
        setSelectedBooking(null)
        setShowNewBooking(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [view])

  const monthDays = useMemo(() => getMonthGrid(currentDate), [currentDate])

  const bookingsByDay = useMemo(() => {
    const map = new Map()
    for (const booking of bookings) {
      const bookingDay = new Date(booking.date_from)
      bookingDay.setHours(0, 0, 0, 0)
      const endDay = new Date(booking.date_to)
      endDay.setHours(0, 0, 0, 0)

      while (bookingDay <= endDay) {
        const key = bookingDay.toISOString().split('T')[0]
        const value = map.get(key) || []
        value.push(booking)
        map.set(key, value)
        bookingDay.setDate(bookingDay.getDate() + 1)
      }
    }
    return map
  }, [bookings])

  const weekDays = useMemo(() => {
    const weekStart = startOfWeekMonday(currentDate)
    return Array.from({ length: 7 }, (_, index) => {
      const next = new Date(weekStart)
      next.setDate(weekStart.getDate() + index)
      return next
    })
  }, [currentDate])

  const getVehicleClass = (vehicleId) => {
    const index = Math.abs(Number(vehicleId || 0)) % vehiclePalette.length
    return vehiclePalette[index]
  }

  const openNewBooking = (selectedDate = new Date()) => {
    setNewBookingDate(selectedDate)
    setShowNewBooking(true)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[220px,1fr]">
        <aside className="rounded-xl bg-white p-4 shadow">
          <ul className="space-y-2 text-sm">
            <li><Link className="rounded-lg bg-brand-50 px-3 py-2 font-semibold text-brand-700" to="/dashboard/calendar">Calendar</Link></li>
            <li><Link className="rounded-lg px-3 py-2 hover:bg-slate-100" to="/dashboard">Dashboard</Link></li>
          </ul>
        </aside>

        <main className="space-y-4 transition-all duration-200">
          <div className="rounded-xl bg-white p-4 shadow">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">📅 Central Calendar</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setCurrentDate(new Date())} className="rounded border px-3 py-2 text-sm">Today</button>
                <button type="button" onClick={() => setCurrentDate((prev) => shiftDate(prev, view, -1))} className="rounded border px-3 py-2 text-sm">&lt; Prev</button>
                <button type="button" onClick={() => setCurrentDate((prev) => shiftDate(prev, view, 1))} className="rounded border px-3 py-2 text-sm">Next &gt;</button>
                <button type="button" onClick={() => openNewBooking(currentDate)} className="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white">+ New Booking</button>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-AU', {
                  month: 'long',
                  year: 'numeric',
                  day: view === 'day' ? 'numeric' : undefined,
                })}
              </h3>
              <div className="flex gap-2">
                {viewLabels.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setView(label)}
                    className={`rounded px-3 py-1.5 text-sm capitalize ${view === label ? 'bg-brand-500 text-white' : 'border'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-5">
              <label className="text-sm">
                Vehicle
                <select
                  multiple
                  value={filters.vehicleIds}
                  onChange={(event) => {
                    const selected = Array.from(event.target.selectedOptions).map((option) => option.value)
                    setFilters((prev) => ({ ...prev, vehicleIds: selected }))
                  }}
                  className="mt-1 h-24 w-full rounded border px-2 py-1"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.registration_number}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Driver
                <select
                  value={filters.driverId}
                  onChange={(event) => setFilters((prev) => ({ ...prev, driverId: event.target.value }))}
                  className="mt-1 w-full rounded border px-2 py-1"
                >
                  <option value="">All</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Usage
                <select
                  value={filters.usageType}
                  onChange={(event) => setFilters((prev) => ({ ...prev, usageType: event.target.value }))}
                  className="mt-1 w-full rounded border px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="business">Business</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <label className="text-sm">
                Status
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                  className="mt-1 w-full rounded border px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setFilters({ vehicleIds: [], driverId: '', usageType: 'all', status: 'all' })}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {loading && <LoadingSkeleton />}
          {!loading && error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {!loading && !error && view === 'month' && (
            <MonthView
              days={monthDays}
              bookingsByDay={bookingsByDay}
              getVehicleClass={getVehicleClass}
              onBookingClick={setSelectedBooking}
              onEmptyDayClick={openNewBooking}
            />
          )}

          {!loading && !error && view === 'week' && (
            <WeekView
              weekDays={weekDays}
              vehicles={vehicles}
              bookings={bookings}
              getVehicleClass={getVehicleClass}
              onBookingClick={setSelectedBooking}
            />
          )}

          {!loading && !error && view === 'day' && (
            <DayView
              currentDate={currentDate}
              vehicles={vehicles}
              bookings={bookings}
              getVehicleClass={getVehicleClass}
              onBookingClick={setSelectedBooking}
            />
          )}
        </main>
      </div>

      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdated={reloadBookings}
          onToast={setToast}
        />
      )}

      {showNewBooking && (
        <NewBookingModal
          defaultDate={newBookingDate}
          drivers={drivers}
          onClose={() => setShowNewBooking(false)}
          onCreated={reloadBookings}
          onToast={setToast}
          checkAvailability={checkAvailability}
        />
      )}
    </div>
  )
}

function startOfWeekMonday(date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  const day = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - day)
  return copy
}

function getMonthGrid(date) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
  const firstDay = startOfWeekMonday(monthStart)
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstDay)
    day.setDate(firstDay.getDate() + index)
    return day
  })
}

function shiftDate(date, view, direction) {
  const next = new Date(date)
  if (view === 'month') next.setMonth(next.getMonth() + direction)
  if (view === 'week') next.setDate(next.getDate() + 7 * direction)
  if (view === 'day') next.setDate(next.getDate() + direction)
  return next
}

function getRangeForView(currentDate, view) {
  if (view === 'day') {
    const start = new Date(currentDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(currentDate)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  if (view === 'week') {
    const start = startOfWeekMonday(currentDate)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return { start, end }
  }

  const days = getMonthGrid(currentDate)
  const start = new Date(days[0])
  start.setHours(0, 0, 0, 0)
  const end = new Date(days[days.length - 1])
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function LoadingSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <div className="mb-3 h-5 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: SKELETON_ITEM_COUNT }).map((_, index) => (
          <div key={String(index)} className="h-20 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    </div>
  )
}
