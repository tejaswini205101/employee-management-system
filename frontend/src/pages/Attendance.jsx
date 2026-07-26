import { useEffect, useState, useCallback } from 'react'
import client from '../api/client'


const todayStr = () => new Date().toISOString().slice(0, 10)

// Admin-only page (guarded by AdminRoute): mark attendance for the team,
// plus the admin's own attendance if they're also linked to an employee record.
export default function Attendance() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Attendance</div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-sub">Mark daily attendance and review the log.</p>
        </div>
      </div>

      <MarkAttendancePanel />
      
    </>
  )
}

function MarkAttendancePanel() {
  const [employees, setEmployees] = useState([])
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [records, setRecords] = useState({}) // employee_id -> attendance record for selectedDate
  const [drafts, setDrafts] = useState({}) // employee_id -> pending status
  const [savingId, setSavingId] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadDay = useCallback(async (dateStr) => {
    setLoading(true)
    try {
      const [empRes, attRes] = await Promise.all([
        client.get('/employees/', { params: { limit: 500, status: 'active' } }),
        client.get('/attendance/', { params: { date_from: dateStr, date_to: dateStr } }),
      ])
      setEmployees(empRes.data)
      const byEmployee = {}
      attRes.data.forEach((r) => { byEmployee[r.employee_id] = r })
      setRecords(byEmployee)
      setDrafts({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDay(selectedDate) }, [selectedDate, loadDay])

  const handleSave = async (employeeId) => {
    const status = drafts[employeeId] || records[employeeId]?.status
    if (!status) return
    setSavingId(employeeId)
    try {
      await client.post('/attendance/mark', { employee_id: employeeId, date: selectedDate, status })
      await loadDay(selectedDate)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="panel" style={{ padding: 20, marginBottom: 24 }}>
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Date</label>
        <input
          className="input"
          type="date"
          value={selectedDate}
          max={todayStr()}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="page-sub">Loading roster…</p>
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <h3>No active employees</h3>
          <p>Add employees from the Employees page first.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const current = drafts[emp.id] ?? records[emp.id]?.status ?? ''
                return (
                  <tr key={emp.id}>
                    <td>
                      <div className="emp-name">{emp.first_name} {emp.last_name}</div>
                      <div className="emp-email">{emp.position}</div>
                    </td>
                    <td>
                      <select
                        className="select"
                        value={current}
                        onChange={(e) => setDrafts((d) => ({ ...d, [emp.id]: e.target.value }))}
                      >
                        <option value="" disabled>Not marked</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="half_day">Half day</option>
                        <option value="leave">On leave</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        disabled={!current || savingId === emp.id}
                        onClick={() => handleSave(emp.id)}
                      >
                        {savingId === emp.id ? 'Saving…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
