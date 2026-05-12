import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import useBookings from '../../hooks/useBookings'
import { useAuth } from '../../context/useAuth'
import BookingModal from '../management/BookingModal'
import NewBookingModal from '../management/NewBookingModal'

export default function DriverCalendar() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [toast, setToast] = useState('')

  const monthRange = useMemo(() => getMonthRange(currentDate), [currentDate])
  const { bookings, loading, error, reloadBookings, checkAvailability } = useBookings({
    dateFrom: monthRange.start.toISOString(),
    dateTo: monthRange.end.toISOString(),
  })

  const ownBookings = useMemo(
    () => bookings.filter((booking) => booking.driver_id === user?.id),
    [bookings, user?.id],
  )

  const ownBookingsByDay = useMemo(() => {
    const map = new Map()
    for (const booking of ownBookings) {
      const key = new Date(booking.date_from).toISOString().split('T')[0]
      const value = map.get(key) || []
      value.push(booking)
      map.set(key, value)
    }
    return map
  }, [ownBookings])

  const unavailableByDay = useMemo(() => {
    const map = new Map()
    for (const booking of bookings) {
      if (booking.driver_id === user?.id) continue
      const key = new Date(booking.date_from).toISOString().split('T')[0]
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }, [bookings, user?.id])

  const days = useMemo(() => getMonthGrid(currentDate), [currentDate])

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="rounded-xl bg-white p-4 shadow">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">📅 My Booking Calendar</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCurrentDate((prev) => shiftMonth(prev, -1))} className="rounded border px-3 py-2 text-sm">&lt; Prev</button>
            <button type="button" onClick={() => setCurrentDate(new Date())} className="rounded border px-3 py-2 text-sm">Today</button>
            <button type="button" onClick={() => setCurrentDate((prev) => shiftMonth(prev, 1))} className="rounded border px-3 py-2 text-sm">Next &gt;</button>
            <button type="button" onClick={() => setShowNewBooking(true)} className="rounded bg-brand-500 px-3 py-2 text-sm text-white">+ Book Vehicle</button>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          {currentDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
        </p>

        <div className="mt-4 grid grid-cols-7 gap-2 text-xs font-semibold uppercase text-slate-500">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((weekday) => (
            <div key={weekday} className="p-2 text-center">{weekday}</div>
          ))}
        </div>

        {loading && (
          <div className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, index) => (
              <div key={String(index)} className="h-20 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        )}

        {!loading && error && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {!loading && !error && (
          <div className="mt-2 grid grid-cols-7 gap-2">
            {days.map((day) => {
              const key = day.toISOString().split('T')[0]
              const myDayBookings = ownBookingsByDay.get(key) || []
              const unavailableCount = unavailableByDay.get(key) || 0

              return (
                <div key={key} className="min-h-24 rounded-lg border p-2">
                  <p className="text-sm font-semibold">{day.getDate()}</p>
                  <div className="mt-1 space-y-1 text-xs">
                    {myDayBookings.map((booking) => (
                      <button
                        type="button"
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className="block w-full rounded bg-blue-600 px-2 py-1 text-left text-white"
                      >
                        {booking.vehicle?.registration_number} · {new Date(booking.date_from).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                      </button>
                    ))}
                    {unavailableCount > 0 && (
                      <p className="rounded bg-slate-200 px-2 py-1 text-slate-600">Unavailable ({unavailableCount})</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 text-sm shadow">
        <Link to="/driver/dashboard" className="text-brand-700">← Back to dashboard</Link>
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
          defaultDate={currentDate}
          drivers={user ? [{ id: user.id, name: user.name }] : []}
          onClose={() => setShowNewBooking(false)}
          onCreated={reloadBookings}
          onToast={setToast}
          checkAvailability={checkAvailability}
        />
      )}
    </div>
  )
}

function getMonthGrid(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  firstDay.setDate(firstDay.getDate() - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstDay)
    day.setDate(firstDay.getDate() + index)
    return day
  })
}

function getMonthRange(date) {
  const days = getMonthGrid(date)
  const start = new Date(days[0])
  start.setHours(0, 0, 0, 0)
  const end = new Date(days[days.length - 1])
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function shiftMonth(date, direction) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + direction)
  return next
}
