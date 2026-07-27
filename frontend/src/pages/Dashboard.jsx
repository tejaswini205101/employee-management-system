import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext.jsx'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function Dashboard() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [todayAttendance, setTodayAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const today = todayStr()
        const [empRes, deptRes, attRes] = await Promise.all([
          client.get('/employees/', { params: { limit: 500 } }),
          client.get('/departments/'),
          client.get('/attendance/', { params: { date_from: today, date_to: today } }),
        ])
        setEmployees(empRes.data)
        setDepartments(deptRes.data)
        setTodayAttendance(attRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const payroll = employees.reduce((sum, e) => sum + (e.status !== 'terminated' ? e.salary : 0), 0)
  const presentToday = todayAttendance.filter((a) => a.status === 'present').length
  const onLeaveToday = todayAttendance.filter((a) => a.status === 'leave').length

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Overview</div>
          <h1 className="page-title">Good to see you, {user?.name?.split(' ')[0]}</h1>
          <p className="page-sub">Here's how the org looks right now.</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="panel stat-card">
          <div className="stat-label">Total employees</div>
          <div className="stat-value">{loading ? '—' : employees.length}</div>
        </div>
        <div className="panel stat-card">
          <div className="stat-label">Present today</div>
          <div className="stat-value">{loading ? '—' : presentToday}</div>
        </div>
        <div className="panel stat-card">
          <div className="stat-label">On leave today</div>
          <div className="stat-value">{loading ? '—' : onLeaveToday}</div>
        </div>
        <div className="panel stat-card">
          <div className="stat-label">Monthly payroll</div>
          <div className="stat-value mono">{loading ? '—' : `$${payroll.toLocaleString()}`}</div>
        </div>
      </div>

      <div className="panel" style={{ padding: '20px 22px' }}>
        <div className="stat-label" style={{ marginBottom: 14 }}>Departments</div>
        {departments.length === 0 && !loading ? (
          <p className="page-sub" style={{ margin: 0 }}>No departments yet — add one from the Departments page.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {departments.map((d) => {
              const count = employees.filter((e) => e.department_id === d.id).length
              return (
                <div key={d.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600 }}>{d.name}</div>
                  <div className="mono" style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{count} people</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}