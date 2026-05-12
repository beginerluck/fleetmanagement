import { useEffect, useMemo, useState } from 'react'
import api from '../../api/api'
import { useAuth } from '../../context/useAuth'

export default function NewBookingModal({ defaultDate, drivers, onClose, onCreated, onToast, checkAvailability }) {
  const { user } = useAuth()
  const localDate = defaultDate || new Date()

  const [form, setForm] = useState({
    driver_id: user?.role === 'driver' ? String(user.id) : '',
    date_from: defaultDateTime(localDate, 9),
    date_to: defaultDateTime(localDate, 17),
    purpose: '',
    usage_type: 'business',
    cost_centre: '',
    vehicle_id: '',
  })
  const [availability, setAvailability] = useState([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [saving, setSaving] = useState(false)

  const shouldCheckAvailability = useMemo(
    () => Boolean(form.date_from && form.date_to),
    [form.date_from, form.date_to],
  )

  useEffect(() => {
    const loadAvailability = async () => {
      if (!shouldCheckAvailability) return
      setLoadingAvailability(true)
      try {
        const vehicles = await checkAvailability({
          date_from: new Date(form.date_from).toISOString(),
          date_to: new Date(form.date_to).toISOString(),
        })
        setAvailability(vehicles)

        if (!vehicles.find((vehicle) => String(vehicle.id) === form.vehicle_id && vehicle.available)) {
          const firstAvailable = vehicles.find((vehicle) => vehicle.available)
          setForm((prev) => ({ ...prev, vehicle_id: firstAvailable ? String(firstAvailable.id) : '' }))
        }
      } catch (error) {
        setAvailability([])
        onToast(error?.response?.data?.message || 'Failed to load vehicle availability')
      } finally {
        setLoadingAvailability(false)
      }
    }

    loadAvailability()
  }, [checkAvailability, form.date_from, form.date_to, form.vehicle_id, onToast, shouldCheckAvailability])

  const submit = async () => {
    if (!form.vehicle_id || !form.driver_id || !form.date_from || !form.date_to) {
      onToast('Please complete all required booking fields')
      return
    }

    setSaving(true)
    try {
      await api.post('/bookings', {
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        date_from: new Date(form.date_from).toISOString(),
        date_to: new Date(form.date_to).toISOString(),
        purpose: form.purpose,
        usage_type: form.usage_type,
        cost_centre: form.cost_centre,
      })
      onToast('Booking created!')
      onCreated()
      onClose()
    } catch (error) {
      onToast(error?.response?.data?.message || 'Vehicle unavailable')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">➕ New Booking</h3>
          <button type="button" onClick={onClose} className="rounded border px-3 py-1 text-sm">✕ Close</button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>Driver</span>
            <select
              value={form.driver_id}
              onChange={(event) => setForm((prev) => ({ ...prev, driver_id: event.target.value }))}
              disabled={user?.role === 'driver'}
              className="rounded border px-3 py-2"
            >
              <option value="">Select driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span>Purpose</span>
            <input
              value={form.purpose}
              onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))}
              className="rounded border px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>Date From</span>
            <input
              type="datetime-local"
              value={form.date_from}
              onChange={(event) => setForm((prev) => ({ ...prev, date_from: event.target.value }))}
              className="rounded border px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>Date To</span>
            <input
              type="datetime-local"
              value={form.date_to}
              onChange={(event) => setForm((prev) => ({ ...prev, date_to: event.target.value }))}
              className="rounded border px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>Usage</span>
            <select
              value={form.usage_type}
              onChange={(event) => setForm((prev) => ({ ...prev, usage_type: event.target.value }))}
              className="rounded border px-3 py-2"
            >
              <option value="business">Business</option>
              <option value="private">Private</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span>Dept / Cost Centre</span>
            <input
              value={form.cost_centre}
              onChange={(event) => setForm((prev) => ({ ...prev, cost_centre: event.target.value }))}
              className="rounded border px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-5 rounded-lg border p-3">
          <p className="mb-2 text-sm font-semibold">AVAILABLE VEHICLES for selected time:</p>
          {loadingAvailability ? (
            <p className="text-sm text-slate-500">Loading availability...</p>
          ) : (
            <div className="space-y-2 text-sm">
              {availability.map((vehicle) => (
                <label
                  key={vehicle.id}
                  className={`block rounded border p-2 ${vehicle.available ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-100 text-slate-500'}`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="vehicle"
                      value={vehicle.id}
                      checked={form.vehicle_id === String(vehicle.id)}
                      onChange={(event) => setForm((prev) => ({ ...prev, vehicle_id: event.target.value }))}
                      disabled={!vehicle.available}
                    />
                    <span>
                      {vehicle.available ? '✅' : '❌'} {vehicle.make} {vehicle.model} — {vehicle.registration_number}
                    </span>
                  </div>
                  {!vehicle.available && vehicle.unavailableReason === 'booked' && vehicle.conflictingBooking && (
                    <p className="ml-6 mt-1 text-xs">⚠️ Already booked {formatConflict(vehicle.conflictingBooking.time.from, vehicle.conflictingBooking.time.to)}</p>
                  )}
                  {!vehicle.available && vehicle.unavailableReason === 'service' && (
                    <p className="ml-6 mt-1 text-xs">🔧 In service</p>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Confirm Booking'}
          </button>
          <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function defaultDateTime(date, hour) {
  const copy = new Date(date)
  copy.setHours(hour, 0, 0, 0)
  const local = new Date(copy.getTime() - copy.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function formatConflict(dateFrom, dateTo) {
  const from = new Date(dateFrom)
  const to = new Date(dateTo)
  const fromText = from.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  const toText = to.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return `${fromText}–${toText}`
}
