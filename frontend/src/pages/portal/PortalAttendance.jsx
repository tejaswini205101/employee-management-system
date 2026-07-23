import MyAttendancePanel from '../../components/MyAttendancePanel.jsx'

export default function PortalAttendance() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Attendance</div>
          <h1 className="page-title">My attendance</h1>
          <p className="page-sub">Your attendance history and monthly summary.</p>
        </div>
      </div>
      <MyAttendancePanel title="History" />
    </>
  )
}
