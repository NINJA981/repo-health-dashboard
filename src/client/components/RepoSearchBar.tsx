import React, { useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';

interface RepoSearchBarProps {
  initialValue?: string;
  isLoading: boolean;
  onSearch: (repo: string) => void;
}

const PRESET_REPOS = [
  'facebook/react',
  'vercel/next.js',
  'torvalds/linux',
  'vuejs/core',
  'expressjs/express',
  'tailwindlabs/tailwindcss',
];

export const RepoSearchBar: React.FC<RepoSearchBarProps> = ({
  initialValue = '',
  isLoading,
  onSearch,
}) => {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleSelectPreset = (preset: string) => {
    setQuery(preset);
    onSearch(preset);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="search-container">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Enter public GitHub repo URL or owner/repo (e.g. facebook/react)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          {query && !isLoading && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClear}
              aria-label="Clear search input"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="search-submit-btn"
          disabled={isLoading || !query.trim()}
        >
          <span>{isLoading ? 'Analyzing...' : 'Analyze Health'}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="presets-wrapper">
        <span className="presets-label">Popular Repos:</span>
        {PRESET_REPOS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="preset-chip"
            onClick={() => handleSelectPreset(preset)}
            disabled={isLoading}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
};
