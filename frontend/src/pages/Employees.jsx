import { useEffect, useState, useCallback } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext.jsx'
import EmployeeFormModal from '../components/EmployeeFormModal.jsx'

const statusLabel = { active: 'Active', on_leave: 'On leave', terminated: 'Terminated' }

export default function Employees() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 500 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const { data } = await client.get('/employees/', { params })
      setEmployees(data)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    client.get('/departments/').then((res) => setDepartments(res.data))
  }, [])

  useEffect(() => {
    const t = setTimeout(loadEmployees, 250)
    return () => clearTimeout(t)
  }, [loadEmployees])

  const openAdd = () => { setEditing(null); setFormError(null); setModalOpen(true) }
  const openEdit = (emp) => { setEditing(emp); setFormError(null); setModalOpen(true) }

  const handleSubmit = async (form) => {
    setSubmitting(true)
    setFormError(null)
    try {
      if (editing) {
        await client.put(`/employees/${editing.id}`, form)
      } else {
        await client.post('/employees/', form)
      }
      setModalOpen(false)
      loadEmployees()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (emp) => {
    if (!confirm(`Remove ${emp.first_name} ${emp.last_name} from the roster?`)) return
    await client.delete(`/employees/${emp.id}`)
    loadEmployees()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Roster</div>
          <h1 className="page-title">Employees</h1>
          <p className="page-sub">{employees.length} people on record</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Add employee</button>}
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      <div className="panel table-wrap">
        {employees.length === 0 && !loading ? (
          <div className="empty-state">
            <h3>No employees found</h3>
            <p>Try adjusting your search, or add someone new to the roster.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Salary</th>
                <th>Joined</th>
                <th>Status</th>
                {isAdmin && <th></th>}
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
                  <td className="mono">${emp.salary.toLocaleString()}</td>
                  <td className="mono">{emp.date_joined}</td>
                  <td>
                    <span className={`chip chip-${emp.status}`}>
                      <span className="chip-dot" />
                      {statusLabel[emp.status]}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => openEdit(emp)}>Edit</button>
                        <button className="icon-btn" onClick={() => handleDelete(emp)}>Remove</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <EmployeeFormModal
          departments={departments}
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
          errorMsg={formError}
        />
      )}
    </>
  )
}
