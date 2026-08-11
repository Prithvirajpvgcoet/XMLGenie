import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileCode2, MessageSquare, Trash2, Clock, Hash, ChevronRight } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import axios from 'axios'

function UploadModal({ onClose, onSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.xml')) setFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.post('/api/upload/', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      onSuccess(data)
      onClose()
    } catch {
      alert('Upload failed. Check your file and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <span>Upload XML File</span>
          <button className="btn-icon" onClick={onClose} style={{ width: 28, height: 28 }}>✕</button>
        </div>

        <div className={`upload-zone${dragging ? ' dragover' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}>
          <input ref={inputRef} type="file" accept=".xml" hidden
            onChange={e => setFile(e.target.files[0])} />
          <div className="upload-icon"><Upload size={22} /></div>
          {file ? (
            <>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Drop XML file here
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>or click to browse</div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!file || loading}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</> : 'Upload & Embed'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [docs, setDocs] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const navigate = useNavigate()

  function loadDocs() {
    const saved = JSON.parse(localStorage.getItem('xml_docs') || '[]')
    setDocs(saved)
  }

  useEffect(() => { loadDocs() }, [])

  function handleSuccess(doc) {
    const saved = JSON.parse(localStorage.getItem('xml_docs') || '[]')
    const updated = [doc, ...saved]
    localStorage.setItem('xml_docs', JSON.stringify(updated))
    setDocs(updated)
  }

  function deleteDoc(id) {
    const updated = docs.filter(d => d.id !== id)
    localStorage.setItem('xml_docs', JSON.stringify(updated))
    setDocs(updated)
  }

  const stats = [
    { label: 'Total Documents', value: docs.length, icon: FileCode2, color: 'blue' },
    { label: 'XML Nodes Indexed', value: docs.reduce((a, d) => a + (d.node_count || 0), 0), icon: Hash, color: 'green' },
    { label: 'Queries Run', value: parseInt(localStorage.getItem('query_count') || '0'), icon: MessageSquare, color: 'purple' },
    { label: 'Root Tags', value: new Set(docs.map(d => d.root_tag)).size, icon: FileCode2, color: 'orange' },
  ]

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar title="Dashboard" />
        <div className="page-content">
          {/* Stats */}
          <div className="stat-cards">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`stat-card ${color}`}>
                <div className={`stat-icon ${color}`}><Icon size={18} /></div>
                <div className="stat-value">{value.toLocaleString()}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Documents table */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">XML Documents</div>
                <div className="card-sub">{docs.length} file{docs.length !== 1 ? 's' : ''} uploaded</div>
              </div>
              <button className="btn btn-primary" id="upload-btn" onClick={() => setShowUpload(true)}>
                <Upload size={14} /> Upload XML
              </button>
            </div>

            {docs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><FileCode2 size={28} /></div>
                <div className="empty-title">No documents yet</div>
                <div className="empty-text">Upload an XML file to start querying with AI</div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowUpload(true)}>
                  <Upload size={14} /> Upload your first XML
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Root Tag</th>
                      <th>Nodes</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map(doc => (
                      <tr key={doc.id} onClick={() => navigate(`/chat/${doc.id}`)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, background: 'var(--accent-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                              <FileCode2 size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{doc.filename}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {doc.id}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-blue">{doc.root_tag || '—'}</span></td>
                        <td style={{ fontWeight: 600 }}>{doc.node_count?.toLocaleString()}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                            <Clock size={12} />
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                            <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 12 }}
                              onClick={() => navigate(`/chat/${doc.id}`)}>
                              Chat <ChevronRight size={13} />
                            </button>
                            <button className="btn-icon" onClick={() => deleteDoc(doc.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleSuccess} />}
    </div>
  )
}
