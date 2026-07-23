import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext.jsx'

export default function PortalHome() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [notLinked, setNotLinked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await client.get('/employees/', { params: { search: user.email, limit: 5 } })
        const match = data.find((e) => e.email.toLowerCase() === user.email.toLowerCase())
        if (match) setProfile(match)
        else setNotLinked(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.email])

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Welcome</div>
          <h1 className="page-title">Hi, {user?.name?.split(' ')[0]}</h1>
          <p className="page-sub">This is your personal workspace.</p>
        </div>
      </div>

      {loading ? (
        <p className="page-sub">Loading your profile…</p>
      ) : notLinked ? (
        <div className="panel empty-state">
          <h3>No employee record linked yet</h3>
          <p>Ask an admin to add you as an employee using the same email you registered with ({user.email}).</p>
        </div>
      ) : (
        <div className="panel profile-card" style={{ marginBottom: 20 }}>
          <div className="profile-avatar-lg">{profile.first_name[0]}{profile.last_name[0]}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>
              {profile.first_name} {profile.last_name}
            </div>
            <div className="profile-meta">
              <span><strong>Position:</strong> {profile.position}</span>
              <span><strong>Department:</strong> {profile.department_name || '—'}</span>
              <span><strong>Joined:</strong> {profile.date_joined}</span>
              <span>
                <strong>Status:</strong>{' '}
                <span className={`chip chip-${profile.status}`}><span className="chip-dot" />{profile.status}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        <Link to="/portal/attendance" className="panel" style={{ padding: 20, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>My attendance →</div>
          <div style={{ color: 'var(--portal-muted)', fontSize: 13 }}>View your attendance history and summary</div>
        </Link>
        <Link to="/portal/directory" className="panel" style={{ padding: 20, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Team directory →</div>
          <div style={{ color: 'var(--portal-muted)', fontSize: 13 }}>Look up colleagues and their departments</div>
        </Link>
        <Link to="/portal/departments" className="panel" style={{ padding: 20, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Departments →</div>
          <div style={{ color: 'var(--portal-muted)', fontSize: 13 }}>See how the org is structured</div>
        </Link>
      </div>
    </>
  )
}
