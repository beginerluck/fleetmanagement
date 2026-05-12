export default function WeekView({ weekDays, vehicles, bookings, getVehicleClass, onBookingClick }) {
  const weekStart = weekDays[0]
  const weekEnd = weekDays[weekDays.length - 1]

  return (
    <div className="overflow-x-auto rounded-xl bg-white p-4 shadow">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="text-left text-xs uppercase text-slate-500">
            <th className="border-b p-2">Vehicle</th>
            {weekDays.map((day) => (
              <th key={day.toISOString()} className="border-b p-2 text-center">
                {day.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            const vehicleBookings = bookings.filter((booking) => {
              if (booking.vehicle_id !== vehicle.id) return false
              const from = new Date(booking.date_from)
              const to = new Date(booking.date_to)
              return from <= weekEnd && to >= weekStart
            })

            return (
              <tr key={vehicle.id}>
                <td className="border-b p-2 align-top">
                  <p className="font-semibold">{vehicle.registration_number}</p>
                  <p className="text-xs text-slate-500">{vehicle.make} {vehicle.model}</p>
                </td>
                {weekDays.map((day) => {
                  const dayStart = new Date(day)
                  dayStart.setHours(0, 0, 0, 0)
                  const dayEnd = new Date(day)
                  dayEnd.setHours(23, 59, 59, 999)

                  const dayBooking = vehicleBookings.find((booking) => {
                    const bookingFrom = new Date(booking.date_from)
                    const bookingTo = new Date(booking.date_to)
                    return bookingFrom <= dayEnd && bookingTo >= dayStart
                  })

                  if (vehicle.status === 'service') {
                    return (
                      <td key={day.toISOString()} className="border-b p-2">
                        <div className="h-12 rounded bg-slate-300 bg-[repeating-linear-gradient(45deg,#94a3b8,#94a3b8_10px,#cbd5e1_10px,#cbd5e1_20px)] text-center text-xs font-semibold leading-[48px] text-slate-700">
                          🔧 SERVICE
                        </div>
                      </td>
                    )
                  }

                  return (
                    <td key={day.toISOString()} className="border-b p-2">
                      {dayBooking ? (
                        <button
                          type="button"
                          onClick={() => onBookingClick(dayBooking)}
                          title={`${dayBooking.driver?.name || 'Driver'} • ${dayBooking.purpose || 'Booking'} • ${new Date(dayBooking.date_from).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}`}
                          className={`h-12 w-full rounded px-2 text-left text-xs text-white ${getVehicleClass(dayBooking.vehicle_id)}`}
                        >
                          {dayBooking.driver?.name || 'Booked'}
                        </button>
                      ) : (
                        <div className="h-12 rounded border border-dashed border-slate-200" />
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
