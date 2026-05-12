import { useMemo, useRef, useState } from 'react'
import Webcam from 'react-webcam'

export const MAX_RECEIPT_FILE_SIZE = 10 * 1024 * 1024
export const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

export function validateReceiptFile(file) {
  if (!file) return 'Please select a receipt image or PDF.'
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, and PDF receipts are supported.'
  }
  if (file.size > MAX_RECEIPT_FILE_SIZE) {
    return 'Receipt files must be 10MB or smaller.'
  }
  return ''
}

function dataUrlToFile(dataUrl) {
  const [header, body] = dataUrl.split(',')
  const mimeMatch = header.match(/data:(.*?);base64/)
  const mimeType = mimeMatch?.[1] || 'image/jpeg'
  const binary = window.atob(body)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new File([bytes], `receipt-${Date.now()}.jpg`, { type: mimeType })
}

export default function FileCapture({ file, previewUrl, error, onFileSelect, showCamera = true }) {
  const inputRef = useRef(null)
  const webcamRef = useRef(null)
  const [mode, setMode] = useState(showCamera ? 'camera' : 'file')
  const [captureError, setCaptureError] = useState('')

  const videoConstraints = useMemo(
    () => ({ facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }),
    [],
  )

  const selectFile = (nextFile) => {
    const validationMessage = validateReceiptFile(nextFile)
    if (validationMessage) {
      setCaptureError(validationMessage)
      onFileSelect(null, validationMessage)
      return
    }
    setCaptureError('')
    onFileSelect(nextFile, '')
  }

  const handleInputChange = (event) => {
    const nextFile = event.target.files?.[0]
    if (nextFile) selectFile(nextFile)
  }

  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) {
      setCaptureError('Unable to capture the receipt. Please try again.')
      return
    }
    selectFile(dataUrlToFile(imageSrc))
  }

  const resetSelection = () => {
    setCaptureError('')
    onFileSelect(null, '')
    if (inputRef.current) inputRef.current.value = ''
  }

  const activeError = captureError || error

  return (
    <div className="space-y-4">
      {showCamera && (
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode('camera')}
            className={`rounded-lg px-3 py-2 ${mode === 'camera' ? 'bg-white shadow' : 'text-slate-600'}`}
          >
            📷 Take Photo
          </button>
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`rounded-lg px-3 py-2 ${mode === 'file' ? 'bg-white shadow' : 'text-slate-600'}`}
          >
            📁 Upload File
          </button>
        </div>
      )}

      {showCamera && mode === 'camera' ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl bg-black shadow">
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={capturePhoto}
            className="w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white"
          >
            Capture Receipt
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center shadow-sm">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleInputChange}
          />
          <p className="text-sm text-slate-600">Upload a photo or PDF copy of the fuel receipt.</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-xl border border-brand-200 px-4 py-2 font-medium text-brand-700"
          >
            Choose File
          </button>
        </div>
      )}

      {file && (
        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Receipt Preview</h3>
              <p className="text-sm text-slate-500">{file.name}</p>
            </div>
            <button type="button" onClick={resetSelection} className="text-sm font-medium text-brand-700">
              Retake / Change
            </button>
          </div>
          {file.type === 'application/pdf' ? (
            <div className="mt-4 rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-600">📄 PDF receipt selected</div>
          ) : (
            <img src={previewUrl} alt="Receipt preview" className="mt-4 max-h-72 w-full rounded-xl object-cover" />
          )}
        </div>
      )}

      {activeError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{activeError}</p>}
    </div>
  )
}
