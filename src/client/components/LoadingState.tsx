import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

const STEPS = [
  'Validating repository format & permissions...',
  'Fetching repository metadata, stars & license...',
  'Analyzing pull request merge turnarounds & 30-day velocity...',
  'Calculating issue resolution ratio & average close latency...',
  'Compiling overall 0-100 Repository Health Score...',
];

export const LoadingState: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-card" role="status" aria-live="polite">
      <div className="spinner" />
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Analyzing Repository Health
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Querying GitHub API and computing maintainability indices...
        </p>
      </div>

      <div className="loading-steps">
        {STEPS.map((step, idx) => {
          const isDone = idx < activeStep;
          const isActive = idx === activeStep;

          return (
            <div
              key={step}
              className={`loading-step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
            >
              {isDone ? (
                <CheckCircle2 size={15} />
              ) : isActive ? (
                <Loader2 size={15} className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />
              ) : (
                <Circle size={15} />
              )}
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
