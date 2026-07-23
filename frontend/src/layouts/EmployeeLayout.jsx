import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/portal', label: 'Home' },
  { to: '/portal/directory', label: 'Directory' },
  { to: '/portal/departments', label: 'Departments' },
  { to: '/portal/attendance', label: 'My attendance' },
]

export default function EmployeeLayout({ children }) {
  const { user, logout } = useAuth()
  const initial = user?.name?.[0]?.toUpperCase() || '?'

  return (
    <div className="portal-shell">
      <header className="portal-topbar">
        <div className="portal-brand">
          <span className="portal-brand-mark">OE</span>
          Orbit — My Workspace
        </div>

        <nav className="portal-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/portal'}
              className={({ isActive }) => `portal-nav-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="portal-user">
          <div className="portal-user-name">
            <strong>{user?.name}</strong>
            Employee
          </div>
          <div className="portal-avatar">{initial}</div>
          <button className="portal-logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="portal-main">{children}</main>
    </div>
  )
}
