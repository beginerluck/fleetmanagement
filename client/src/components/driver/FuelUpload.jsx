import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/api'
import { useAuth } from '../../context/useAuth'
import FileCapture from '../shared/FileCapture'
import {
  buildFuelReference,
  costCentreOptions,
  formatAuDate,
  formatAudCurrency,
  fuelTypeOptions,
} from '../../utils/fuel'

function todayValue() {
  return new Date().toISOString().slice(0, 10)
}

export default function FuelUpload() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [receiptFile, setReceiptFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])
  const [successRecord, setSuccessRecord] = useState(null)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    vehicle_id: '',
    trip_id: '',
    date: todayValue(),
    litres: '',
    cost: '',
    odometer_reading: '',
    cost_centre: costCentreOptions[0],
    fuel_type: fuelTypeOptions[0],
    station: '',
    notes: '',
  })

  const previewUrl = useMemo(() => (receiptFile ? URL.createObjectURL(receiptFile) : ''), [receiptFile])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [vehicleResponse, tripResponse] = await Promise.all([
          api.get('/vehicles'),
          api.get('/trips', { params: { driverId: user.id } }),
        ])

        const nextVehicles = vehicleResponse.data.data.vehicles || []
        const nextTrips = tripResponse.data.data.trips || []
        setVehicles(nextVehicles)
        setTrips(nextTrips)

        const recentTrip = nextTrips[0]
        const preferredVehicleId = recentTrip?.vehicle_id || nextVehicles[0]?.id || ''
        setForm((current) => ({
          ...current,
          vehicle_id: current.vehicle_id || preferredVehicleId,
          trip_id:
            current.trip_id ||
            (recentTrip && String(recentTrip.vehicle_id) === String(preferredVehicleId) ? String(recentTrip.id) : ''),
        }))
      } catch (error) {
        setLoadError(error.response?.data?.message || 'Unable to load vehicles and trips right now.')
      }
    }

    loadOptions()
  }, [user.id])

  useEffect(() => {
    if (!previewUrl) return undefined
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const tripOptions = useMemo(
    () => trips.filter((trip) => String(trip.vehicle_id) === String(form.vehicle_id)),
    [form.vehicle_id, trips],
  )
  const safePreviewUrl = previewUrl?.startsWith('blob:') ? previewUrl : ''

  const handleFileSelect = (file, errorMessage) => {
    setReceiptFile(file)
    setFileError(errorMessage)
    if (file) setStep(2)
  }

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'vehicle_id' ? { trip_id: '' } : {}),
    }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const validateDetails = () => {
    const nextErrors = {}
    ;['vehicle_id', 'date', 'litres', 'cost', 'odometer_reading', 'cost_centre', 'fuel_type', 'station'].forEach((field) => {
      if (!`${form[field] ?? ''}`.trim()) nextErrors[field] = 'Required'
    })

    if (!receiptFile) nextErrors.receipt = 'Please add a receipt file before continuing.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goToReview = () => {
    if (!validateDetails()) {
      setStep(receiptFile ? 2 : 1)
      return
    }
    setStep(3)
  }

  const submitReceipt = async () => {
    if (!validateDetails() || !receiptFile) return

    const payload = new FormData()
    payload.append('receipt', receiptFile)
    payload.append('vehicle_id', form.vehicle_id)
    payload.append('trip_id', form.trip_id)
    payload.append('driver_id', user.id)
    payload.append('date', form.date)
    payload.append('litres', form.litres)
    payload.append('cost', form.cost)
    payload.append('odometer_reading', form.odometer_reading)
    payload.append('cost_centre', form.cost_centre)
    payload.append('fuel_type', form.fuel_type)
    payload.append('station', form.station)
    payload.append('notes', form.notes)

    try {
      setIsSubmitting(true)
      setSubmitError('')
      setUploadProgress(0)
      const { data } = await api.post('/fuel', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total) return
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
        },
      })
      setSuccessRecord(data.data.record)
      setStep(4)
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Unable to submit the receipt.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetFlow = () => {
    setStep(1)
    setReceiptFile(null)
    setFileError('')
    setSubmitError('')
    setUploadProgress(0)
    setSuccessRecord(null)
    setErrors({})
    setForm((current) => ({
      ...current,
      trip_id: '',
      date: todayValue(),
      litres: '',
      cost: '',
      odometer_reading: '',
      station: '',
      notes: '',
    }))
  }

  const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === String(form.vehicle_id))
  const selectedTrip = tripOptions.find((trip) => String(trip.id) === String(form.trip_id))

  if (step === 4 && successRecord) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✅</div>
          <h2 className="mt-4 text-2xl font-bold text-emerald-700">Receipt submitted successfully!</h2>
          <p className="mt-2 text-slate-600">Reference number: <span className="font-semibold">{buildFuelReference(successRecord.id)}</span></p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={resetFlow} className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white">
              Upload Another
            </button>
            <Link to="/driver/dashboard" className="rounded-xl border px-5 py-3 font-semibold text-slate-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="rounded-3xl bg-white p-5 shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Driver Fuel Receipt</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">⛽ Upload Fuel Receipt</h2>
        <p className="mt-2 text-sm text-slate-500">Capture the receipt, fill in the purchase details, then review before submitting.</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-medium">
          {[1, 2, 3].map((value) => (
            <div key={value} className={`rounded-xl px-3 py-2 ${step >= value ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
              Step {value}
            </div>
          ))}
        </div>
      </div>

      {loadError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>}

      {step === 1 && (
        <div className="rounded-3xl bg-white p-5 shadow">
          <h3 className="text-lg font-semibold text-slate-900">Step 1 — Receipt Capture</h3>
          <p className="mt-1 text-sm text-slate-500">Take a clear photo or upload a JPG, PNG, or PDF receipt.</p>
          <div className="mt-4">
            <FileCapture file={receiptFile} previewUrl={previewUrl} error={fileError || errors.receipt} onFileSelect={handleFileSelect} />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => (receiptFile ? setStep(2) : setFileError('Please add a receipt file before continuing.'))}
              className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-3xl bg-white p-5 shadow">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Step 2 — Receipt Details</h3>
              <p className="mt-1 text-sm text-slate-500">All currency is in AUD and dates are shown in DD/MM/YYYY format.</p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-brand-700">
              ← Back
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle" error={errors.vehicle_id}>
              <select
                value={form.vehicle_id}
                onChange={(event) => updateField('vehicle_id', event.target.value)}
                className={inputClassName(errors.vehicle_id)}
              >
                <option value="">Select vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration_number} — {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Trip">
              <select
                value={form.trip_id}
                onChange={(event) => updateField('trip_id', event.target.value)}
                className={inputClassName()}
              >
                <option value="">Not linked to a trip</option>
                {tripOptions.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                    {(trip.destination || 'Trip')} — {formatAuDate((trip.start_time || '').slice(0, 10))}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date (DD/MM/YYYY)" error={errors.date}>
              <input type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} className={inputClassName(errors.date)} />
            </Field>
            <Field label="Litres" error={errors.litres}>
              <input type="number" min="0" step="0.01" value={form.litres} onChange={(event) => updateField('litres', event.target.value)} className={inputClassName(errors.litres)} placeholder="45.20" />
            </Field>
            <Field label="Cost (AUD $)" error={errors.cost}>
              <input type="number" min="0" step="0.01" value={form.cost} onChange={(event) => updateField('cost', event.target.value)} className={inputClassName(errors.cost)} placeholder="89.50" />
            </Field>
            <Field label="Odometer Reading (km)" error={errors.odometer_reading}>
              <input type="number" min="0" step="1" value={form.odometer_reading} onChange={(event) => updateField('odometer_reading', event.target.value)} className={inputClassName(errors.odometer_reading)} placeholder="145230" />
            </Field>
            <Field label="Cost Centre" error={errors.cost_centre}>
              <select value={form.cost_centre} onChange={(event) => updateField('cost_centre', event.target.value)} className={inputClassName(errors.cost_centre)}>
                {costCentreOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Fuel Type" error={errors.fuel_type}>
              <select value={form.fuel_type} onChange={(event) => updateField('fuel_type', event.target.value)} className={inputClassName(errors.fuel_type)}>
                {fuelTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Station / Supplier" error={errors.station}>
              <input value={form.station} onChange={(event) => updateField('station', event.target.value)} className={inputClassName(errors.station)} placeholder="BP Parramatta" />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} className={inputClassName()} rows="4" placeholder="Optional notes" />
            </Field>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setStep(1)} className="rounded-xl border px-5 py-3 font-semibold text-slate-700">
              Change Receipt
            </button>
            <button type="button" onClick={goToReview} className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white">
              Review & Submit
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-3xl bg-white p-5 shadow">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Step 3 — Review & Submit</h3>
              <p className="mt-1 text-sm text-slate-500">Check the details below before sending the receipt.</p>
            </div>
            <button type="button" onClick={() => setStep(2)} className="text-sm font-medium text-brand-700">
              ← Edit
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px,1fr]">
            <div className="rounded-2xl bg-slate-100 p-3">
              {receiptFile?.type === 'application/pdf' ? (
                <div className="flex h-full min-h-40 items-center justify-center rounded-xl bg-white text-sm text-slate-600">📄 PDF receipt</div>
              ) : (
                <img src={safePreviewUrl} alt="Receipt thumbnail" className="h-full max-h-56 w-full rounded-xl object-cover" />
              )}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <SummaryItem label="Vehicle" value={selectedVehicle ? `${selectedVehicle.registration_number} — ${selectedVehicle.make} ${selectedVehicle.model}` : '—'} />
                <SummaryItem label="Trip" value={selectedTrip ? `${selectedTrip.destination || 'Trip'} — ${formatAuDate((selectedTrip.start_time || '').slice(0, 10))}` : 'Not linked'} />
                <SummaryItem label="Date" value={formatAuDate(form.date)} />
                <SummaryItem label="Litres" value={form.litres} />
                <SummaryItem label="Cost" value={formatAudCurrency(form.cost)} />
                <SummaryItem label="Odometer" value={`${form.odometer_reading} km`} />
                <SummaryItem label="Cost Centre" value={form.cost_centre} />
                <SummaryItem label="Fuel Type" value={form.fuel_type} />
                <SummaryItem label="Station" value={form.station} />
                <SummaryItem label="Notes" value={form.notes || '—'} className="sm:col-span-2" />
              </dl>
            </div>
          </div>

          {isSubmitting && (
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
                Uploading receipt...
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="mt-2 text-right text-xs text-slate-500">{uploadProgress}%</p>
            </div>
          )}

          {submitError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setStep(2)} className="rounded-xl border px-5 py-3 font-semibold text-slate-700">
              ← Edit
            </button>
            <button type="button" disabled={isSubmitting} onClick={submitReceipt} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-70">
              ✅ SUBMIT RECEIPT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}

function SummaryItem({ label, value, className = '' }) {
  return (
    <div className={className}>
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{value}</dd>
    </div>
  )
}

function inputClassName(error) {
  return `w-full rounded-xl border px-3 py-2.5 outline-none transition focus:border-brand-500 ${
    error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
  }`
}
