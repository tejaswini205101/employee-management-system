import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import Sidebar from './components/Sidebar.jsx'
import EmployeeLayout from './layouts/EmployeeLayout.jsx'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Employees from './pages/Employees.jsx'
import Departments from './pages/Departments.jsx'
import Attendance from './pages/Attendance.jsx'

import PortalHome from './pages/portal/PortalHome.jsx'
import PortalDirectory from './pages/portal/PortalDirectory.jsx'
import PortalDepartments from './pages/portal/PortalDepartments.jsx'
import PortalAttendance from './pages/portal/PortalAttendance.jsx'

function AdminShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ---- Admin console (dark sidebar) ---- */}
      <Route
        path="/"
        element={
          <AdminRoute>
            <AdminShell><Dashboard /></AdminShell>
          </AdminRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <AdminRoute>
            <AdminShell><Employees /></AdminShell>
          </AdminRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <AdminRoute>
            <AdminShell><Departments /></AdminShell>
          </AdminRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <AdminRoute>
            <AdminShell><Attendance /></AdminShell>
          </AdminRoute>
        }
      />

      {/* ---- Employee portal (warm top-nav, any logged-in account) ---- */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <EmployeeLayout><PortalHome /></EmployeeLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/directory"
        element={
          <ProtectedRoute>
            <EmployeeLayout><PortalDirectory /></EmployeeLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/departments"
        element={
          <ProtectedRoute>
            <EmployeeLayout><PortalDepartments /></EmployeeLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/attendance"
        element={
          <ProtectedRoute>
            <EmployeeLayout><PortalAttendance /></EmployeeLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
