import { Link } from 'react-router-dom'

export default function ManagementDashboard() {
  return (
    <>
      <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Dashboard</p>
          <h2 className="text-2xl font-bold text-slate-900">FleetTrack</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>🔔 3</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">Manager</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Vehicles / Available Now" value="12 / 8" />
        <Card title="Bookings Today" value="8" />
        <Card title="Fuel Spend MTD" value="$24,500" />
        <Card title="Active Compliance Alerts" value="3" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-3xl bg-white p-6 shadow">
          <h3 className="text-lg font-semibold">Calendar</h3>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow">
          <h3 className="text-lg font-semibold">Fleet</h3>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Fuel</h3>
            <Link to="/dashboard/fuel" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white">
              Open Records
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-500">Review uploaded receipts, audit spend, and export monthly fuel reports.</p>
        </section>
      </div>
    </>
  )
}

function Card({ title, value }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-brand-700">{value}</p>
    </div>
  )
}
