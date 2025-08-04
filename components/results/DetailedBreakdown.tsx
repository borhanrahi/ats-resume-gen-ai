'use client';

interface DetailedBreakdownProps {
  breakdown: {
    formatting: number;
    keywords: number;
    structure: number;
    length: number;
  };
  keywordMatch?: {
    found: string[];
    missing: string[];
    matchPercentage: number;
    suggestions: string[];
  };
}

export default function DetailedBreakdown({ breakdown, keywordMatch }: DetailedBreakdownProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Score Breakdown */}
      <div className="analysis-card p-6">
        <h3 className="text-lg font-semibold mb-6">Score Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(breakdown).map(([category, score]) => (
            <div key={category}>
              <div className="flex justify-between items-center mb-2">
                <span className="capitalize font-medium">{category}</span>
                <span className="font-semibold">{score}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords (if job-specific analysis) */}
      {keywordMatch && (
        <div className="analysis-card p-6">
          <h3 className="text-lg font-semibold mb-6">Keyword Analysis</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-success mb-2">Found Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {keywordMatch.found.map((keyword, index) => (
                  <span key={index} className="keyword-found">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-destructive mb-2">Missing Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {keywordMatch.missing.map((keyword, index) => (
                  <span key={index} className="keyword-missing">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}