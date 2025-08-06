'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  GraduationCap, 
  User, 
  Target, 
  Settings,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { AIResumePrompt, WorkHistoryItem, EducationItem } from '@/types/ai-builder';

interface AIResumePromptProps {
  onSubmit: (prompt: AIResumePrompt) => void;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

type PromptStep = 'basic' | 'experience' | 'education' | 'preferences';

const stepTitles = {
  basic: 'Basic Information',
  experience: 'Work Experience',
  education: 'Education',
  preferences: 'Content Preferences'
};

const stepIcons = {
  basic: User,
  experience: Briefcase,
  education: GraduationCap,
  preferences: Settings
};

export function AIResumePrompt({
  onSubmit,
  onCancel,
  isLoading = false,
  className = ''
}: AIResumePromptProps) {
  const [currentStep, setCurrentStep] = useState<PromptStep>('basic');
  const [prompt, setPrompt] = useState<Partial<AIResumePrompt>>({
    jobTitle: '',
    jobDescription: '',
    industry: '',
    experienceLevel: 'mid',
    targetCompany: '',
    keySkills: [],
    workHistory: [],
    education: [],
    preferences: {
      tone: 'professional',
      length: 'detailed',
      focus: 'achievements'
    }
  });

  const [currentSkill, setCurrentSkill] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const updatePrompt = useCallback((updates: Partial<AIResumePrompt>) => {
    setPrompt(prev => ({ ...prev, ...updates }));
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(updates).forEach(key => {
        delete newErrors[key];
      });
      return newErrors;
    });
  }, []);

  const addSkill = useCallback(() => {
    if (currentSkill.trim() && !prompt.keySkills?.includes(currentSkill.trim())) {
      updatePrompt({
        keySkills: [...(prompt.keySkills || []), currentSkill.trim()]
      });
      setCurrentSkill('');
    }
  }, [currentSkill, prompt.keySkills, updatePrompt]);

  const removeSkill = useCallback((skill: string) => {
    updatePrompt({
      keySkills: prompt.keySkills?.filter(s => s !== skill) || []
    });
  }, [prompt.keySkills, updatePrompt]);

  const addWorkHistory = useCallback(() => {
    const newWork: WorkHistoryItem = {
      company: '',
      position: '',
      duration: '',
      keyResponsibilities: [''],
      achievements: ['']
    };
    updatePrompt({
      workHistory: [...(prompt.workHistory || []), newWork]
    });
  }, [prompt.workHistory, updatePrompt]);

  const updateWorkHistory = useCallback((index: number, updates: Partial<WorkHistoryItem>) => {
    const updatedHistory = [...(prompt.workHistory || [])];
    updatedHistory[index] = { ...updatedHistory[index], ...updates };
    updatePrompt({ workHistory: updatedHistory });
  }, [prompt.workHistory, updatePrompt]);

  const removeWorkHistory = useCallback((index: number) => {
    updatePrompt({
      workHistory: prompt.workHistory?.filter((_, i) => i !== index) || []
    });
  }, [prompt.workHistory, updatePrompt]);

  const addEducation = useCallback(() => {
    const newEducation: EducationItem = {
      institution: '',
      degree: '',
      field: '',
      year: '',
      gpa: '',
      honors: []
    };
    updatePrompt({
      education: [...(prompt.education || []), newEducation]
    });
  }, [prompt.education, updatePrompt]);

  const updateEducation = useCallback((index: number, updates: Partial<EducationItem>) => {
    const updatedEducation = [...(prompt.education || [])];
    updatedEducation[index] = { ...updatedEducation[index], ...updates };
    updatePrompt({ education: updatedEducation });
  }, [prompt.education, updatePrompt]);

  const removeEducation = useCallback((index: number) => {
    updatePrompt({
      education: prompt.education?.filter((_, i) => i !== index) || []
    });
  }, [prompt.education, updatePrompt]);

  const validateStep = useCallback((step: PromptStep): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'basic':
        if (!prompt.jobTitle?.trim()) {
          newErrors.jobTitle = 'Job title is required';
        }
        if (!prompt.industry?.trim()) {
          newErrors.industry = 'Industry is required';
        }
        if (!prompt.keySkills?.length) {
          newErrors.keySkills = 'At least one key skill is required';
        }
        break;
      case 'experience':
        if (!prompt.workHistory?.length) {
          newErrors.workHistory = 'At least one work experience is required';
        } else {
          prompt.workHistory.forEach((work, index) => {
            if (!work.company?.trim()) {
              newErrors[`work-${index}-company`] = 'Company name is required';
            }
            if (!work.position?.trim()) {
              newErrors[`work-${index}-position`] = 'Position is required';
            }
            if (!work.duration?.trim()) {
              newErrors[`work-${index}-duration`] = 'Duration is required';
            }
          });
        }
        break;
      case 'education':
        // Education is optional, but if provided, validate required fields
        prompt.education?.forEach((edu, index) => {
          if (edu.institution || edu.degree || edu.field) {
            if (!edu.institution?.trim()) {
              newErrors[`edu-${index}-institution`] = 'Institution is required';
            }
            if (!edu.degree?.trim()) {
              newErrors[`edu-${index}-degree`] = 'Degree is required';
            }
            if (!edu.field?.trim()) {
              newErrors[`edu-${index}-field`] = 'Field of study is required';
            }
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [prompt]);

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) return;

    const steps: PromptStep[] = ['basic', 'experience', 'education', 'preferences'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    const steps: PromptStep[] = ['basic', 'experience', 'education', 'preferences'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(() => {
    if (!validateStep(currentStep)) return;

    // Final validation
    if (!prompt.jobTitle || !prompt.industry || !prompt.keySkills?.length || !prompt.workHistory?.length) {
      setCurrentStep('basic');
      return;
    }

    onSubmit(prompt as AIResumePrompt);
  }, [currentStep, prompt, validateStep, onSubmit]);

  const renderStepIndicator = () => {
    const steps: PromptStep[] = ['basic', 'experience', 'education', 'preferences'];
    
    return (
      <div className="flex items-center justify-center mb-6 md:mb-8">
        {steps.map((step, index) => {
          const Icon = stepIcons[step];
          const isActive = step === currentStep;
          const isCompleted = steps.indexOf(currentStep) > index;
          
          return (
            <React.Fragment key={step}>
              <div className={`
                flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-colors
                ${isActive 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : isCompleted 
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }
              `}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-8 md:w-12 h-0.5 mx-2 transition-colors
                  ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderBasicStep = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Target Job Title *</Label>
          <Input
            id="jobTitle"
            value={prompt.jobTitle || ''}
            onChange={(e) => updatePrompt({ jobTitle: e.target.value })}
            placeholder="e.g., Senior Software Engineer"
            className={`min-h-[44px] ${errors.jobTitle ? 'border-red-500' : ''}`}
          />
          {errors.jobTitle && (
            <p className="text-sm text-red-600">{errors.jobTitle}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <Select value={prompt.industry || ''} onValueChange={(value) => updatePrompt({ industry: value })}>
            <SelectTrigger className={`min-h-[44px] ${errors.industry ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.industry && (
            <p className="text-sm text-red-600">{errors.industry}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="experienceLevel">Experience Level</Label>
          <Select 
            value={prompt.experienceLevel || 'mid'} 
            onValueChange={(value) => updatePrompt({ experienceLevel: value as any })}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
              <SelectItem value="mid">Mid Level (3-7 years)</SelectItem>
              <SelectItem value="senior">Senior Level (8-15 years)</SelectItem>
              <SelectItem value="executive">Executive (15+ years)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetCompany">Target Company (Optional)</Label>
          <Input
            id="targetCompany"
            value={prompt.targetCompany || ''}
            onChange={(e) => updatePrompt({ targetCompany: e.target.value })}
            placeholder="e.g., Google, Microsoft"
            className="min-h-[44px]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobDescription">Job Description (Optional)</Label>
        <Textarea
          id="jobDescription"
          value={prompt.jobDescription || ''}
          onChange={(e) => updatePrompt({ jobDescription: e.target.value })}
          placeholder="Paste the job description here to get more targeted content..."
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label>Key Skills *</Label>
        <div className="flex gap-2">
          <Input
            value={currentSkill}
            onChange={(e) => setCurrentSkill(e.target.value)}
            placeholder="Add a skill"
            className="min-h-[44px]"
            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
          />
          <Button 
            type="button" 
            onClick={addSkill}
            className="min-h-[44px] px-4"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {errors.keySkills && (
          <p className="text-sm text-red-600">{errors.keySkills}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {prompt.keySkills?.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 hover:text-blue-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExperienceStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Work Experience</h3>
        <Button onClick={addWorkHistory} className="min-h-[44px]">
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {errors.workHistory && (
        <p className="text-sm text-red-600">{errors.workHistory}</p>
      )}

      <div className="space-y-4">
        {prompt.workHistory?.map((work, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Experience #{index + 1}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWorkHistory(index)}
                  className="text-red-600 hover:text-red-700 min-h-[36px]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <Input
                    value={work.company}
                    onChange={(e) => updateWorkHistory(index, { company: e.target.value })}
                    placeholder="Company name"
                    className={`min-h-[44px] ${errors[`work-${index}-company`] ? 'border-red-500' : ''}`}
                  />
                  {errors[`work-${index}-company`] && (
                    <p className="text-sm text-red-600">{errors[`work-${index}-company`]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Position *</Label>
                  <Input
                    value={work.position}
                    onChange={(e) => updateWorkHistory(index, { position: e.target.value })}
                    placeholder="Job title"
                    className={`min-h-[44px] ${errors[`work-${index}-position`] ? 'border-red-500' : ''}`}
                  />
                  {errors[`work-${index}-position`] && (
                    <p className="text-sm text-red-600">{errors[`work-${index}-position`]}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Duration *</Label>
                <Input
                  value={work.duration}
                  onChange={(e) => updateWorkHistory(index, { duration: e.target.value })}
                  placeholder="e.g., Jan 2020 - Present"
                  className={`min-h-[44px] ${errors[`work-${index}-duration`] ? 'border-red-500' : ''}`}
                />
                {errors[`work-${index}-duration`] && (
                  <p className="text-sm text-red-600">{errors[`work-${index}-duration`]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Key Responsibilities</Label>
                <Textarea
                  value={work.keyResponsibilities.join('\n')}
                  onChange={(e) => updateWorkHistory(index, { 
                    keyResponsibilities: e.target.value.split('\n').filter(r => r.trim()) 
                  })}
                  placeholder="List your main responsibilities (one per line)"
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Key Achievements (Optional)</Label>
                <Textarea
                  value={work.achievements?.join('\n') || ''}
                  onChange={(e) => updateWorkHistory(index, { 
                    achievements: e.target.value.split('\n').filter(a => a.trim()) 
                  })}
                  placeholder="List your key achievements (one per line)"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderEducationStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Education</h3>
        <Button onClick={addEducation} className="min-h-[44px]">
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </div>

      <div className="space-y-4">
        {prompt.education?.map((edu, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Education #{index + 1}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:text-red-700 min-h-[36px]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, { institution: e.target.value })}
                    placeholder="University/College name"
                    className={`min-h-[44px] ${errors[`edu-${index}-institution`] ? 'border-red-500' : ''}`}
                  />
                  {errors[`edu-${index}-institution`] && (
                    <p className="text-sm text-red-600">{errors[`edu-${index}-institution`]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, { degree: e.target.value })}
                    placeholder="e.g., Bachelor's, Master's"
                    className={`min-h-[44px] ${errors[`edu-${index}-degree`] ? 'border-red-500' : ''}`}
                  />
                  {errors[`edu-${index}-degree`] && (
                    <p className="text-sm text-red-600">{errors[`edu-${index}-degree`]}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field of Study</Label>
                  <Input
                    value={edu.field}
                    onChange={(e) => updateEducation(index, { field: e.target.value })}
                    placeholder="e.g., Computer Science"
                    className={`min-h-[44px] ${errors[`edu-${index}-field`] ? 'border-red-500' : ''}`}
                  />
                  {errors[`edu-${index}-field`] && (
                    <p className="text-sm text-red-600">{errors[`edu-${index}-field`]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input
                    value={edu.year}
                    onChange={(e) => updateEducation(index, { year: e.target.value })}
                    placeholder="e.g., 2020"
                    className="min-h-[44px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GPA (Optional)</Label>
                  <Input
                    value={edu.gpa || ''}
                    onChange={(e) => updateEducation(index, { gpa: e.target.value })}
                    placeholder="e.g., 3.8/4.0"
                    className="min-h-[44px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Content Preferences</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Writing Tone</Label>
          <Select 
            value={prompt.preferences?.tone || 'professional'} 
            onValueChange={(value) => updatePrompt({ 
              preferences: { ...prompt.preferences!, tone: value as any } 
            })}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Content Length</Label>
          <Select 
            value={prompt.preferences?.length || 'detailed'} 
            onValueChange={(value) => updatePrompt({ 
              preferences: { ...prompt.preferences!, length: value as any } 
            })}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concise">Concise</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
              <SelectItem value="comprehensive">Comprehensive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Primary Focus</Label>
          <Select 
            value={prompt.preferences?.focus || 'achievements'} 
            onValueChange={(value) => updatePrompt({ 
              preferences: { ...prompt.preferences!, focus: value as any } 
            })}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skills">Skills</SelectItem>
              <SelectItem value="achievements">Achievements</SelectItem>
              <SelectItem value="experience">Experience</SelectItem>
              <SelectItem value="education">Education</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">AI Resume Generation</h4>
            <p className="text-sm text-blue-700">
              Our AI will create professional, ATS-optimized content based on your information. 
              You'll be able to review and edit everything before finalizing your resume.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basic':
        return renderBasicStep();
      case 'experience':
        return renderExperienceStep();
      case 'education':
        return renderEducationStep();
      case 'preferences':
        return renderPreferencesStep();
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-4 md:p-6 ${className}`}>
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          AI Resume Builder
        </h2>
        <p className="text-gray-600">
          Let AI create a professional, ATS-optimized resume tailored to your target position.
        </p>
      </div>

      {renderStepIndicator()}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(stepIcons[currentStep], { className: "w-5 h-5" })}
            {stepTitles[currentStep]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-between">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="min-h-[44px] flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          {currentStep !== 'basic' && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep !== 'preferences' ? (
            <Button
              onClick={handleNext}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Resume
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}