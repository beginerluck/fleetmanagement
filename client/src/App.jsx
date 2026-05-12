import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './components/auth/LoginPage'
import DriverDashboard from './components/driver/DriverDashboard'
import ScanTrip from './components/driver/ScanTrip'
import TripConfirm from './components/driver/TripConfirm'
import ActiveTrip from './components/driver/ActiveTrip'
import ManagementDashboard from './components/management/ManagementDashboard'
import CalendarPage from './components/management/CalendarPage'
import DriverCalendar from './components/driver/DriverCalendar'
import ProtectedRoute from './components/shared/ProtectedRoute'
import RoleRoute from './components/shared/RoleRoute'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={['driver']} />}>
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/scan" element={<ScanTrip />} />
            <Route path="/driver/trip/confirm" element={<TripConfirm />} />
            <Route path="/driver/trip/:id" element={<ActiveTrip />} />
            <Route path="/driver/calendar" element={<DriverCalendar />} />
          </Route>

          <Route element={<RoleRoute roles={['manager', 'admin']} />}>
            <Route path="/dashboard" element={<ManagementDashboard />} />
            <Route path="/dashboard/calendar" element={<CalendarPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
