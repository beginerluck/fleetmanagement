import Navbar from '../shared/Navbar'

const navItems = ['Calendar', 'Fleet', 'Compliance', 'Fuel', 'Reports', 'Alerts']

export default function ManagementDashboard() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[220px,1fr]">
        <aside className="rounded-xl bg-white p-4 shadow">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item} className="rounded-lg px-3 py-2 text-sm hover:bg-brand-50">{item}</li>
            ))}
          </ul>
        </aside>
        <main className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow">
            <h2 className="text-xl font-semibold">FleetTrack</h2>
            <div className="flex items-center gap-4 text-sm"><span>🔔 3</span><span className="rounded-full bg-slate-100 px-3 py-1">Manager</span></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Total Vehicles / Available Now" value="12 / 8" />
            <Card title="Bookings Today" value="8" />
            <Card title="Fuel Spend MTD" value="R 24,500" />
            <Card title="Active Compliance Alerts" value="3" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {['Calendar', 'Fleet', 'Compliance', 'Fuel', 'Reports'].map((section) => (
              <section key={section} className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-lg font-semibold">{section}</h3>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

function Card({ title, value }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-brand-700">{value}</p>
    </div>
  )
}
