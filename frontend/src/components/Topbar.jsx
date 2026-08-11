import { Search, Bell } from 'lucide-react'

export default function Topbar({ title, subtitle }) {
  return (
    <header className="topbar">
      <div>
        <span className="topbar-title">{title}</span>
        {subtitle && <span className="topbar-sub">/ {subtitle}</span>}
      </div>
      <div className="topbar-search">
        <Search size={14} className="search-icon" />
        <input placeholder="Search documents, queries..." />
      </div>
      <div className="topbar-actions">
        <button className="btn-icon"><Bell size={16} /></button>
        <div className="avatar">PT</div>
      </div>
    </header>
  )
}
