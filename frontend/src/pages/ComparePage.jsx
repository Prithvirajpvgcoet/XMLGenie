import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitCompare, Plus, Minus, Edit3, CheckCircle, ArrowRight, FileCode2 } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import axios from 'axios'

const STATUS_CONFIG = {
  added:    { icon: Plus,     color: '#10B981', bg: 'rgba(16,185,129,0.08)',  label: 'Added',    badge: 'badge-green' },
  removed:  { icon: Minus,    color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   label: 'Removed',  badge: 'badge-red' },
  modified: { icon: Edit3,    color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  label: 'Modified', badge: 'badge-orange' },
}

function DiffRow({ diff }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[diff.status]
  const Icon = cfg.icon

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.color}22`,
      borderRadius: 10,
      marginBottom: 8,
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Icon size={14} color={cfg.color} style={{ flexShrink: 0 }} />
        <code style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace', flex: 1 }}>
          {diff.xpath}
        </code>
        <span className={`badge ${cfg.badge}`} style={{
          background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.color}44`, flexShrink: 0
        }}>
          {cfg.label}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {diff.value_a && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#EF4444', marginBottom: 4, textTransform: 'uppercase' }}>
                {diff.status === 'modified' ? 'Before (Doc A)' : 'Removed'}
              </div>
              <pre style={{
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 6, padding: 10, fontSize: 12, color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', margin: 0
              }}>{diff.value_a}</pre>
            </div>
          )}
          {diff.value_b && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#10B981', marginBottom: 4, textTransform: 'uppercase' }}>
                {diff.status === 'modified' ? 'After (Doc B)' : 'Added'}
              </div>
              <pre style={{
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 6, padding: 10, fontSize: 12, color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', margin: 0
              }}>{diff.value_b}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  const docs = JSON.parse(localStorage.getItem('xml_docs') || '[]')
  const [docA, setDocA] = useState('')
  const [docB, setDocB] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  async function handleCompare() {
    if (!docA || !docB || docA === docB) return
    setLoading(true); setResult(null)
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.post('/api/compare/', {
        doc_id_a: parseInt(docA),
        doc_id_b: parseInt(docB),
      }, { headers: { Authorization: `Bearer ${token}` } })
      setResult(data)
    } catch (e) {
      alert('Compare failed: ' + (e?.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  const filtered = result?.diffs?.filter(d => filter === 'all' || d.status === filter) || []

  const statCards = result ? [
    { label: 'Added',    value: result.total_added,    color: '#10B981', bg: 'rgba(16,185,129,0.08)'  },
    { label: 'Removed',  value: result.total_removed,  color: '#EF4444', bg: 'rgba(239,68,68,0.08)'   },
    { label: 'Modified', value: result.total_modified, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
    { label: 'Total Changes', value: result.total_added + result.total_removed + result.total_modified, color: 'var(--accent)', bg: 'var(--accent-light)' },
  ] : []

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar title="Compare" subtitle="XML Diff Viewer" />
        <div className="page-content">

          {/* Select Documents */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Select Documents to Compare</div>
                <div className="card-sub">Choose two uploaded XML files to find structural differences</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label className="form-label">Document A (Original)</label>
                <select className="form-input" value={docA} onChange={e => setDocA(e.target.value)}>
                  <option value="">Select document…</option>
                  {docs.map(d => (
                    <option key={d.id} value={d.id}>{d.filename} (ID: {d.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 2 }}>
                <div style={{ width: 36, height: 36, background: 'var(--accent-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <ArrowRight size={16} />
                </div>
              </div>

              <div>
                <label className="form-label">Document B (New Version)</label>
                <select className="form-input" value={docB} onChange={e => setDocB(e.target.value)}>
                  <option value="">Select document…</option>
                  {docs.map(d => (
                    <option key={d.id} value={d.id}>{d.filename} (ID: {d.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ paddingBottom: 2 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleCompare}
                  disabled={!docA || !docB || docA === docB || loading}
                  style={{ height: 40 }}
                >
                  {loading
                    ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Comparing…</>
                    : <><GitCompare size={14} /> Compare</>
                  }
                </button>
              </div>
            </div>

            {docA && docB && docA === docB && (
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--warning)' }}>
                ⚠️ Please select two different documents to compare.
              </div>
            )}
          </div>

          {/* No docs uploaded yet */}
          {docs.length < 2 && (
            <div className="empty-state">
              <div className="empty-icon"><GitCompare size={28} /></div>
              <div className="empty-title">Need at least 2 documents</div>
              <div className="empty-text">Upload two XML files from the Dashboard to compare them</div>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                {statCards.map(s => (
                  <div key={s.label} style={{
                    background: s.bg, border: `1px solid ${s.color}33`,
                    borderRadius: 12, padding: 16, textAlign: 'center',
                    transition: 'transform 0.2s ease',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Summary text */}
              <div style={{
                background: 'var(--accent-light)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                fontSize: 13, color: 'var(--text-primary)', display: 'flex', gap: 8, alignItems: 'center'
              }}>
                <CheckCircle size={16} color="var(--accent)" />
                {result.summary}
              </div>

              {/* Explanatory Guide */}
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '16px', marginBottom: 20,
                fontSize: 13, color: 'var(--text-primary)'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--accent)' }}>💡 How to read these results:</div>
                <ul style={{ paddingLeft: 20, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong style={{ color: 'var(--error)' }}>Removed:</strong> These XPaths exist in Document A (Original) but NOT in Document B (New Version).</li>
                  <li><strong style={{ color: 'var(--success)' }}>Added:</strong> These XPaths exist in Document B (New Version) but NOT in Document A (Original).</li>
                  <li><strong style={{ color: 'var(--warning)' }}>Modified:</strong> Common XPaths that exist in both documents but have different content.</li>
                </ul>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  <em>Note: If you compare two completely different XML files with different structures, it is 100% correct behavior to see mostly "Added" and "Removed" items because all their paths differ. To see a more interesting diff, upload the same file twice with a small edit (e.g. change one price manually) and compare those versions.</em>
                </div>
              </div>

              {/* Diff list */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Diff Results</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['all', 'added', 'removed', 'modified'].map(f => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '4px 12px', fontSize: 12, textTransform: 'capitalize' }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="empty-state" style={{ padding: 40 }}>
                    <div className="empty-title">No {filter === 'all' ? '' : filter} changes</div>
                  </div>
                ) : (
                  <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    {filtered.map((d, i) => <DiffRow key={i} diff={d} />)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
