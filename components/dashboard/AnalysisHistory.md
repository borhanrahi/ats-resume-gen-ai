# AnalysisHistory Component

## Overview

The `AnalysisHistory` component is a comprehensive dashboard feature that allows premium users to view, manage, search, filter, and compare their resume analysis history. It provides a mobile-first responsive interface with advanced functionality for managing analysis data.

## Features

### Core Functionality
- **Analysis History Display**: Shows all user's previous resume analyses with detailed information
- **Search & Filter**: Advanced search and filtering capabilities by name, job title, tags, date range, and score
- **Bulk Operations**: Select multiple analyses for bulk actions (download, delete)
- **Analysis Comparison**: Compare two analyses to see improvements and regressions
- **Report Downloads**: Export individual analyses or comparisons in PDF, JSON, or CSV formats
- **Mobile-First Design**: Fully responsive design optimized for mobile devices

### Search & Filtering
- **Text Search**: Search by resume name, job title, or tags
- **Date Range Filter**: Filter analyses by creation date
- **Score Range Filter**: Filter by ATS score range (0-100)
- **Tag Filter**: Filter by analysis tags
- **Sorting Options**: Sort by date, score, name, or job title (ascending/descending)

### Analysis Management
- **View Details**: Quick view of analysis scores and breakdowns
- **Download Reports**: Export analyses in multiple formats
- **Delete Analyses**: Remove unwanted analyses from history
- **Tag Management**: View and filter by analysis tags
- **Comparison Tools**: Side-by-side comparison of two analyses

## Props

```typescript
interface AnalysisHistoryProps {
  className?: string; // Optional CSS classes for styling
}
```

## Dependencies

### External Libraries
- `lucide-react`: Icons for UI elements
- `jspdf`: PDF generation for reports

### Internal Dependencies
- `@/components/ui/*`: UI components (Button, Input, Card, etc.)
- `@/types/history`: TypeScript interfaces for history data
- `@/lib/storage/history-service`: Service for managing analysis history
- `@/lib/storage/report-service`: Service for generating reports
- `@/lib/hooks/useAuth`: Authentication hook for user data

## State Management

### Main State Variables
```typescript
const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisHistoryItem[]>([]);
const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [showFilters, setShowFilters] = useState(false);
const [sortField, setSortField] = useState<SortField>('createdAt');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
const [comparison, setComparison] = useState<AnalysisComparison | null>(null);
const [showComparison, setShowComparison] = useState(false);
```

### Filter State
```typescript
const [filters, setFilters] = useState<HistoryFilters>({});
const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
  start: '',
  end: ''
});
const [scoreRange, setScoreRange] = useState<{ min: number; max: number }>({
  min: 0,
  max: 100
});
const [selectedTags, setSelectedTags] = useState<string[]>([]);
```

## Key Functions

### Data Loading
```typescript
const loadAnalyses = async () => {
  // Loads user's analysis history from the backend
  // Updates analyses state with fetched data
};
```

### Report Generation
```typescript
const handleDownloadReport = async (analysisId: string, format: 'pdf' | 'json' | 'csv') => {
  // Generates and downloads analysis report in specified format
  // Uses reportService to create the report blob
  // Triggers browser download
};
```

### Analysis Management
```typescript
const handleDeleteAnalysis = async (analysisId: string) => {
  // Deletes analysis from user's history
  // Updates local state to remove deleted analysis
};

const handleCompareAnalyses = async () => {
  // Compares two selected analyses
  // Shows comparison dialog with improvements/regressions
};
```

### Filtering & Sorting
```typescript
// Applied via useEffect when dependencies change
// Filters analyses based on search term, date range, score range, and tags
// Sorts results based on selected field and direction
```

## Mobile-First Design

### Responsive Breakpoints
- **Base (350px+)**: Mobile-first design with stacked layout
- **Small (640px+)**: Improved spacing and layout
- **Medium (768px+)**: Grid layouts for better space utilization
- **Large (1024px+)**: Full desktop experience with enhanced features

### Mobile Optimizations
- **Touch-Friendly**: 44px+ touch targets for all interactive elements
- **Compact Layout**: Efficient use of screen space on mobile
- **Progressive Enhancement**: Additional features revealed on larger screens
- **Responsive Tables**: Horizontal scroll on mobile, full table on desktop

## Usage Example

```tsx
import AnalysisHistory from '@/components/dashboard/AnalysisHistory';

function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <AnalysisHistory className="mt-6" />
    </div>
  );
}
```

## API Integration

### History Service
```typescript
// Load analyses
const analyses = await historyService.getHistory(userId, filters, sort);

// Delete analysis
await historyService.deleteAnalysis(analysisId, userId);

// Compare analyses
const comparison = await historyService.compareAnalyses(id1, id2, userId);
```

### Report Service
```typescript
// Generate report
const reportBlob = await reportService.generateAnalysisReport(analysis, options);

// Generate comparison report
const comparisonBlob = await reportService.generateComparisonReport(comparison, options);
```

## Error Handling

The component includes comprehensive error handling for:
- **Network Failures**: Graceful handling of API failures
- **Authentication Issues**: Redirects to login if user is not authenticated
- **Data Validation**: Validates analysis data before processing
- **File Operations**: Handles download and export errors

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Loads analyses on demand
- **Memoization**: Uses useMemo for expensive calculations (tag extraction)
- **Efficient Filtering**: Client-side filtering for better performance
- **Pagination**: Limits initial load to 50 analyses
- **Debounced Search**: Prevents excessive API calls during search

### Memory Management
- **State Cleanup**: Properly cleans up state on unmount
- **Event Listeners**: Removes event listeners to prevent memory leaks
- **Blob URLs**: Properly revokes blob URLs after downloads

## Testing

### Unit Tests
The component includes comprehensive unit tests covering:
- **Filtering Logic**: Tests search and filter functionality
- **Sorting Logic**: Tests various sorting scenarios
- **State Management**: Tests state updates and side effects
- **Utility Functions**: Tests helper functions for scoring and formatting

### Test Coverage
- ✅ Search functionality
- ✅ Filter application
- ✅ Sorting algorithms
- ✅ Score calculations
- ✅ Tag extraction
- ✅ State management

## Accessibility

### ARIA Support
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling for modals and dropdowns
- **Color Contrast**: Meets WCAG 2.1 AA standards

### Semantic HTML
- **Proper Headings**: Hierarchical heading structure
- **Form Labels**: All form inputs have associated labels
- **Button Roles**: Clear button purposes and states
- **List Semantics**: Proper list markup for analysis items

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Charts and graphs for analysis trends
- **Export Templates**: Customizable report templates
- **Collaboration**: Share analyses with team members
- **Automation**: Scheduled analysis reports
- **Integration**: Connect with external tools and services

### Performance Improvements
- **Virtual Scrolling**: For large analysis lists
- **Background Sync**: Offline support and background updates
- **Caching**: Intelligent caching for frequently accessed data
- **Compression**: Optimized data transfer and storage

## Troubleshooting

### Common Issues
1. **Loading Issues**: Check authentication and network connectivity
2. **Filter Problems**: Verify date formats and range values
3. **Download Failures**: Check browser permissions and popup blockers
4. **Comparison Errors**: Ensure two analyses are selected

### Debug Mode
Enable debug logging by setting `localStorage.debug = 'analysis-history'` in browser console.

## Contributing

When contributing to this component:
1. **Follow Mobile-First**: Always design for mobile first
2. **Test Thoroughly**: Include unit tests for new functionality
3. **Document Changes**: Update this documentation for new features
4. **Performance**: Consider performance impact of changes
5. **Accessibility**: Ensure new features are accessible