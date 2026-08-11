import { useNavigate } from 'react-router-dom'
import { FileCode2, Zap, Search, GitCompare, ArrowRight } from 'lucide-react'

const features = [
  'Upload any XML — configs, invoices, EHR, SOAP',
  'Ask questions in plain English',
  'Agent cites exact XPath sources',
  'Compare two XML versions',
]

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="landing">
      <div className="landing-card">
        {/* LEFT — visual */}
        <div className="landing-left">
          <div className="landing-visual">
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>invoices_v1.xml</span>
            </div>
            <div className="landing-xml-preview">
              <div><span className="xml-tag">&lt;InvoiceBundle&gt;</span></div>
              <div style={{ paddingLeft: 16 }}>
                <span className="xml-tag">&lt;Invoice </span>
                <span className="xml-attr">id</span>=<span className="xml-value">"ORD-4521"</span>
                <span className="xml-tag">&gt;</span>
              </div>
              <div style={{ paddingLeft: 32 }}>
                <span className="xml-tag">&lt;Total&gt;</span>
                <span className="xml-text">$168.29</span>
                <span className="xml-tag">&lt;/Total&gt;</span>
              </div>
              <div style={{ paddingLeft: 32 }}>
                <span className="xml-tag">&lt;Status&gt;</span>
                <span className="xml-text">Paid</span>
                <span className="xml-tag">&lt;/Status&gt;</span>
              </div>
              <div style={{ paddingLeft: 16 }}>
                <span className="xml-tag">&lt;/Invoice&gt;</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', paddingLeft: 16, fontSize: 11 }}>
                ... 7 more invoices
              </div>
            </div>

            <div style={{
              marginTop: 20,
              background: 'rgba(74,108,247,0.15)',
              border: '1px solid rgba(74,108,247,0.3)',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 13,
              color: 'rgba(255,255,255,0.85)',
            }}>
              <div style={{ color: '#7DD3FC', fontSize: 11, marginBottom: 4, fontWeight: 500 }}>
                ✦ XMLGenie Agent
              </div>
              Found 8 invoices. ORD-4524 has the highest total at <strong style={{ color: '#86EFAC' }}>$4,169.81</strong> — found at <code style={{ fontSize: 10, color: '#FCA5A5' }}>/InvoiceBundle/Invoice[4]</code>
            </div>
          </div>
        </div>

        {/* RIGHT — branding */}
        <div className="landing-right">
          <div className="landing-logo">
            <FileCode2 size={26} />
          </div>
          <h1 className="landing-title">XMLGenie</h1>
          <p className="landing-sub">Agentic RAG Copilot for XML Data.<br />Query any XML in plain English.</p>
          <div className="landing-features">
            {features.map(f => (
              <div key={f} className="landing-feature">
                <div className="landing-feature-dot" />
                {f}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px 24px', fontSize: 15 }}
              onClick={() => navigate('/signup')}>
              Get Started <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'center' }}
              onClick={() => navigate('/login')}>
              Sign in to existing account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
