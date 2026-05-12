import { useCallback, useEffect, useState } from 'react'
import api from '../../api/api'
import FuelTable from './FuelTable'
import ReceiptModal from '../shared/ReceiptModal'
import {
  costCentreOptions,
  formatAuDate,
  formatAudCurrency,
  formatVehicleDisplay,
  fuelTypeOptions,
  validateReceiptFile,
} from '../../utils/fuel'

const emptyFilters = {
  vehicleId: '',
  driverId: '',
  costCentre: '',
  fuelType: '',
  dateFrom: '',
  dateTo: '',
}

function defaultFormState() {
  return {
    vehicle_id: '',
    driver_id: '',
    trip_id: '',
    date: new Date().toISOString().slice(0, 10),
    litres: '',
    cost: '',
    odometer_reading: '',
    cost_centre: costCentreOptions[0],
    fuel_type: fuelTypeOptions[0],
    station: '',
    notes: '',
    receipt: null,
  }
}

export default function FuelRecords() {
  const [draftFilters, setDraftFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [summary, setSummary] = useState({ total_cost: 0, total_litres: 0, avg_cost_per_litre: 0, record_count: 0 })
  const [options, setOptions] = useState({ vehicles: [], drivers: [], costCentres: costCentreOptions, fuelTypes: fuelTypeOptions })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [receiptRecord, setReceiptRecord] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [formOpen, setFormOpen] = useState(false)
  const [formState, setFormState] = useState(defaultFormState())
  const [formTrips, setFormTrips] = useState([])
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const month = new Date().getMonth() + 1
  const year = new Date().getFullYear()

  const loadRecords = useCallback(async (page = 1, nextFilters = emptyFilters, nextSortBy = 'date', nextSortOrder = 'desc') => {
    try {
      setLoading(true)
      setError('')
      const { data } = await api.get('/fuel', {
        params: {
          ...nextFilters,
          page,
          limit: 20,
          sortBy: nextSortBy,
          sortOrder: nextSortOrder,
        },
      })
      setRecords(data.data.records || [])
      setPagination(data.data.pagination)
      setOptions(data.data.filters || { vehicles: [], drivers: [], costCentres: costCentreOptions, fuelTypes: fuelTypeOptions })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load fuel records.')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/fuel/summary', { params: { month, year } })
      setSummary(data.data)
    } catch {
      setSummary({ total_cost: 0, total_litres: 0, avg_cost_per_litre: 0, record_count: 0 })
    }
  }, [month, year])

  useEffect(() => {
    loadRecords(1, emptyFilters, 'date', 'desc')
    loadSummary()
  }, [loadRecords, loadSummary])

  useEffect(() => {
    if (!formOpen || !formState.driver_id) {
      setFormTrips([])
      return
    }

    const loadTrips = async () => {
      try {
        const { data } = await api.get('/trips', {
          params: {
            driverId: formState.driver_id,
            vehicleId: formState.vehicle_id || undefined,
          },
        })
        setFormTrips(data.data.trips || [])
      } catch {
        setFormTrips([])
      }
    }

    loadTrips()
  }, [formOpen, formState.driver_id, formState.vehicle_id])

  const vehicleOptions = options.vehicles ?? []
  const driverOptions = options.drivers ?? []

  const selectedVehicle = vehicleOptions.find((vehicle) => String(vehicle.id) === String(formState.vehicle_id))

  const openCreateModal = () => {
    setModalMode('create')
    setFormState(defaultFormState())
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditModal = (record) => {
    setModalMode('edit')
    setFormState({
      vehicle_id: String(record.vehicle_id || ''),
      driver_id: String(record.driver_id || ''),
      trip_id: String(record.trip_id || ''),
      date: record.date || new Date().toISOString().slice(0, 10),
      litres: record.litres ?? '',
      cost: record.cost ?? '',
      odometer_reading: record.odometer_reading ?? '',
      cost_centre: record.cost_centre || costCentreOptions[0],
      fuel_type: record.fuel_type || fuelTypeOptions[0],
      station: record.station || '',
      notes: record.notes || '',
      receipt: null,
      id: record.id,
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setFormErrors({})
  }

  const applyFilters = () => {
    setFilters(draftFilters)
    loadRecords(1, draftFilters, sortBy, sortOrder)
  }

  const clearFilters = () => {
    setDraftFilters(emptyFilters)
    setFilters(emptyFilters)
    loadRecords(1, emptyFilters, sortBy, sortOrder)
  }

  const changeSort = (column) => {
    const nextOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortBy(column)
    setSortOrder(nextOrder)
    loadRecords(1, filters, column, nextOrder)
  }

  const goToPage = (page) => {
    loadRecords(page, filters, sortBy, sortOrder)
  }

  const exportCsv = async () => {
    const { data } = await api.get('/fuel/export', {
      params: filters,
      responseType: 'blob',
    })

    const fileUrl = window.URL.createObjectURL(new Blob([data], { type: 'text/csv' }))
    const link = document.createElement('a')
    const today = new Date().toISOString().slice(0, 10)
    link.href = fileUrl
    link.download = `fuel-records-${today}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(fileUrl)
  }

  const validateForm = () => {
    const nextErrors = {}
    ;['vehicle_id', 'driver_id', 'date', 'litres', 'cost', 'odometer_reading', 'cost_centre', 'fuel_type', 'station'].forEach((field) => {
      if (!`${formState[field] ?? ''}`.trim()) nextErrors[field] = 'Required'
    })

    if (modalMode === 'create') {
      const fileError = validateReceiptFile(formState.receipt)
      if (fileError) nextErrors.receipt = fileError
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const saveForm = async () => {
    if (!validateForm()) return

    try {
      setSaving(true)
      if (modalMode === 'create') {
        const payload = new FormData()
        Object.entries(formState).forEach(([key, value]) => {
          if (key === 'receipt' && value) payload.append('receipt', value)
          else if (!['id', 'receipt'].includes(key)) payload.append(key, value || '')
        })
        await api.post('/fuel', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.put(`/fuel/${formState.id}`, {
          vehicle_id: formState.vehicle_id,
          driver_id: formState.driver_id,
          trip_id: formState.trip_id,
          date: formState.date,
          litres: formState.litres,
          cost: formState.cost,
          odometer_reading: formState.odometer_reading,
          cost_centre: formState.cost_centre,
          fuel_type: formState.fuel_type,
          station: formState.station,
          notes: formState.notes,
        })
      }

      closeForm()
      loadRecords(pagination.page, filters, sortBy, sortOrder)
      loadSummary()
    } catch (requestError) {
      setFormErrors((current) => ({
        ...current,
        submit: requestError.response?.data?.message || 'Unable to save the fuel record.',
      }))
    } finally {
      setSaving(false)
    }
  }

  const deleteRecord = async (record) => {
    const confirmed = window.confirm(`Delete fuel record from ${formatAuDate(record.date)} for ${record.station}?`)
    if (!confirmed) return
    try {
      await api.delete(`/fuel/${record.id}`)
      const remainingPages = Math.max(Math.ceil((pagination.total - 1) / pagination.limit), 1)
      loadRecords(Math.min(pagination.page, remainingPages), filters, sortBy, sortOrder)
      loadSummary()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete the fuel record.')
    }
  }

  return (
    <>
      <div className="rounded-3xl bg-white p-5 shadow">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Management</p>
            <h1 className="text-2xl font-bold text-slate-900">⛽ Fuel Records</h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={openCreateModal} className="rounded-xl bg-brand-500 px-4 py-2.5 font-semibold text-white">
              + Add Record
            </button>
            <button type="button" onClick={exportCsv} className="rounded-xl border px-4 py-2.5 font-semibold text-slate-700">
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Fuel Spend MTD" value={formatAudCurrency(summary.total_cost)} />
        <KpiCard title="Total Litres MTD" value={Number(summary.total_litres || 0).toFixed(2)} />
        <KpiCard title="Average Cost per Litre MTD" value={formatAudCurrency(summary.avg_cost_per_litre)} />
        <KpiCard title="Number of Receipts This Month" value={summary.record_count || 0} />
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SelectField label="Vehicle" value={draftFilters.vehicleId} onChange={(value) => setDraftFilters((current) => ({ ...current, vehicleId: value }))}>
            <option value="">All vehicles</option>
            {vehicleOptions.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>{formatVehicleDisplay(vehicle)}</option>
            ))}
          </SelectField>
          <SelectField label="Driver" value={draftFilters.driverId} onChange={(value) => setDraftFilters((current) => ({ ...current, driverId: value }))}>
            <option value="">All drivers</option>
            {driverOptions.map((driver) => (
              <option key={driver.id} value={driver.id}>{driver.name}</option>
            ))}
          </SelectField>
          <SelectField label="Cost Centre" value={draftFilters.costCentre} onChange={(value) => setDraftFilters((current) => ({ ...current, costCentre: value }))}>
            <option value="">All cost centres</option>
            {costCentreOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </SelectField>
          <SelectField label="Fuel Type" value={draftFilters.fuelType} onChange={(value) => setDraftFilters((current) => ({ ...current, fuelType: value }))}>
            <option value="">All fuel types</option>
            {fuelTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </SelectField>
          <InputField label="From" type="date" value={draftFilters.dateFrom} onChange={(value) => setDraftFilters((current) => ({ ...current, dateFrom: value }))} />
          <InputField label="To" type="date" value={draftFilters.dateTo} onChange={(value) => setDraftFilters((current) => ({ ...current, dateTo: value }))} />
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={applyFilters} className="rounded-xl bg-brand-500 px-4 py-2.5 font-semibold text-white">Apply Filters</button>
          <button type="button" onClick={clearFilters} className="rounded-xl border px-4 py-2.5 font-semibold text-slate-700">Clear</button>
        </div>
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow">Loading fuel records...</div>
      ) : (
        <FuelTable
          records={records}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={changeSort}
          onEdit={openEditModal}
          onDelete={deleteRecord}
          onViewReceipt={setReceiptRecord}
        />
      )}

      <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing page {pagination.page} of {pagination.totalPages} · {pagination.total} total records
        </p>
        <div className="flex gap-2">
          <button type="button" disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)} className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Previous</button>
          <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)} className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Next</button>
        </div>
      </div>

      {receiptRecord && <ReceiptModal record={receiptRecord} onClose={() => setReceiptRecord(null)} />}

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{modalMode === 'create' ? 'Add Fuel Record' : 'Edit Fuel Record'}</h2>
                <p className="text-sm text-slate-500">{modalMode === 'create' ? 'Upload a new receipt for the fleet log.' : `Editing ${selectedVehicle ? `${selectedVehicle.registration_number}` : 'record'}`}</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700">Close</button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <SelectField label="Vehicle" value={formState.vehicle_id} error={formErrors.vehicle_id} onChange={(value) => setFormState((current) => ({ ...current, vehicle_id: value, trip_id: '' }))}>
                <option value="">Select vehicle</option>
                {vehicleOptions.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{formatVehicleDisplay(vehicle)}</option>
                ))}
              </SelectField>
              <SelectField label="Driver" value={formState.driver_id} error={formErrors.driver_id} onChange={(value) => setFormState((current) => ({ ...current, driver_id: value, trip_id: '' }))}>
                <option value="">Select driver</option>
                {driverOptions.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
              </SelectField>
              <SelectField label="Trip" value={formState.trip_id} onChange={(value) => setFormState((current) => ({ ...current, trip_id: value }))}>
                <option value="">Not linked to a trip</option>
                {formTrips.map((trip) => <option key={trip.id} value={trip.id}>{trip.destination || 'Trip'} — {formatAuDate((trip.start_time || '').slice(0, 10))}</option>)}
              </SelectField>
              <InputField label="Date" type="date" value={formState.date} error={formErrors.date} onChange={(value) => setFormState((current) => ({ ...current, date: value }))} />
              <InputField label="Litres" type="number" value={formState.litres} error={formErrors.litres} onChange={(value) => setFormState((current) => ({ ...current, litres: value }))} step="0.01" min="0" />
              <InputField label="Cost (AUD $)" type="number" value={formState.cost} error={formErrors.cost} onChange={(value) => setFormState((current) => ({ ...current, cost: value }))} step="0.01" min="0" />
              <InputField label="Odometer" type="number" value={formState.odometer_reading} error={formErrors.odometer_reading} onChange={(value) => setFormState((current) => ({ ...current, odometer_reading: value }))} min="0" />
              <SelectField label="Cost Centre" value={formState.cost_centre} error={formErrors.cost_centre} onChange={(value) => setFormState((current) => ({ ...current, cost_centre: value }))}>
                {costCentreOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </SelectField>
              <SelectField label="Fuel Type" value={formState.fuel_type} error={formErrors.fuel_type} onChange={(value) => setFormState((current) => ({ ...current, fuel_type: value }))}>
                {fuelTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </SelectField>
              <InputField label="Station" value={formState.station} error={formErrors.station} onChange={(value) => setFormState((current) => ({ ...current, station: value }))} />
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Notes</span>
                <textarea value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" rows="3" />
              </label>
              {modalMode === 'create' && (
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Receipt File</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] || null
                      setFormState((current) => ({ ...current, receipt: nextFile }))
                      setFormErrors((current) => ({ ...current, receipt: nextFile ? '' : current.receipt }))
                    }}
                    className={`w-full rounded-xl border px-3 py-2.5 ${formErrors.receipt ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  />
                  {formErrors.receipt && <span className="mt-1 block text-xs font-medium text-red-600">{formErrors.receipt}</span>}
                </label>
              )}
            </div>

            {formErrors.submit && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formErrors.submit}</p>}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeForm} className="rounded-xl border px-5 py-3 font-semibold text-slate-700">Cancel</button>
              <button type="button" disabled={saving} onClick={saveForm} className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white disabled:opacity-70">
                {saving ? 'Saving...' : modalMode === 'create' ? 'Save Record' : 'Update Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function KpiCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-brand-700">{value}</p>
    </div>
  )
}

function SelectField({ label, value, error, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-xl border px-3 py-2.5 ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`}>
        {children}
      </select>
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}

function InputField({ label, error, onChange, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input {...props} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-xl border px-3 py-2.5 ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`} />
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}
