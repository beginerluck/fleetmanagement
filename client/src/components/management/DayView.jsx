export default function DayView({ currentDate, vehicles, bookings, getVehicleClass, onBookingClick }) {
  const dayStart = new Date(currentDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(currentDate)
  dayEnd.setHours(23, 59, 59, 999)

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h3 className="mb-4 text-lg font-semibold">
        {currentDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </h3>
      <div className="space-y-2">
        {vehicles.map((vehicle) => {
          const booking = bookings.find((item) => {
            if (item.vehicle_id !== vehicle.id) return false
            const from = new Date(item.date_from)
            const to = new Date(item.date_to)
            return from <= dayEnd && to >= dayStart
          })

          return (
            <div key={vehicle.id} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[180px,1fr]">
              <div>
                <p className="font-semibold">{vehicle.registration_number}</p>
                <p className="text-sm text-slate-500">{vehicle.make} {vehicle.model}</p>
              </div>
              <div>
                {vehicle.status === 'service' ? (
                  <div className="rounded bg-slate-300 bg-[repeating-linear-gradient(45deg,#94a3b8,#94a3b8_10px,#cbd5e1_10px,#cbd5e1_20px)] px-3 py-2 text-sm font-semibold text-slate-700">
                    🔧 IN SERVICE
                  </div>
                ) : booking ? (
                  <button
                    type="button"
                    onClick={() => onBookingClick(booking)}
                    className={`w-full rounded px-3 py-2 text-left text-sm text-white ${getVehicleClass(booking.vehicle_id)}`}
                  >
                    {new Date(booking.date_from).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                    {' — '}
                    {new Date(booking.date_to).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                    <div>{booking.driver?.name || 'Driver'} — {booking.purpose || 'Booking'}</div>
                  </button>
                ) : (
                  <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">✅ Available all day</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
