import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../api/api'
import { useAuth } from '../../context/useAuth'

export default function DriverDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const { data } = await api.get(`/bookings?date=${today}`)
        setBookings(data.data.bookings || [])
      } catch {
        setBookings([])
      }
    }
    loadBookings()
  }, [])

  const activeBooking = bookings[0]
  const upcoming = bookings.slice(1, 4)

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="text-xl font-semibold">Hi, {user?.name}</h2>
        <p className="text-sm text-slate-500">{new Date().toLocaleDateString('en-AU')}</p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h3 className="font-semibold">Active Booking</h3>
        {activeBooking ? (
          <div className="mt-2 space-y-1 text-sm">
            <p className="font-medium">
              {activeBooking.vehicle?.make} {activeBooking.vehicle?.model} — {activeBooking.vehicle?.registration_number}
            </p>
            <p>
              {new Date(activeBooking.date_from).toLocaleTimeString('en-AU')} - {new Date(activeBooking.date_to).toLocaleTimeString('en-AU')}
            </p>
            <Link className="mt-2 inline-block rounded bg-brand-500 px-3 py-2 text-white" to="/driver/scan">
              START TRIP
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No active booking found.</p>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h3 className="font-semibold">Upcoming Bookings</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {upcoming.length === 0 && <li className="text-slate-500">No upcoming bookings.</li>}
          {upcoming.map((booking) => (
            <li key={booking.id} className="rounded border p-2">
              {booking.vehicle?.registration_number} — {new Date(booking.date_from).toLocaleString('en-AU')}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link className="rounded-lg bg-brand-500 p-3 text-center font-medium text-white" to="/driver/scan">
          📷 Scan to Start Trip
        </Link>
        <button className="rounded-lg bg-white p-3 font-medium shadow">+ Book Vehicle</button>
        <Link className="rounded-lg bg-white p-3 text-center font-medium shadow" to="/driver/fuel">
          ⛽ Upload Fuel Receipt
        </Link>
      </div>
    </div>
  )
}
