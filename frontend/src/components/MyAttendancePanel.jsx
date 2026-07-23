import { useEffect, useState, useCallback } from 'react'
import client from '../api/client'

const statusLabel = { present: 'Present', absent: 'Absent', half_day: 'Half day', leave: 'On leave' }

export default function MyAttendancePanel({ title = 'My attendance' }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [notLinked, setNotLinked] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setNotLinked(false)
    try {
      const params = {}
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const { data } = await client.get('/attendance/me', { params })
      setRecords(data)
    } catch (err) {
      if (err.response?.status === 404) {
        setNotLinked(true)
      }
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const summary = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div className="stat-label">{title}</div>
        <div className="toolbar" style={{ margin: 0 }}>
          <input className="input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>to</span>
          <input className="input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="page-sub">Loading…</p>
      ) : notLinked ? (
        <div className="empty-state">
          <h3>No employee record linked yet</h3>
          <p>Ask an admin to add you as an employee using the same email you registered with, and your attendance will show up here.</p>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <h3>No attendance recorded yet</h3>
          <p>Once attendance is marked for you, it'll appear here.</p>
        </div>
      ) : (
        <>
          <div className="stat-row" style={{ marginBottom: 20 }}>
            <div className="panel stat-card"><div className="stat-label">Present</div><div className="stat-value">{summary.present || 0}</div></div>
            <div className="panel stat-card"><div className="stat-label">Absent</div><div className="stat-value">{summary.absent || 0}</div></div>
            <div className="panel stat-card"><div className="stat-label">Half day</div><div className="stat-value">{summary.half_day || 0}</div></div>
            <div className="panel stat-card"><div className="stat-label">On leave</div><div className="stat-value">{summary.leave || 0}</div></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Status</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.date}</td>
                    <td>
                      <span className={`chip chip-${r.status === 'present' ? 'active' : r.status === 'absent' ? 'terminated' : 'on_leave'}`}>
                        <span className="chip-dot" />
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
