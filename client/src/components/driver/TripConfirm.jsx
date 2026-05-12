import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../../api/api'
import { useAuth } from '../../context/useAuth'

export default function TripConfirm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const vehicle = state?.vehicle

  const [form, setForm] = useState({
    odometer_start: vehicle?.odometer_current || 0,
    destination: '',
    purpose: '',
    usage_type: 'business',
  })

  if (!vehicle) {
    return (
      <div className="p-4">
        <p className="mb-3">No vehicle selected.</p>
        <Link className="text-brand-700" to="/driver/scan">← Scan Again</Link>
      </div>
    )
  }

  const blocked = vehicle.status !== 'available'

  const startTrip = async () => {
    const { data } = await api.post('/trips/start', {
      vehicleId: vehicle.id,
      driverId: user.id,
      ...form,
    })
    if (data.success) navigate(`/driver/trip/${data.data.trip.id}`)
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <h2 className="mb-4 text-xl font-semibold">Trip Confirmation</h2>
      <div className="rounded-xl bg-white p-4 shadow">
        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
        <p className="text-sm">Plate: {vehicle.registration_number}</p>
        <p className="text-sm">Status: {vehicle.status}</p>
        <p className="text-sm">Odometer: {vehicle.odometer_current} km</p>
        {blocked && <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">Vehicle is not available. Trip start is blocked.</p>}
      </div>
      <div className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow">
        <input className="w-full rounded border px-3 py-2" type="number" value={form.odometer_start} onChange={(e) => setForm({ ...form, odometer_start: Number(e.target.value) })} placeholder="Odometer Start" />
        <input className="w-full rounded border px-3 py-2" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Destination" />
        <input className="w-full rounded border px-3 py-2" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Purpose" />
        <div className="flex gap-4 text-sm">
          <label><input type="radio" checked={form.usage_type === 'business'} onChange={() => setForm({ ...form, usage_type: 'business' })} /> Business</label>
          <label><input type="radio" checked={form.usage_type === 'private'} onChange={() => setForm({ ...form, usage_type: 'private' })} /> Private</label>
        </div>
        <button disabled={blocked} onClick={startTrip} className="w-full rounded bg-brand-500 py-2 font-semibold text-white disabled:opacity-50">🚦 START TRIP</button>
        <Link to="/driver/scan" className="block text-center text-sm text-brand-700">← Scan Again</Link>
      </div>
    </div>
  )
}
