'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Edit3, 
  RefreshCw, 
  Download, 
  Eye,
  EyeOff,
  Sparkles,
  Target,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { AIGeneratedContent, AIResumePrompt } from '@/types/ai-builder';
import type { ResumeData } from '@/types/resume';

interface AIResumeReviewProps {
  generatedContent: AIGeneratedContent;
  originalPrompt: AIResumePrompt;
  onAccept: (content: AIGeneratedContent) => void;
  onRegenerate: (prompt: AIResumePrompt) => void;
  onEdit: (resumeData: ResumeData) => void;
  isRegenerating?: boolean;
  className?: string;
}

export function AIResumeReview({
  generatedContent,
  originalPrompt,
  onAccept,
  onRegenerate,
  onEdit,
  isRegenerating = false,
  className = ''
}: AIResumeReviewProps) {
  const [editedContent, setEditedContent] = useState<AIGeneratedContent>(generatedContent);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [activeTab, setActiveTab] = useState<'content' | 'keywords' | 'suggestions'>('content');

  // Mobile-first responsive state
  const [isMobile, setIsMobile] = useState(true);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const updateContent = useCallback((field: keyof AIGeneratedContent, value: any) => {
    setEditedContent(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleAccept = useCallback(() => {
    onAccept(editedContent);
  }, [editedContent, onAccept]);

  const handleEditInEditor = useCallback(() => {
    // Convert AI content to ResumeData format
    const resumeData: ResumeData = {
      id: `ai-generated-${Date.now()}`,
      content: buildResumeText(editedContent),
      metadata: {
        fileName: 'ai-generated-resume.pdf',
        fileType: 'pdf',
        uploadDate: new Date(),
        wordCount: calculateWordCount(editedContent),
      },
      sections: {
        contact: {
          name: '',
          email: '',
          phone: '',
          location: ''
        },
        summary: editedContent.summary,
        experience: editedContent.experience.map((exp, index) => ({
          id: `exp-${index}`,
          company: exp.company,
          position: exp.position,
          startDate: exp.duration.split(' - ')[0] || '',
          endDate: exp.duration.split(' - ')[1] || '',
          description: exp.description,
          achievements: [...exp.bulletPoints, ...exp.keyAchievements],
        })),
        education: [],
        skills: [
          ...editedContent.skills.technical,
          ...editedContent.skills.soft,
          ...editedContent.skills.industry,
        ],
        certifications: [],
      },
    };

    onEdit(resumeData);
  }, [editedContent, onEdit]);

  const renderContentTab = () => (
    <div className="space-y-4">
      {/* Summary Section */}
      <Card>
        <Collapsible 
          open={expandedSections.has('summary')} 
          onOpenChange={() => toggleSection('summary')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Professional Summary
                </CardTitle>
                {expandedSections.has('summary') ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Textarea
                value={editedContent.summary}
                onChange={(e) => updateContent('summary', e.target.value)}
                rows={4}
                className="resize-none"
                placeholder="Professional summary..."
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Experience Section */}
      <Card>
        <Collapsible 
          open={expandedSections.has('experience')} 
          onOpenChange={() => toggleSection('experience')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Work Experience ({editedContent.experience.length})
                </CardTitle>
                {expandedSections.has('experience') ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {editedContent.experience.map((exp, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="font-semibold text-gray-900">
                      {exp.position} at {exp.company}
                    </h4>
                    <span className="text-sm text-gray-500">{exp.duration}</span>
                  </div>
                  
                  <Textarea
                    value={exp.description}
                    onChange={(e) => {
                      const updatedExperience = [...editedContent.experience];
                      updatedExperience[index] = { ...exp, description: e.target.value };
                      updateContent('experience', updatedExperience);
                    }}
                    rows={2}
                    className="resize-none text-sm"
                    placeholder="Role description..."
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Key Achievements:</label>
                    {exp.bulletPoints.map((bullet, bulletIndex) => (
                      <Textarea
                        key={bulletIndex}
                        value={bullet}
                        onChange={(e) => {
                          const updatedExperience = [...editedContent.experience];
                          const updatedBullets = [...exp.bulletPoints];
                          updatedBullets[bulletIndex] = e.target.value;
                          updatedExperience[index] = { ...exp, bulletPoints: updatedBullets };
                          updateContent('experience', updatedExperience);
                        }}
                        rows={2}
                        className="resize-none text-sm"
                        placeholder="Achievement or responsibility..."
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Skills Section */}
      <Card>
        <Collapsible 
          open={expandedSections.has('skills')} 
          onOpenChange={() => toggleSection('skills')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Skills
                </CardTitle>
                {expandedSections.has('skills') ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Technical Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {editedContent.skills.technical.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Soft Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {editedContent.skills.soft.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Industry Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {editedContent.skills.industry.map((skill, index) => (
                    <Badge key={index} variant="default" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );

  const renderKeywordsTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Optimized Keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Included Keywords ({editedContent.keywords.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {editedContent.keywords.map((keyword, index) => (
                  <Badge key={index} className="bg-green-100 text-green-800">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">ATS Optimization</h4>
                  <p className="text-sm text-blue-700">
                    These keywords have been strategically integrated throughout your resume 
                    to improve ATS compatibility and match job requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuggestionsTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {editedContent.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 flex-1">{suggestion}</p>
              </div>
            ))}
          </div>

          {editedContent.achievements.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Notable Achievements</h4>
              <div className="space-y-2">
                {editedContent.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <p className="text-sm text-gray-700">{achievement}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={`max-w-4xl mx-auto p-4 md:p-6 ${className}`}>
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Review Your AI-Generated Resume
        </h2>
        <p className="text-gray-600">
          Review and edit the AI-generated content before finalizing your resume.
        </p>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content" className="min-h-[44px]">
            <Edit3 className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="keywords" className="min-h-[44px]">
            <Target className="w-4 h-4 mr-2" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="min-h-[44px]">
            <Sparkles className="w-4 h-4 mr-2" />
            Suggestions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          {renderContentTab()}
        </TabsContent>

        <TabsContent value="keywords" className="mt-4">
          {renderKeywordsTab()}
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          {renderSuggestionsTab()}
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onRegenerate(originalPrompt)}
            disabled={isRegenerating}
            className="min-h-[44px] flex-1 sm:flex-none"
          >
            {isRegenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleEditInEditor}
            className="min-h-[44px] flex-1 sm:flex-none"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit in Visual Editor
          </Button>
        </div>

        <Button
          onClick={handleAccept}
          className="min-h-[44px] flex-1 sm:flex-none"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Accept & Continue
        </Button>
      </div>
    </div>
  );
}

// Helper functions
function buildResumeText(content: AIGeneratedContent): string {
  let text = '';
  
  // Summary
  text += `PROFESSIONAL SUMMARY\n${content.summary}\n\n`;

  // Experience
  if (content.experience.length > 0) {
    text += 'PROFESSIONAL EXPERIENCE\n';
    content.experience.forEach(exp => {
      text += `${exp.position} | ${exp.company}\n${exp.duration}\n`;
      text += `${exp.description}\n`;
      exp.bulletPoints.forEach(bullet => {
        text += `• ${bullet}\n`;
      });
      text += '\n';
    });
  }

  // Skills
  const allSkills = [
    ...content.skills.technical,
    ...content.skills.soft,
    ...content.skills.industry,
  ];
  if (allSkills.length > 0) {
    text += `SKILLS\n${allSkills.join(', ')}\n\n`;
  }

  return text;
}

function calculateWordCount(content: AIGeneratedContent): number {
  let wordCount = 0;
  
  wordCount += content.summary.split(/\s+/).length;
  
  content.experience.forEach(exp => {
    wordCount += exp.description.split(/\s+/).length;
    exp.bulletPoints.forEach(bullet => {
      wordCount += bullet.split(/\s+/).length;
    });
  });

  return wordCount;
}