import { useState } from 'react'
import { ChevronRight, ChevronDown, FileJson, Copy } from 'lucide-react'

function TreeNode({ node, isRoot = false }) {
  const [expanded, setExpanded] = useState(isRoot || false)
  const hasChildren = node.children && node.children.length > 0

  const handleCopy = (e, text) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={{ marginLeft: isRoot ? 0 : 16, fontSize: 13, fontFamily: 'monospace' }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          padding: '4px 6px',
          borderRadius: 6,
          cursor: hasChildren ? 'pointer' : 'default',
          color: 'var(--text-primary)',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,108,247,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ color: 'var(--text-muted)', width: 14, display: 'inline-block' }}>
          {hasChildren ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span />}
        </span>
        
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>&lt;{node.name}</span>
        
        {/* Render Attributes */}
        {node.attributes && Object.entries(node.attributes).map(([k, v]) => (
          <span key={k} style={{ color: '#F59E0B' }}>
            <span style={{ color: 'var(--text-primary)' }}> {k}=</span>"{v}"
          </span>
        ))}
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>&gt;</span>
        
        {/* Inline text if small */}
        {!hasChildren && node.text && (
          <span style={{ color: 'var(--text-secondary)' }}>{node.text.length > 40 ? node.text.substring(0,40)+'...' : node.text}</span>
        )}
        
        {!hasChildren && (
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>&lt;/{node.name}&gt;</span>
        )}
      </div>

      {expanded && hasChildren && (
        <div style={{ borderLeft: '1px dashed var(--border)', marginLeft: 6, paddingLeft: 2 }}>
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} />
          ))}
          <div style={{ color: 'var(--accent)', fontWeight: 600, padding: '4px 6px', marginLeft: 8 }}>
            &lt;/{node.name}&gt;
          </div>
        </div>
      )}
    </div>
  )
}

export default function XmlTreeExplorer({ treeData }) {
  if (!treeData) return (
    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
      Loading XML Tree...
    </div>
  )

  return (
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.7)', 
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid var(--border)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      flexShrink: 0
    }}>
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 600
      }}>
        <FileJson size={18} color="var(--accent)" />
        XML Tree Explorer
      </div>
      
      <div style={{ padding: '16px 10px', overflowY: 'auto', flex: 1 }}>
        <TreeNode node={treeData} isRoot={true} />
      </div>
    </div>
  )
}
