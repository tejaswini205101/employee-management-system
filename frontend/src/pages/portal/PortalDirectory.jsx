import { useEffect, useState, useCallback } from 'react'
import client from '../../api/client'

export default function PortalDirectory() {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 500 }
      if (search) params.search = search
      const { data } = await client.get('/employees/', { params })
      setEmployees(data)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Directory</div>
          <h1 className="page-title">Team directory</h1>
          <p className="page-sub">{employees.length} people across the company</p>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 240 }}
        />
      </div>

      <div className="panel table-wrap">
        {employees.length === 0 && !loading ? (
          <div className="empty-state">
            <h3>No matches</h3>
            <p>Try a different search term.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="emp-name">{emp.first_name} {emp.last_name}</div>
                    <div className="emp-email">{emp.email}</div>
                  </td>
                  <td>{emp.position}</td>
                  <td>{emp.department_name || '—'}</td>
                  <td>
                    <span className={`chip chip-${emp.status}`}>
                      <span className="chip-dot" />
                      {emp.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
