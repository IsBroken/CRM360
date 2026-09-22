import './Sidebar.css'
export default function Sidebar({ role }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        CRM360
      </div>

      <nav className="sidebar-nav">

        <div className="sidebar-section">
          <div className="sidebar-section-title">FIELD OPERATIONS</div>

          <button className="sidebar-item"
            onClick={() => {
              window.location.href = '/attendance'
            }}
            >
            Attendance
          </button>

          <button className="sidebar-item"
            onClick={() => {
              window.location.href = '/visits'
            }}
            >
            Visits
          </button>
        </div>
    {(role === 'manager' || role === 'admin') && (
  <div className="sidebar-section">
    <div className="sidebar-section-title">MANAGEMENT</div>

    {role === 'admin' && (
      <>
        <button
          className="sidebar-item"
          onClick={() => {
            window.location.href = '/company-master'
          }}
        >
          Company Master
        </button>

        <button
          className="sidebar-item"
          onClick={() => {
            window.location.href = '/employee-master'
          }}
        >
          Employee Master
        </button>
      </>
    )}

    <button
      className="sidebar-item"
      onClick={() => {
        window.location.href = '/manager-attendance'
      }}
    >
      Manager Attendance
    </button>
  </div>
)}
        <div className="sidebar-section">
          <div className="sidebar-section-title">USER</div>

          <button
            className="sidebar-item"
            onClick={() => {
              localStorage.removeItem('token')
              window.location.href = '/login'
            }}
          >
            Logout
          </button>
        </div>
      </nav>
    </aside>
  )
}