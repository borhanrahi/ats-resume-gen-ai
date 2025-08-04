'use client';

interface Recommendation {
  id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  suggestion: string;
  impact: string;
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

export default function RecommendationsList({ recommendations }: RecommendationsListProps) {
  return (
    <div className="analysis-card p-6 mb-8">
      <h3 className="text-lg font-semibold mb-6">Recommendations</h3>
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium">{rec.title}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                rec.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                rec.priority === 'medium' ? 'bg-warning/10 text-warning' :
                'bg-muted text-muted-foreground'
              }`}>
                {rec.priority}
              </span>
            </div>
            <p className="text-muted-foreground mb-3">{rec.description}</p>
            <div className="bg-muted/50 rounded p-3 mb-2">
              <p className="text-sm"><strong>Suggestion:</strong> {rec.suggestion}</p>
            </div>
            <p className="text-sm text-success">{rec.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}