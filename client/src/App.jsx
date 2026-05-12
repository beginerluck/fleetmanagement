import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './components/auth/LoginPage'
import DriverDashboard from './components/driver/DriverDashboard'
import ScanTrip from './components/driver/ScanTrip'
import TripConfirm from './components/driver/TripConfirm'
import ActiveTrip from './components/driver/ActiveTrip'
import FuelUpload from './components/driver/FuelUpload'
import ManagementDashboard from './components/management/ManagementDashboard'
import FuelRecords from './components/management/FuelRecords'
import ManagementShell from './components/management/ManagementShell'
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
            <Route path="/driver/fuel" element={<FuelUpload />} />
          </Route>

          <Route element={<RoleRoute roles={['manager', 'admin']} />}>
            <Route path="/dashboard" element={<ManagementShell />}>
              <Route index element={<ManagementDashboard />} />
              <Route path="fuel" element={<FuelRecords />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
