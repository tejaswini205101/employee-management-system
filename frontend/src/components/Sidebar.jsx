import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/', label: 'Overview', index: '01' },
  { to: '/employees', label: 'Employees', index: '02' },
  { to: '/departments', label: 'Departments', index: '03' },
  { to: '/attendance', label: 'Attendance', index: '04' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">OE</span>
        Orbit EMS
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-index">{link.index}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{user?.name}</strong>
          {user?.role === 'admin' ? 'Administrator' : 'Staff member'}
        </div>
        <button className="logout-btn" onClick={logout}>Sign out</button>
      </div>
    </aside>
  )
}
