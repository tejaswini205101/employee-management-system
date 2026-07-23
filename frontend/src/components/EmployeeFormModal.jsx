import { useState, useEffect } from 'react'

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '',
  position: '', department_id: '', salary: '', date_joined: '', status: 'active',
}

export default function EmployeeFormModal({ departments, initial, onClose, onSubmit, submitting, errorMsg }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (initial) {
      setForm({
        first_name: initial.first_name,
        last_name: initial.last_name,
        email: initial.email,
        phone: initial.phone || '',
        position: initial.position,
        department_id: initial.department_id,
        salary: initial.salary,
        date_joined: initial.date_joined,
        status: initial.status,
      })
    } else {
      setForm(emptyForm)
    }
  }, [initial])

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, salary: Number(form.salary) })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial ? 'Edit employee' : 'Add employee'}</h2>
        {errorMsg && <div className="error-banner">{errorMsg}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>First name</label>
              <input className="input" required value={form.first_name} onChange={update('first_name')} />
            </div>
            <div className="field">
              <label>Last name</label>
              <input className="input" required value={form.last_name} onChange={update('last_name')} />
            </div>
            <div className="field full">
              <label>Email</label>
              <input className="input" type="email" required value={form.email} onChange={update('email')} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input className="input" value={form.phone} onChange={update('phone')} />
            </div>
            <div className="field">
              <label>Position</label>
              <input className="input" required value={form.position} onChange={update('position')} />
            </div>
            <div className="field">
              <label>Department</label>
              <select className="select" required value={form.department_id} onChange={update('department_id')}>
                <option value="" disabled>Select…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Salary (annual)</label>
              <input className="input" type="number" min="0" step="1000" required value={form.salary} onChange={update('salary')} />
            </div>
            <div className="field">
              <label>Date joined</label>
              <input className="input" type="date" required value={form.date_joined} onChange={update('date_joined')} />
            </div>
            <div className="field">
              <label>Status</label>
              <select className="select" value={form.status} onChange={update('status')}>
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
