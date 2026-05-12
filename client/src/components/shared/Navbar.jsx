import { useAuth } from '../../context/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-brand-700">FleetTrack 🚛</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1">{user?.name}</span>
          <button
            onClick={logout}
            className="rounded-md bg-brand-500 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
