import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext.jsx'

export default function Departments() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [departments, setDepartments] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = () => client.get('/departments/').then((res) => setDepartments(res.data))

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await client.post('/departments/', { name, description: description || null })
      setName('')
      setDescription('')
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create department')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (dept) => {
    if (!confirm(`Delete the "${dept.name}" department?`)) return
    try {
      await client.delete(`/departments/${dept.id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete department')
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Structure</div>
          <h1 className="page-title">Departments</h1>
          <p className="page-sub">{departments.length} departments defined</p>
        </div>
      </div>

      {isAdmin && (
        <form className="panel" onSubmit={handleCreate} style={{ padding: 20, marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {error && <div className="error-banner" style={{ width: '100%' }}>{error}</div>}
          <div className="field" style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <label>Department name</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Engineering" style={{ width: '100%' }} />
          </div>
          <div className="field" style={{ marginBottom: 0, flex: '2 1 260px' }}>
            <label>Description (optional)</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this team owns" style={{ width: '100%' }} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : '+ Add department'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {departments.map((d) => (
          <div key={d.id} className="panel" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 17 }}>{d.name}</div>
            <p style={{ color: 'var(--muted)', fontSize: 14, minHeight: 20 }}>{d.description || 'No description yet.'}</p>
            {isAdmin && (
              <button className="btn btn-danger" onClick={() => handleDelete(d)}>Delete</button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
