import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, FileCode2, ChevronLeft, BookOpen, Zap } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import axios from 'axios'

function TypingIndicator() {
  return (
    <div className="message ai">
      <div className="message-avatar">✦</div>
      <div className="message-bubble">
        <div className="typing-indicator">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [citations, setCitations] = useState([])
  const [threadId, setThreadId] = useState(null)
  const [docName, setDocName] = useState('XML Document')
  const bottomRef = useRef()

  useEffect(() => {
    const docs = JSON.parse(localStorage.getItem('xml_docs') || '[]')
    const doc = docs.find(d => String(d.id) === String(docId))
    if (doc) setDocName(doc.filename)

    setMessages([{
      role: 'ai',
      text: `Hello! I've loaded **${doc?.filename || 'your XML document'}** (${doc?.node_count || '?'} nodes). Ask me anything about its contents!`,
    }])
  }, [docId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      // Track query count
      const qc = parseInt(localStorage.getItem('query_count') || '0') + 1
      localStorage.setItem('query_count', qc)

      // Run chat agent
      const { data } = await axios.post('/api/chat/', {
        document_id: parseInt(docId),
        message: userMsg,
        thread_id: threadId
      }, { headers: { Authorization: `Bearer ${token}` } })

      setThreadId(data.thread_id)
      setMessages(prev => [...prev, { role: 'ai', text: data.response }])

      // Also retrieve citations
      const { data: retData } = await axios.post('/api/retrieve/', {
        document_id: parseInt(docId),
        query: userMsg
      }, { headers: { Authorization: `Bearer ${token}` } })

      setCitations(retData.hits || [])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function renderText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar title="Chat" subtitle={docName} />
        <div className="chat-layout" style={{ flex: 1, overflow: 'hidden' }}>

          {/* Chat area */}
          <div className="chat-panel">
            {/* Doc info bar */}
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
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Agent Ready</span>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  <div className="message-avatar">{msg.role === 'ai' ? '✦' : 'PT'}</div>
                  <div className="message-bubble"
                    dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
                </div>
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['What are the invoice totals?', 'Find the highest value item', 'List all root elements'].map(s => (
                  <button key={s} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}
                    onClick={() => { setInput(s) }}>
                    <Zap size={12} /> {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="chat-input-bar">
              <div className="chat-input-row">
                <input
                  id="chat-input"
                  placeholder="Ask anything about your XML document…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button id="send-btn" className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
                  <Send size={14} />
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                Agent searches your XML using vector embeddings + Groq LLM
              </div>
            </div>
          </div>

          {/* Citations panel */}
          <div className="citations-panel">
            <div className="citations-header">
              <BookOpen size={14} />
              Source Citations
              {citations.length > 0 && (
                <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{citations.length}</span>
              )}
            </div>

            {citations.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 16px' }}>
                <div className="empty-icon" style={{ width: 44, height: 44 }}>
                  <BookOpen size={20} />
                </div>
                <div className="empty-title" style={{ fontSize: 13 }}>No citations yet</div>
                <div className="empty-text" style={{ fontSize: 12 }}>
                  Ask a question to see the XML nodes the agent retrieved
                </div>
              </div>
            ) : (
              <div className="citations-list">
                {citations.map((hit, i) => (
                  <div key={i} className="citation-item">
                    <div className="citation-xpath">{hit.xpath}</div>
                    <div className="citation-text">{hit.text_content}</div>
                    <div className="citation-score">
                      <span style={{ color: 'var(--success)' }}>●</span>
                      Score: {(hit.score * 100).toFixed(1)}%
                      <span className="badge badge-blue" style={{ marginLeft: 4 }}>{hit.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
