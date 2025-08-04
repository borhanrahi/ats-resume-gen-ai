'use client';

interface GrammarIssue {
  id: string;
  type: string;
  text: string;
  suggestion: string;
  severity: string;
}

interface GrammarIssuesProps {
  issues: GrammarIssue[];
}

export default function GrammarIssues({ issues }: GrammarIssuesProps) {
  return (
    <div className="analysis-card p-6">
      <h3 className="text-lg font-semibold mb-6">Grammar & Style Issues</h3>
      <div className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="capitalize font-medium">{issue.type}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                issue.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                issue.severity === 'medium' ? 'bg-warning/10 text-warning' :
                'bg-muted text-muted-foreground'
              }`}>
                {issue.severity}
              </span>
            </div>
            <p className="text-sm mb-2">
              <span className="text-destructive">Original:</span> &ldquo;{issue.text}&rdquo;
            </p>
            <p className="text-sm">
              <span className="text-success">Suggested:</span> &ldquo;{issue.suggestion}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}