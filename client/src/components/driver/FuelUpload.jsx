import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/api'

const today = new Date().toISOString().slice(0, 10)

export default function FuelUpload() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lockedByTrip, setLockedByTrip] = useState(false)
  const [context, setContext] = useState({ activeTrip: null, upcomingBooking: null })
  const [form, setForm] = useState({
    vehicle_id: '',
    trip_id: '',
    date: today,
    litres: '',
    cost: '',
    odometer_reading: '',
    cost_centre: '',
    receipt_image_url: '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [{ data: contextData }, { data: vehiclesData }] = await Promise.all([
          api.get('/driver/active-context'),
          api.get('/vehicles'),
        ])

        const nextContext = {
          activeTrip: contextData.data?.activeTrip || null,
          upcomingBooking: contextData.data?.upcomingBooking || null,
        }

        setVehicles(vehiclesData.data?.vehicles || [])
        setContext(nextContext)

        if (nextContext.activeTrip) {
          setLockedByTrip(true)
          setForm((prev) => ({
            ...prev,
            vehicle_id: String(nextContext.activeTrip.vehicle_id),
            trip_id: String(nextContext.activeTrip.id),
            odometer_reading: nextContext.activeTrip.vehicle?.odometer_current
              ? String(nextContext.activeTrip.vehicle.odometer_current)
              : prev.odometer_reading,
          }))
          return
        }

        setLockedByTrip(false)
        if (nextContext.upcomingBooking?.vehicle_id) {
          setForm((prev) => ({
            ...prev,
            vehicle_id: String(nextContext.upcomingBooking.vehicle_id),
            odometer_reading: nextContext.upcomingBooking.vehicle?.odometer_current
              ? String(nextContext.upcomingBooking.vehicle.odometer_current)
              : prev.odometer_reading,
          }))
        }
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Unable to load fuel form')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        vehicle_id: Number(form.vehicle_id),
        trip_id: form.trip_id ? Number(form.trip_id) : null,
        date: form.date,
        litres: form.litres === '' ? null : Number(form.litres),
        cost: form.cost === '' ? null : Number(form.cost),
        odometer_reading: form.odometer_reading === '' ? null : Number(form.odometer_reading),
        cost_centre: form.cost_centre || null,
        receipt_image_url: form.receipt_image_url || null,
      }
      const { data } = await api.post('/fuel-records', payload)
      if (!data.success) throw new Error(data.message || 'Unable to save fuel record')
      setSuccess('Fuel receipt saved successfully.')
      setTimeout(() => navigate('/driver/dashboard'), 900)
    } catch (saveError) {
      setError(saveError.response?.data?.message || saveError.message || 'Unable to save fuel record')
    } finally {
      setSaving(false)
    }
  }

  const activeVehicleLabel = context.activeTrip?.vehicle
    ? `${context.activeTrip.vehicle.registration_number} — ${context.activeTrip.vehicle.make} ${context.activeTrip.vehicle.model}`
    : ''

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Upload Fuel Receipt</h2>
        <Link className="text-sm text-brand-700" to="/driver/dashboard">
          ← Back
        </Link>
      </div>

      {loading && <p className="rounded bg-white p-3 shadow">Loading fuel form...</p>}

      {!loading && lockedByTrip && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
          <p className="font-semibold">⛽ Linked to your active trip</p>
          <p>{activeVehicleLabel}</p>
        </div>
      )}

      {!loading && (
        <form className="space-y-3 rounded-xl bg-white p-4 shadow" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Vehicle</span>
            <select
              className="w-full rounded border px-3 py-2"
              value={form.vehicle_id}
              onChange={(e) => setForm((prev) => ({ ...prev, vehicle_id: e.target.value }))}
              disabled={lockedByTrip}
              required
            >
              <option value="">Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.registration_number} — {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Date</span>
            <input
              className="w-full rounded border px-3 py-2"
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className="rounded border px-3 py-2"
              type="number"
              step="0.01"
              min="0"
              placeholder="Litres"
              value={form.litres}
              onChange={(e) => setForm((prev) => ({ ...prev, litres: e.target.value }))}
            />
            <input
              className="rounded border px-3 py-2"
              type="number"
              step="0.01"
              min="0"
              placeholder="Cost (AUD)"
              value={form.cost}
              onChange={(e) => setForm((prev) => ({ ...prev, cost: e.target.value }))}
            />
          </div>

          <input
            className="w-full rounded border px-3 py-2"
            type="number"
            min="0"
            placeholder="Odometer reading"
            value={form.odometer_reading}
            onChange={(e) => setForm((prev) => ({ ...prev, odometer_reading: e.target.value }))}
          />

          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Cost centre"
            value={form.cost_centre}
            onChange={(e) => setForm((prev) => ({ ...prev, cost_centre: e.target.value }))}
          />

          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Receipt image URL"
            value={form.receipt_image_url}
            onChange={(e) => setForm((prev) => ({ ...prev, receipt_image_url: e.target.value }))}
          />

          <button className="w-full rounded bg-brand-500 py-2 font-semibold text-white disabled:opacity-60" disabled={saving}>
            {saving ? 'Saving...' : 'Save Fuel Receipt'}
          </button>
          {success && <p className="rounded bg-green-50 p-2 text-sm text-green-700">{success}</p>}
          {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        </form>
      )}
    </div>
  )
}
