import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <Link to="/login" className="text-brand-700">Go to login</Link>
      </div>
    </div>
  )
}
