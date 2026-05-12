import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/api'

export default function ActiveTrip() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [odometer_end, setOdometerEnd] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const loadTrip = async () => {
      const { data } = await api.get(`/trips/${id}`)
      if (data.success) setTrip(data.data.trip)
    }
    loadTrip()
  }, [id])

  const endTrip = async () => {
    const { data } = await api.put(`/trips/${id}/end`, { odometer_end: Number(odometer_end), notes })
    if (data.success) navigate('/driver/dashboard')
  }

  if (!trip) return <p className="p-4">Loading trip...</p>

  return (
    <div className="mx-auto max-w-xl p-4">
      <h2 className="mb-4 text-xl font-semibold">Active Trip</h2>
      <div className="space-y-2 rounded-xl bg-white p-4 shadow text-sm">
        <p>{trip.vehicle?.make} {trip.vehicle?.model} — {trip.vehicle?.registration_number}</p>
        <p>Destination: {trip.destination}</p>
        <p>Start time: {new Date(trip.start_time).toLocaleString()}</p>
        <p>Odo start: {trip.odometer_start}</p>
      </div>
      <div className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow">
        <input className="w-full rounded border px-3 py-2" type="number" value={odometer_end} onChange={(e) => setOdometerEnd(e.target.value)} placeholder="Odometer End" />
        <textarea className="w-full rounded border px-3 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
        <button className="w-full rounded bg-brand-500 py-2 font-semibold text-white" onClick={endTrip}>END TRIP & SAVE</button>
      </div>
    </div>
  )
}
