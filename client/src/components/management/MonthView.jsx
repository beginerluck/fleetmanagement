export default function MonthView({ days, bookingsByDay, getVehicleClass, onBookingClick, onEmptyDayClick }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase text-slate-500">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((weekday) => (
          <div key={weekday} className="p-2 text-center">{weekday}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayKey = day.toISOString().split('T')[0]
          const dayBookings = bookingsByDay.get(dayKey) || []
          return (
            <button
              type="button"
              key={dayKey}
              onClick={() => onEmptyDayClick(day)}
              className="min-h-28 rounded-lg border p-2 text-left transition hover:border-brand-500"
            >
              <p className="text-sm font-semibold">{day.getDate()}</p>
              <div className="mt-2 space-y-1">
                {dayBookings.slice(0, 3).map((booking) => (
                  <span
                    key={booking.id}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation()
                      onBookingClick(booking)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.stopPropagation()
                        onBookingClick(booking)
                      }
                    }}
                    className={`block truncate rounded px-2 py-1 text-xs text-white ${getVehicleClass(booking.vehicle_id)}`}
                    title={`${booking.vehicle?.registration_number || 'Vehicle'} — ${booking.driver?.name || 'Driver'}`}
                  >
                    🚗 {booking.vehicle?.registration_number || 'Unknown'} — {booking.driver?.name || 'Unknown'}
                  </span>
                ))}
                {dayBookings.length > 3 && (
                  <span className="block text-xs text-slate-500">+{dayBookings.length - 3} more</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
