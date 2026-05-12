import { useMemo, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import Tesseract from 'tesseract.js'
import { useNavigate } from 'react-router-dom'
import api from '../../api/api'

const plateRegex = /\b([A-Z]{3})\s?(\d{3})\s?([A-Z]{2})?\b/

function cleanText(text) {
  return text.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function ScanTrip() {
  const webcamRef = useRef(null)
  const navigate = useNavigate()
  const [mode, setMode] = useState('rego')
  const [manualText, setManualText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const videoConstraints = useMemo(
    () => ({ facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }),
    [],
  )

  const processText = async (rawText) => {
    const cleaned = cleanText(rawText)
    const match = cleaned.match(plateRegex)
    const plateText = match ? `${match[1]} ${match[2]}${match[3] ? ` ${match[3]}` : ''}` : cleaned
    const { data } = await api.post('/trips/scan-vehicle', { plateText })
    if (!data.success) throw new Error(data.message)
    navigate('/driver/trip/confirm', { state: { vehicle: data.data.vehicle, plateText } })
  }

  const capture = async () => {
    try {
      setLoading(true)
      setError('')
      const imageSrc = webcamRef.current?.getScreenshot()
      if (!imageSrc) throw new Error('Camera capture failed')
      const result = await Tesseract.recognize(imageSrc, 'eng')
      await processText(result.data.text)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not read plate')
    } finally {
      setLoading(false)
    }
  }

  const submitManual = async () => {
    if (!manualText.trim()) return
    try {
      setLoading(true)
      setError('')
      await processText(manualText)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not read plate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <h2 className="mb-3 text-xl font-semibold">Scan to Start Trip</h2>
      <div className="mb-3 flex rounded-lg bg-slate-200 p-1 text-sm">
        <button className={`flex-1 rounded-md px-3 py-2 ${mode === 'rego' ? 'bg-white shadow' : ''}`} onClick={() => setMode('rego')}>Rego Plate</button>
        <button className={`flex-1 rounded-md px-3 py-2 ${mode === 'consignment' ? 'bg-white shadow' : ''}`} onClick={() => setMode('consignment')}>Consignment Note</button>
      </div>
      <div className="relative overflow-hidden rounded-xl bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-28 w-64 rounded-lg border-2 border-dashed border-white/80" />
        </div>
      </div>
      <button onClick={capture} disabled={loading} className="mt-3 w-full rounded-lg bg-brand-500 py-2 font-semibold text-white">
        {loading ? 'Processing...' : '📷 CAPTURE'}
      </button>
      <div className="mt-4 rounded-lg bg-white p-3 shadow">
        <label className="text-sm font-medium">✍️ Enter Manually</label>
        <div className="mt-2 flex gap-2">
          <input className="flex-1 rounded border px-3 py-2" value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder={mode === 'rego' ? 'ABC 123 GP' : 'Consignment ref'} />
          <button onClick={submitManual} disabled={loading} className="rounded bg-brand-700 px-3 text-white">Search</button>
        </div>
      </div>
      {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}. Retry camera or manual search.</p>}
    </div>
  )
}
