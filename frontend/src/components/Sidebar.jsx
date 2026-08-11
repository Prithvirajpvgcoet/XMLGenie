import { useNavigate, NavLink } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Upload, Settings, LogOut, FileCode2 } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: MessageSquare, label: 'Chat', to: '/chat/0' },
  { icon: Upload, label: 'Upload', to: '/dashboard' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const initials = 'PT'

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <FileCode2 size={20} />
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink key={label} to={to} className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <Icon size={20} />
            <span className="tooltip">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="sidebar-item" onClick={handleLogout}>
          <LogOut size={18} />
          <span className="tooltip">Logout</span>
        </button>
        <div className="avatar" title="Profile">{initials}</div>
      </div>
    </aside>
  )
}
