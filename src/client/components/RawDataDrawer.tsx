import React, { useState } from 'react';
import { Code, Copy, Check, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { RepositoryHealthReport } from '../types';

interface RawDataDrawerProps {
  report: RepositoryHealthReport;
}

export const RawDataDrawer: React.FC<RawDataDrawerProps> = ({ report }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(report, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.repository.owner.login}-${report.repository.name}-health-report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="formula-accordion" style={{ marginTop: '0.5rem' }}>
      <button
        type="button"
        className="formula-summary-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Code size={16} style={{ color: 'var(--color-brand)' }} />
          <span>Raw Report JSON & Export Data</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="formula-body">
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopy}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              {copied ? <Check size={13} style={{ color: 'var(--color-success)' }} /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDownload}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              <Download size={13} />
              <span>Download .json</span>
            </button>
          </div>
          <pre style={{ maxHeight: '350px', overflowY: 'auto', padding: '0.5rem' }}>
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
};
