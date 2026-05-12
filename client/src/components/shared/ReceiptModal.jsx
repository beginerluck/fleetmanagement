import api from '../../api/api'

export function resolveReceiptUrl(receiptUrl) {
  if (!receiptUrl) return ''
  if (/^https?:\/\//.test(receiptUrl)) return receiptUrl
  const origin = api.defaults.baseURL.replace(/\/api\/?$/, '')
  return `${origin}${receiptUrl.startsWith('/') ? '' : '/'}${receiptUrl}`
}

export default function ReceiptModal({ record, onClose }) {
  if (!record) return null

  const receiptUrl = resolveReceiptUrl(record.receipt_image_url)
  const isPdf = record.receipt_image_url?.toLowerCase().endsWith('.pdf')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Fuel Receipt</h3>
            <p className="text-sm text-slate-500">{record.station || 'Receipt attachment'}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={receiptUrl}
              download
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white"
            >
              Download
            </a>
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700">
              Close
            </button>
          </div>
        </div>
        <div className="max-h-[calc(90vh-80px)] overflow-auto bg-slate-100 p-4">
          {isPdf ? (
            <iframe title="Fuel receipt PDF" src={receiptUrl} className="h-[70vh] w-full rounded-xl bg-white" />
          ) : (
            <img src={receiptUrl} alt="Fuel receipt" className="mx-auto max-h-[70vh] rounded-xl shadow" />
          )}
        </div>
      </div>
    </div>
  )
}
