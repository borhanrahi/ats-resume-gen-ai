"use client";

import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Wand2,
  Crown,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { GrammarIssue } from "@/types/analysis";

interface GrammarCheckerProps {
  issues: GrammarIssue[];
  originalText: string;
  isPremium?: boolean;
  onFixIssue?: (issueId: string, fixedText: string) => void;
  className?: string;
}

interface IssueTypeInfo {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
}

const issueTypeInfo: Record<GrammarIssue["type"], IssueTypeInfo> = {
  grammar: {
    icon: AlertCircle,
    label: "Grammar",
    description: "Grammatical errors and syntax issues",
    color: "text-red-600 bg-red-50 border-red-200",
  },
  spelling: {
    icon: AlertCircle,
    label: "Spelling",
    description: "Spelling mistakes and typos",
    color: "text-red-600 bg-red-50 border-red-200",
  },
  tone: {
    icon: Info,
    label: "Tone",
    description: "Professional tone and style improvements",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  clarity: {
    icon: Eye,
    label: "Clarity",
    description: "Clarity and readability improvements",
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
};

const severityInfo = {
  high: {
    icon: AlertCircle,
    label: "High",
    color: "text-red-600 bg-red-50 border-red-200",
    order: 1,
  },
  medium: {
    icon: Info,
    label: "Medium",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    order: 2,
  },
  low: {
    icon: CheckCircle,
    label: "Low",
    color: "text-gray-600 bg-gray-50 border-gray-200",
    order: 3,
  },
};

function HighlightedText({
  text,
  issues,
  showHighlights,
  onIssueClick,
}: {
  text: string;
  issues: GrammarIssue[];
  showHighlights: boolean;
  onIssueClick: (issue: GrammarIssue) => void;
}) {
  const highlightedText = useMemo(() => {
    if (!showHighlights || issues.length === 0) {
      return text;
    }

    // Sort issues by position to avoid overlapping highlights
    const sortedIssues = [...issues].sort(
      (a, b) => a.position.start - b.position.start
    );

    let result = "";
    let lastIndex = 0;

    sortedIssues.forEach((issue) => {
      // Add text before the issue
      result += text.slice(lastIndex, issue.position.start);

      // Add highlighted issue text
      const issueText = text.slice(issue.position.start, issue.position.end);
      const severityColor = severityInfo[issue.severity].color;

      result += `<span 
        class="relative cursor-pointer underline decoration-wavy decoration-2 ${
          severityColor.split(" ")[0]
        } hover:bg-opacity-20 transition-colors" 
        data-issue-id="${issue.id}"
        title="${issue.type}: ${issue.suggestion}"
      >${issueText}</span>`;

      lastIndex = issue.position.end;
    });

    // Add remaining text
    result += text.slice(lastIndex);

    return result;
  }, [text, issues, showHighlights]);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const issueId = target.getAttribute("data-issue-id");
    if (issueId) {
      const issue = issues.find((i) => i.id === issueId);
      if (issue) {
        onIssueClick(issue);
      }
    }
  };

  return (
    <div
      className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-lg border text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlightedText }}
      onClick={handleClick}
    />
  );
}

function IssueCard({
  issue,
  isPremium,
  onFix,
  isExpanded,
  onToggle,
}: {
  issue: GrammarIssue;
  isPremium: boolean;
  onFix?: (issueId: string, fixedText: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const typeData = issueTypeInfo[issue.type];
  const severityData = severityInfo[issue.severity];
  const TypeIcon = typeData.icon;
  const SeverityIcon = severityData.icon;

  const handleFix = () => {
    if (onFix && isPremium) {
      onFix(issue.id, issue.suggestion);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <TypeIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <span className="font-medium text-sm capitalize">
                {issue.type} Issue
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Found:{" "}
              <span className="font-mono bg-muted px-1 rounded">
                &quot;{issue.text}&quot;
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${severityData.color}`}
            >
              <SeverityIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{severityData.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
          <div className="pt-4 space-y-3">
            {/* Issue Type Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${typeData.color}`}
            >
              <TypeIcon className="w-3 h-3" />
              {typeData.label}
            </div>

            {/* Original Text */}
            <div>
              <h5 className="font-medium text-sm mb-2">Original Text:</h5>
              <p className="text-sm font-mono bg-red-50 text-red-800 p-2 rounded border border-red-200">
                &quot;{issue.text}&quot;
              </p>
            </div>

            {/* Suggested Fix */}
            <div>
              <h5 className="font-medium text-sm mb-2">Suggested Fix:</h5>
              <p className="text-sm font-mono bg-green-50 text-green-800 p-2 rounded border border-green-200">
                &quot;{issue.suggestion}&quot;
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {isPremium ? (
                <button
                  onClick={handleFix}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  Apply Fix
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground rounded-md text-sm">
                  <Crown className="w-4 h-4" />
                  <span>Premium feature</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrammarChecker({
  issues,
  originalText,
  isPremium = false,
  onFixIssue,
  className = "",
}: GrammarCheckerProps) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);
  const [filterBy, setFilterBy] = useState<
    "all" | GrammarIssue["type"] | GrammarIssue["severity"]
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort issues
  const processedIssues = useMemo(() => {
    let filtered = issues;

    // Apply filters
    if (filterBy !== "all") {
      if (filterBy in issueTypeInfo) {
        filtered = issues.filter((issue) => issue.type === filterBy);
      } else if (filterBy in severityInfo) {
        filtered = issues.filter((issue) => issue.severity === filterBy);
      }
    }

    // Sort by severity (high to low) then by position
    return filtered.sort((a, b) => {
      const severityDiff =
        severityInfo[a.severity].order - severityInfo[b.severity].order;
      if (severityDiff !== 0) return severityDiff;
      return a.position.start - b.position.start;
    });
  }, [issues, filterBy]);

  // Group issues by type for stats
  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    issues.forEach((issue) => {
      stats[issue.type] = (stats[issue.type] || 0) + 1;
    });
    return stats;
  }, [issues]);

  const severityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    issues.forEach((issue) => {
      stats[issue.severity] = (stats[issue.severity] || 0) + 1;
    });
    return stats;
  }, [issues]);

  const handleIssueToggle = (id: string) => {
    setExpandedIssue(expandedIssue === id ? null : id);
  };

  const handleIssueClick = (issue: GrammarIssue) => {
    setExpandedIssue(issue.id);
  };

  if (issues.length === 0) {
    return (
      <div
        className={`bg-card border border-border rounded-lg p-6 text-center ${className}`}
      >
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Excellent Writing!</h3>
        <p className="text-muted-foreground">
          No grammar or style issues detected in your resume.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Stats */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Grammar & Style Analysis
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              {issues.length} issue{issues.length !== 1 ? "s" : ""} found in
              your resume
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(severityStats).map(([severity, count]) => {
              const info = severityInfo[severity as keyof typeof severityInfo];
              const Icon = info.icon;
              return (
                <div
                  key={severity}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${info.color}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Text Preview with Highlights */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Resume Text Preview</h4>
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showHighlights ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Issues
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Issues
              </>
            )}
          </button>
        </div>

        <HighlightedText
          text={originalText}
          issues={issues}
          showHighlights={showHighlights}
          onIssueClick={handleIssueClick}
        />

        {showHighlights && (
          <p className="text-xs text-muted-foreground mt-2">
            Click on highlighted text to view issue details
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div className="text-sm text-muted-foreground">
            Showing {processedIssues.length} of {issues.length} issues
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filter by Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Filter by Type:
                </label>
                <select
                  value={filterBy}
                  onChange={(e) =>
                    setFilterBy(e.target.value as typeof filterBy)
                  }
                  className="w-full p-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="all">All Issues</option>
                  {Object.entries(issueTypeInfo).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label} ({typeStats[key] || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Severity */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Filter by Severity:
                </label>
                <select
                  value={filterBy}
                  onChange={(e) =>
                    setFilterBy(e.target.value as typeof filterBy)
                  }
                  className="w-full p-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="all">All Severities</option>
                  {Object.entries(severityInfo).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label} ({severityStats[key] || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {processedIssues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            isPremium={isPremium}
            onFix={onFixIssue}
            isExpanded={expandedIssue === issue.id}
            onToggle={() => handleIssueToggle(issue.id)}
          />
        ))}
      </div>

      {processedIssues.length === 0 && filterBy !== "all" && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-medium mb-2">No issues found</h4>
          <p className="text-sm text-muted-foreground mb-4">
            No issues match the current filter criteria.
          </p>
          <button
            onClick={() => setFilterBy("all")}
            className="text-sm text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Premium Upgrade Prompt */}
      {!isPremium && issues.length > 0 && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4 md:p-6">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-6 h-6 text-primary" />
            <h4 className="font-semibold">Upgrade to Premium</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Get one-click fixes for all grammar and style issues, plus advanced
            writing suggestions.
          </p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            Upgrade Now
          </button>
        </div>
      )}
    </div>
  );
}
