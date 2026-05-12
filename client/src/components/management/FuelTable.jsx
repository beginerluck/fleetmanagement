function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-AU').format(new Date(`${value}T00:00:00`))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(value || 0))
}

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'driver', label: 'Driver' },
  { key: 'litres', label: 'Litres' },
  { key: 'cost', label: 'Cost (AUD)' },
  { key: 'cost_per_litre', label: '$/Litre' },
  { key: 'odometer_reading', label: 'Odometer' },
  { key: 'cost_centre', label: 'Cost Centre' },
  { key: 'fuel_type', label: 'Fuel Type' },
  { key: 'station', label: 'Station' },
]

export default function FuelTable({ records, sortBy, sortOrder, onSort, onEdit, onDelete, onViewReceipt }) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-white shadow">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                <button type="button" onClick={() => onSort(column.key)} className="flex items-center gap-1">
                  {column.label}
                  {sortBy === column.key && <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                </button>
              </th>
            ))}
            <th className="px-4 py-3 font-semibold">Trip</th>
            <th className="px-4 py-3 font-semibold">Receipt</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan="13" className="px-4 py-8 text-center text-slate-500">
                No fuel records match the selected filters.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id} className="border-t border-slate-100 align-top">
                <td className="whitespace-nowrap px-4 py-3">{formatDate(record.date)}</td>
                <td className="px-4 py-3">{record.vehicle ? `${record.vehicle.registration_number} — ${record.vehicle.make} ${record.vehicle.model}` : '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{record.driver?.name || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{Number(record.litres || 0).toFixed(2)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatCurrency(record.cost)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatCurrency(record.cost_per_litre)}</td>
                <td className="whitespace-nowrap px-4 py-3">{record.odometer_reading?.toLocaleString?.() || record.odometer_reading}</td>
                <td className="whitespace-nowrap px-4 py-3">{record.cost_centre}</td>
                <td className="whitespace-nowrap px-4 py-3">{record.fuel_type}</td>
                <td className="px-4 py-3">{record.station || '—'}</td>
                <td className="px-4 py-3">{record.trip?.destination || '—'}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onViewReceipt(record)} className="rounded-lg border px-3 py-1.5 font-medium text-brand-700">
                    🖼️ View
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onEdit(record)} className="rounded-lg border px-3 py-1.5 font-medium text-slate-700">
                      Edit
                    </button>
                    <button type="button" onClick={() => onDelete(record)} className="rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-700">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
