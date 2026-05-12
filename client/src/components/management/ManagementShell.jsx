import { Link, Outlet, useLocation } from 'react-router-dom'
import Navbar from '../shared/Navbar'

const navItems = [
  { label: 'Overview', to: '/dashboard', activePaths: ['/dashboard'] },
  { label: '⛽ Fuel', to: '/dashboard/fuel', activePaths: ['/dashboard/fuel'] },
  { label: 'Calendar' },
  { label: 'Fleet' },
  { label: 'Compliance' },
  { label: 'Reports' },
  { label: 'Alerts' },
]

export default function ManagementShell() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[240px,1fr]">
        <aside className="rounded-3xl bg-white p-4 shadow">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const active = item.activePaths?.includes(location.pathname)
              if (!item.to) {
                return (
                  <li key={item.label} className="rounded-xl px-3 py-2 text-sm text-slate-500">
                    {item.label}
                  </li>
                )
              }

              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className={`block rounded-xl px-3 py-2 text-sm font-medium ${
                      active ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-brand-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </aside>
        <main className="space-y-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
