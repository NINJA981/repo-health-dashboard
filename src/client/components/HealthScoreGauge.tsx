import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { HealthScoreResult } from '../types';

interface HealthScoreGaugeProps {
  healthScore: HealthScoreResult;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ healthScore }) => {
  const [showFormula, setShowFormula] = useState(false);
  const { overallScore, grade, ratingLabel, summary, strengths, warnings, formulaDocumentation } =
    healthScore;

  // Radial SVG calculation
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (overallScore / 100) * circumference;

  let scoreColor = 'var(--color-success)';
  let gradeBg = 'var(--color-success-bg)';
  let gradeBorder = 'var(--color-success-border)';
  let gradeColor = 'var(--color-success)';

  if (overallScore < 45) {
    scoreColor = 'var(--color-danger)';
    gradeBg = 'var(--color-danger-bg)';
    gradeBorder = 'var(--color-danger-border)';
    gradeColor = 'var(--color-danger)';
  } else if (overallScore < 70) {
    scoreColor = 'var(--color-warning)';
    gradeBg = 'var(--color-warning-bg)';
    gradeBorder = 'var(--color-warning-border)';
    gradeColor = 'var(--color-warning)';
  } else if (overallScore < 85) {
    scoreColor = 'var(--color-info)';
    gradeBg = 'var(--color-info-bg)';
    gradeBorder = 'rgba(59, 130, 246, 0.3)';
    gradeColor = 'var(--color-info)';
  }

  return (
    <div className="score-hero-card">
      <div className="gauge-wrapper">
        <svg width="200" height="200" viewBox="0 0 200 200" className="radial-svg">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="14"
            className="radial-bg"
          />
          {/* Active progress arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            className="radial-meter"
          />
        </svg>

        <div className="gauge-center-text">
          <span className="gauge-number" style={{ color: scoreColor }}>
            {overallScore}
          </span>
          <span className="gauge-max">out of 100</span>
        </div>

        <div
          className="gauge-grade-badge"
          style={{
            backgroundColor: gradeBg,
            borderColor: gradeBorder,
            color: gradeColor,
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        >
          Grade {grade}
        </div>
      </div>

      <div className="score-details-col">
        <div className="score-rating-header">
          <h2 className="score-rating-label">{ratingLabel}</h2>
        </div>

        <p className="score-summary-text">{summary}</p>

        {/* Signals Container */}
        <div className="signals-container">
          {strengths.slice(0, 3).map((strength, i) => (
            <div key={`str-${i}`} className="signal-box strength">
              <CheckCircle2 size={16} />
              <span>{strength}</span>
            </div>
          ))}

          {warnings.slice(0, 3).map((warning, i) => (
            <div key={`warn-${i}`} className="signal-box warning">
              <AlertTriangle size={16} />
              <span>{warning}</span>
            </div>
          ))}
        </div>

        {/* Formula Accordion */}
        <div className="formula-accordion" style={{ marginTop: '0.5rem' }}>
          <button
            type="button"
            className="formula-summary-btn"
            onClick={() => setShowFormula(!showFormula)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} style={{ color: 'var(--color-brand)' }} />
              <span>Scoring Formula & Methodology</span>
            </div>
            {showFormula ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showFormula && (
            <div className="formula-body">
              {formulaDocumentation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
