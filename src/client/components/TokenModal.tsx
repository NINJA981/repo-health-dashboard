import React, { useState } from 'react';
import { X, Key, ShieldAlert } from 'lucide-react';

interface TokenModalProps {
  isOpen: boolean;
  currentToken: string;
  onSaveToken: (token: string) => void;
  onClose: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  currentToken,
  onSaveToken,
  onClose,
}) => {
  const [tokenInput, setTokenInput] = useState(currentToken);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveToken(tokenInput.trim());
    onClose();
  };

  const handleClear = () => {
    setTokenInput('');
    onSaveToken('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={18} style={{ color: 'var(--color-brand)' }} />
            <h3 className="modal-title">GitHub Token Configuration</h3>
          </div>
          <button
            type="button"
            className="search-clear-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Public GitHub API requests are limited to <strong>60 requests/hour</strong> per IP.
          Adding a personal access token (classic or fine-grained with <code>public_repo</code> access) increases your rate limit to <strong>5,000 requests/hour</strong>.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              htmlFor="pat-input"
              style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}
            >
              PERSONAL ACCESS TOKEN (GH_TOKEN / PAT)
            </label>
            <input
              id="pat-input"
              type="password"
              className="modal-input"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              autoFocus
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <ShieldAlert size={14} />
            <span>Tokens are stored only in your browser session & localStorage.</span>
          </div>

          <div className="modal-footer">
            {currentToken && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClear}
                style={{ marginRight: 'auto', color: 'var(--color-danger)' }}
              >
                Remove Token
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
