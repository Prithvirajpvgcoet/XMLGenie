import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, FileCode2, ChevronLeft, BookOpen, Zap, Terminal, Activity } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import XmlTreeExplorer from '../components/XmlTreeExplorer.jsx'
import axios from 'axios'

export default function ChatPage() {
  const { docId } = useParams()
  const navigate = useNavigate()
  
  // States
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [citations, setCitations] = useState([])
  const [traces, setTraces] = useState([])
  const [treeData, setTreeData] = useState(null)
  const [docName, setDocName] = useState('XML Document')
  const [activeTab, setActiveTab] = useState('trace') // 'trace' or 'citations'
  
  // Resizable panel states
  const [leftWidth, setLeftWidth] = useState(320)
  const [rightWidth, setRightWidth] = useState(320)
  const [isDragging, setIsDragging] = useState(false)
  
  const bottomRef = useRef()
  const wsRef = useRef(null)

  useEffect(() => {
    // Load doc metadata
    const docs = JSON.parse(localStorage.getItem('xml_docs') || '[]')
    const doc = docs.find(d => String(d.id) === String(docId))
    if (doc) setDocName(doc.filename)

    // Load XML tree
    axios.get(`/api/documents/${docId}/tree`).then(res => {
      setTreeData(res.data.tree)
    }).catch(err => console.error("Failed to load tree", err))

    setMessages([{
      role: 'ai',
      text: `Hello! I've loaded **${doc?.filename || 'your XML document'}**. Ask me anything about its contents!`,
    }])

    // Connect WebSocket
    const ws = new WebSocket(`ws://localhost:5000/api/chat/ws/${docId}`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'token') {
        setMessages(prev => {
          const newMsgs = [...prev]
          const lastMsg = newMsgs[newMsgs.length - 1]
          if (lastMsg && lastMsg.role === 'ai' && !lastMsg.isComplete) {
            newMsgs[newMsgs.length - 1] = { ...lastMsg, text: lastMsg.text + data.content }
          } else {
            newMsgs.push({ role: 'ai', text: data.content, isComplete: false })
          }
          return newMsgs
        })
      } else if (data.type === 'trace') {
        setTraces(prev => [...prev, data.action])
      } else if (data.type === 'done') {
        setLoading(false)
        setMessages(prev => {
          const newMsgs = [...prev]
          if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'ai') {
             newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], isComplete: true }
          }
          return newMsgs
        })
      } else if (data.type === 'error') {
        setLoading(false)
        setMessages(prev => [...prev, { role: 'ai', text: `Error: ${data.content}`, isComplete: true }])
      }
    }
    
    ws.onopen = () => console.log("WebSocket connected")
    ws.onclose = () => console.log("WebSocket disconnected")
    wsRef.current = ws

    return () => ws.close()
  }, [docId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading, traces])

  async function sendMessage() {
    if (!input.trim() || loading || !wsRef.current) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    setTraces([]) // Reset traces for new message
    setActiveTab('trace')

    // Send via WS
    wsRef.current.send(JSON.stringify({ message: userMsg }))

    try {
      const token = localStorage.getItem('token')
      const { data: retData } = await axios.post('/api/retrieve/', {
        document_id: parseInt(docId),
        query: userMsg
      }, { headers: { Authorization: `Bearer ${token}` } })
      setCitations(retData.hits || [])
    } catch (e) {
      console.error("Retrieve failed", e)
    }
  }

  // --- Resize Handlers ---
  const handleLeftDrag = (e) => {
    e.preventDefault()
    setIsDragging(true)
    const startX = e.clientX
    const startWidth = leftWidth
    
    const onMouseMove = (moveEvent) => {
      const newWidth = Math.max(200, Math.min(600, startWidth + (moveEvent.clientX - startX)))
      setLeftWidth(newWidth)
    }
    const onMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const handleRightDrag = (e) => {
    e.preventDefault()
    setIsDragging(true)
    const startX = e.clientX
    const startWidth = rightWidth
    
    const onMouseMove = (moveEvent) => {
      const newWidth = Math.max(250, Math.min(600, startWidth - (moveEvent.clientX - startX)))
      setRightWidth(newWidth)
    }
    const onMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  function renderText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar title="Chat" subtitle={docName} />
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', cursor: isDragging ? 'col-resize' : 'default' }}>
          
          {/* Left Panel: XML Tree Explorer */}
          <div style={{ width: leftWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', pointerEvents: isDragging ? 'none' : 'auto' }}>
            <XmlTreeExplorer treeData={treeData} />
          </div>

          {/* Resizer Left */}
          <div 
            onMouseDown={handleLeftDrag}
            style={{ width: 4, cursor: 'col-resize', background: 'transparent', transition: 'background 0.2s', zIndex: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          />

          {/* Middle Panel: Chat Area */}
          <div className="chat-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', borderLeft: '1px solid var(--border)', pointerEvents: isDragging ? 'none' : 'auto' }}>
            <div style={{
              padding: '10px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--surface)',
            }}>
              <button className="btn-icon" onClick={() => navigate('/dashboard')}>
                <ChevronLeft size={16} />
              </button>
              <div style={{ width: 28, height: 28, background: 'var(--accent-light)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <FileCode2 size={14} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{docName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Document ID: {docId}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Agent Online</span>
              </div>
            </div>

            <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  <div className="message-avatar">{msg.role === 'ai' ? '✦' : 'PT'}</div>
                  <div className="message-bubble"
                    dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
                </div>
              ))}
              {loading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
                <div className="message ai">
                   <div className="message-avatar">✦</div>
                   <div className="message-bubble">
                     <div className="typing-indicator">
                       <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                     </div>
                   </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-bar" style={{ padding: '16px 24px' }}>
              <div className="chat-input-row" style={{ display: 'flex', gap: 10 }}>
                <input
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                  placeholder="Ask anything about your XML document…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn btn-primary" onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: '0 20px', borderRadius: 8 }}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Resizer Right */}
          <div 
            onMouseDown={handleRightDrag}
            style={{ width: 4, cursor: 'col-resize', background: 'transparent', transition: 'background 0.2s', zIndex: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          />

          {/* Right Panel: Trace & Citations */}
          <div style={{ width: rightWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface)', pointerEvents: isDragging ? 'none' : 'auto' }}>
            
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              <button 
                onClick={() => setActiveTab('trace')}
                style={{ 
                  flex: 1, padding: '12px 0', border: 'none', background: 'transparent',
                  color: activeTab === 'trace' ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'trace' ? '2px solid var(--accent)' : '2px solid transparent',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                <Activity size={14} /> Agent Trace
              </button>
              <button 
                onClick={() => setActiveTab('citations')}
                style={{ 
                  flex: 1, padding: '12px 0', border: 'none', background: 'transparent',
                  color: activeTab === 'citations' ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'citations' ? '2px solid var(--accent)' : '2px solid transparent',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                <BookOpen size={14} /> Citations
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {activeTab === 'trace' ? (
                <div>
                  {traces.length === 0 ? (
                     <div className="empty-state">
                        <Terminal size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Agent reasoning will appear here...</div>
                     </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {traces.map((t, i) => (
                        <div key={i} style={{ 
                          padding: 10, borderRadius: 6, fontSize: 12, 
                          background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)',
                          color: 'var(--text-secondary)'
                        }}>
                           <span style={{ color: 'var(--accent)', marginRight: 6 }}>&gt;</span> {t}
                        </div>
                      ))}
                      {loading && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 10 }}>
                          <span className="spinner" style={{ width: 10, height: 10, display: 'inline-block', marginRight: 6 }} /> Thinking...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {citations.length === 0 ? (
                    <div className="empty-state">
                       <BookOpen size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                       <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No citations yet</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {citations.map((hit, i) => (
                        <div key={i} style={{ padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)' }}>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--accent)', marginBottom: 4 }}>{hit.xpath}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 6 }}>{hit.text_content}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Score: {(hit.score * 100).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
