import React from 'react';
import { Lightbulb, ArrowUpRight } from 'lucide-react';

interface RecommendationsCardProps {
  recommendations: string[];
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="recommendations-card">
      <div className="card-title-group" style={{ marginBottom: '0.4rem' }}>
        <div className="card-icon-box" style={{ color: 'var(--color-warning)' }}>
          <Lightbulb size={16} />
        </div>
        <h3 className="card-title">Actionable Recommendations</h3>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Suggested steps for repository maintainers to boost project health and contributor throughput:
      </p>

      <ul className="recommendation-list">
        {recommendations.map((rec, index) => (
          <li key={index} className="recommendation-item">
            <ArrowUpRight size={16} />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
