import { useState } from 'react'
import api from '../../api/api'
import { useAuth } from '../../context/useAuth'

const statusClasses = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function BookingModal({ booking, onClose, onUpdated, onToast }) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    date_from: booking.date_from,
    date_to: booking.date_to,
    purpose: booking.purpose || '',
    usage_type: booking.usage_type || 'business',
    cost_centre: booking.cost_centre || booking.driver?.department || '',
  })
  const [saving, setSaving] = useState(false)

  const isManager = user?.role === 'manager' || user?.role === 'admin'

  const saveEdit = async () => {
    setSaving(true)
    try {
      await api.put(`/bookings/${booking.id}`, form)
      onToast('Booking updated!')
      onUpdated()
      onClose()
    } catch (error) {
      onToast(error?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const approve = async () => {
    try {
      await api.put(`/bookings/${booking.id}/approve`)
      onToast('Booking approved!')
      onUpdated()
      onClose()
    } catch (error) {
      onToast(error?.response?.data?.message || 'Approve failed')
    }
  }

  const reject = async () => {
    try {
      await api.put(`/bookings/${booking.id}/reject`)
      onToast('Booking rejected')
      onUpdated()
      onClose()
    } catch (error) {
      onToast(error?.response?.data?.message || 'Reject failed')
    }
  }

  const removeBooking = async () => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await api.delete(`/bookings/${booking.id}`)
      onToast('Booking cancelled')
      onUpdated()
      onClose()
    } catch (error) {
      onToast(error?.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">📋 Booking Details</h3>
          <button type="button" onClick={onClose} className="rounded border px-3 py-1 text-sm">✕ Close</button>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">
            🚗 {booking.vehicle?.make} {booking.vehicle?.model} — {booking.vehicle?.registration_number}
          </p>
          <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${statusClasses[booking.status] || statusClasses.pending}`}>
            {booking.status}
          </span>
          <p>👤 Driver: {booking.driver?.name}</p>
          <p>📅 Date: {new Date(booking.date_from).toLocaleDateString('en-AU')}</p>
          <p>
            🕐 Time: {new Date(booking.date_from).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
            {' — '}
            {new Date(booking.date_to).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>

        {isEditing && (
          <div className="mt-4 grid gap-2 rounded-lg border p-3 text-sm">
            <label className="grid gap-1">
              <span>Start</span>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.date_from)}
                onChange={(event) => setForm((prev) => ({ ...prev, date_from: event.target.value }))}
                className="rounded border px-2 py-1"
              />
            </label>
            <label className="grid gap-1">
              <span>End</span>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.date_to)}
                onChange={(event) => setForm((prev) => ({ ...prev, date_to: event.target.value }))}
                className="rounded border px-2 py-1"
              />
            </label>
            <label className="grid gap-1">
              <span>Purpose</span>
              <input
                value={form.purpose}
                onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))}
                className="rounded border px-2 py-1"
              />
            </label>
            <label className="grid gap-1">
              <span>Usage</span>
              <select
                value={form.usage_type}
                onChange={(event) => setForm((prev) => ({ ...prev, usage_type: event.target.value }))}
                className="rounded border px-2 py-1"
              >
                <option value="business">Business</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span>Dept / Cost Centre</span>
              <input
                value={form.cost_centre}
                onChange={(event) => setForm((prev) => ({ ...prev, cost_centre: event.target.value }))}
                className="rounded border px-2 py-1"
              />
            </label>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          {isManager && (
            <>
              <button type="button" onClick={approve} className="rounded bg-green-600 px-3 py-2 text-white">✅ Approve</button>
              <button type="button" onClick={reject} className="rounded bg-red-600 px-3 py-2 text-white">❌ Reject</button>
            </>
          )}
          {!isEditing ? (
            <button type="button" onClick={() => setIsEditing(true)} className="rounded border px-3 py-2">✏️ Edit</button>
          ) : (
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving}
              className="rounded bg-brand-500 px-3 py-2 text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button type="button" onClick={removeBooking} className="rounded border border-red-300 px-3 py-2 text-red-700">🗑️ Delete</button>
        </div>
      </div>
    </div>
  )
}

function toDateTimeLocal(value) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
