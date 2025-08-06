'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  Save,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResumeBlock } from '@/types/editor';
import { ContactInfo, Experience, Education, Certification } from '@/types/resume';
import { v4 as uuidv4 } from 'uuid';

interface BlockEditorProps {
  block: ResumeBlock;
  onUpdate: (updates: Partial<ResumeBlock>) => void;
  onClose: () => void;
  className?: string;
}

export function BlockEditor({
  block,
  onUpdate,
  onClose,
  className = ''
}: BlockEditorProps) {
  const [localContent, setLocalContent] = useState(block.content);
  const [localTitle, setLocalTitle] = useState(block.title);

  const handleSave = useCallback(() => {
    onUpdate({
      title: localTitle,
      content: localContent,
      isEditing: false
    });
  }, [localTitle, localContent, onUpdate]);

  const handleCancel = useCallback(() => {
    setLocalContent(block.content);
    setLocalTitle(block.title);
    onClose();
  }, [block.content, block.title, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={className}
    >
      <Card className="p-4 md:p-6 border-2 border-blue-200 bg-blue-50/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getBlockIcon(block.type)}
            <h3 className="text-lg font-semibold text-gray-900">
              Edit {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Title editor */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section Title
          </label>
          <Input
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder="Enter section title"
            className="h-12"
          />
        </div>

        {/* Content editor */}
        <div className="mb-6">
          {renderContentEditor(block.type, localContent, setLocalContent)}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="min-h-[44px] order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="min-h-[44px] order-1 sm:order-2"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function getBlockIcon(type: ResumeBlock['type']) {
  const icons = {
    contact: <User className="w-5 h-5 text-blue-600" />,
    summary: <FileText className="w-5 h-5 text-green-600" />,
    experience: <Briefcase className="w-5 h-5 text-purple-600" />,
    education: <GraduationCap className="w-5 h-5 text-orange-600" />,
    skills: <Settings className="w-5 h-5 text-indigo-600" />,
    certifications: <Award className="w-5 h-5 text-yellow-600" />,
    custom: <Plus className="w-5 h-5 text-gray-600" />
  };
  return icons[type];
}

function renderContentEditor(
  type: ResumeBlock['type'], 
  content: any, 
  setContent: (content: any) => void
) {
  switch (type) {
    case 'contact':
      return <ContactEditor content={content} setContent={setContent} />;
    case 'summary':
      return <SummaryEditor content={content} setContent={setContent} />;
    case 'experience':
      return <ExperienceEditor content={content} setContent={setContent} />;
    case 'education':
      return <EducationEditor content={content} setContent={setContent} />;
    case 'skills':
      return <SkillsEditor content={content} setContent={setContent} />;
    case 'certifications':
      return <CertificationsEditor content={content} setContent={setContent} />;
    case 'custom':
      return <CustomEditor content={content} setContent={setContent} />;
    default:
      return null;
  }
}

function ContactEditor({ 
  content, 
  setContent 
}: { 
  content: ContactInfo; 
  setContent: (content: ContactInfo) => void 
}) {
  const updateField = (field: keyof ContactInfo, value: string) => {
    setContent({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <Input
            value={content.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="John Doe"
            className="h-12"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <Input
            type="email"
            value={content.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="john@example.com"
            className="h-12"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone *
          </label>
          <Input
            type="tel"
            value={content.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="h-12"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <Input
            value={content.location || ''}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="City, State"
            className="h-12"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn
          </label>
          <Input
            value={content.linkedin || ''}
            onChange={(e) => updateField('linkedin', e.target.value)}
            placeholder="linkedin.com/in/johndoe"
            className="h-12"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <Input
            value={content.website || ''}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="www.johndoe.com"
            className="h-12"
          />
        </div>
      </div>
    </div>
  );
}

function SummaryEditor({ 
  content, 
  setContent 
}: { 
  content: string; 
  setContent: (content: string) => void 
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Professional Summary
      </label>
      <textarea
        value={content || ''}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a compelling professional summary that highlights your key skills and experience..."
        rows={6}
        className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
      />
      <p className="text-xs text-gray-500 mt-1">
        {(content || '').length} characters
      </p>
    </div>
  );
}

function ExperienceEditor({ 
  content, 
  setContent 
}: { 
  content: Experience[]; 
  setContent: (content: Experience[]) => void 
}) {
  const addExperience = () => {
    const newExp: Experience = {
      id: uuidv4(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      achievements: []
    };
    setContent([...content, newExp]);
  };

  const updateExperience = (index: number, updates: Partial<Experience>) => {
    const updated = [...content];
    updated[index] = { ...updated[index], ...updates };
    setContent(updated);
  };

  const removeExperience = (index: number) => {
    setContent(content.filter((_, i) => i !== index));
  };

  const addAchievement = (expIndex: number) => {
    const updated = [...content];
    updated[expIndex].achievements.push('');
    setContent(updated);
  };

  const updateAchievement = (expIndex: number, achIndex: number, value: string) => {
    const updated = [...content];
    updated[expIndex].achievements[achIndex] = value;
    setContent(updated);
  };

  const removeAchievement = (expIndex: number, achIndex: number) => {
    const updated = [...content];
    updated[expIndex].achievements.splice(achIndex, 1);
    setContent(updated);
  };

  return (
    <div className="space-y-6">
      {content.map((exp, index) => (
        <Card key={exp.id} className="p-4 border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Experience #{index + 1}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeExperience(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] min-w-[44px] p-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position *
              </label>
              <Input
                value={exp.position}
                onChange={(e) => updateExperience(index, { position: e.target.value })}
                placeholder="Software Engineer"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <Input
                value={exp.company}
                onChange={(e) => updateExperience(index, { company: e.target.value })}
                placeholder="Tech Company Inc."
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <Input
                value={exp.startDate}
                onChange={(e) => updateExperience(index, { startDate: e.target.value })}
                placeholder="Jan 2020"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <Input
                value={exp.endDate}
                onChange={(e) => updateExperience(index, { endDate: e.target.value })}
                placeholder="Present"
                className="h-12"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={exp.description}
              onChange={(e) => updateExperience(index, { description: e.target.value })}
              placeholder="Brief description of your role and responsibilities..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Key Achievements
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addAchievement(index)}
                className="min-h-[36px]"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-2">
              {exp.achievements.map((achievement, achIndex) => (
                <div key={achIndex} className="flex gap-2">
                  <Input
                    value={achievement}
                    onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                    placeholder="Describe a key achievement..."
                    className="h-10 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAchievement(index, achIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[40px] min-w-[40px] p-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={addExperience}
        className="w-full min-h-[44px] border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Experience
      </Button>
    </div>
  );
}

function EducationEditor({ 
  content, 
  setContent 
}: { 
  content: Education[]; 
  setContent: (content: Education[]) => void 
}) {
  const addEducation = () => {
    const newEdu: Education = {
      id: uuidv4(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: ''
    };
    setContent([...content, newEdu]);
  };

  const updateEducation = (index: number, updates: Partial<Education>) => {
    const updated = [...content];
    updated[index] = { ...updated[index], ...updates };
    setContent(updated);
  };

  const removeEducation = (index: number) => {
    setContent(content.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {content.map((edu, index) => (
        <Card key={edu.id} className="p-4 border-l-4 border-l-orange-500">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Education #{index + 1}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeEducation(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] min-w-[44px] p-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution *
              </label>
              <Input
                value={edu.institution}
                onChange={(e) => updateEducation(index, { institution: e.target.value })}
                placeholder="University Name"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree *
              </label>
              <Input
                value={edu.degree}
                onChange={(e) => updateEducation(index, { degree: e.target.value })}
                placeholder="Bachelor of Science"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field of Study *
              </label>
              <Input
                value={edu.field}
                onChange={(e) => updateEducation(index, { field: e.target.value })}
                placeholder="Computer Science"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPA
              </label>
              <Input
                value={edu.gpa || ''}
                onChange={(e) => updateEducation(index, { gpa: e.target.value })}
                placeholder="3.8"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <Input
                value={edu.startDate}
                onChange={(e) => updateEducation(index, { startDate: e.target.value })}
                placeholder="Sep 2016"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <Input
                value={edu.endDate}
                onChange={(e) => updateEducation(index, { endDate: e.target.value })}
                placeholder="May 2020"
                className="h-12"
              />
            </div>
          </div>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={addEducation}
        className="w-full min-h-[44px] border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Education
      </Button>
    </div>
  );
}

function SkillsEditor({ 
  content, 
  setContent 
}: { 
  content: string[]; 
  setContent: (content: string[]) => void 
}) {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim()) {
      setContent([...content, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setContent(content.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, value: string) => {
    const updated = [...content];
    updated[index] = value;
    setContent(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add a skill..."
          className="h-12 flex-1"
          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
        />
        <Button
          onClick={addSkill}
          disabled={!newSkill.trim()}
          className="min-h-[48px] px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {content.map((skill, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={skill}
              onChange={(e) => updateSkill(index, e.target.value)}
              className="h-10 flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeSkill(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[40px] min-w-[40px] p-2"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      {content.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No skills added yet. Add your first skill above.
        </p>
      )}
    </div>
  );
}

function CertificationsEditor({ 
  content, 
  setContent 
}: { 
  content: Certification[]; 
  setContent: (content: Certification[]) => void 
}) {
  const addCertification = () => {
    const newCert: Certification = {
      id: uuidv4(),
      name: '',
      issuer: '',
      date: '',
      expiryDate: '',
      credentialId: ''
    };
    setContent([...content, newCert]);
  };

  const updateCertification = (index: number, updates: Partial<Certification>) => {
    const updated = [...content];
    updated[index] = { ...updated[index], ...updates };
    setContent(updated);
  };

  const removeCertification = (index: number) => {
    setContent(content.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {content.map((cert, index) => (
        <Card key={cert.id} className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Certification #{index + 1}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeCertification(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] min-w-[44px] p-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certification Name *
              </label>
              <Input
                value={cert.name}
                onChange={(e) => updateCertification(index, { name: e.target.value })}
                placeholder="AWS Certified Solutions Architect"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issuing Organization *
              </label>
              <Input
                value={cert.issuer}
                onChange={(e) => updateCertification(index, { issuer: e.target.value })}
                placeholder="Amazon Web Services"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date *
              </label>
              <Input
                value={cert.date}
                onChange={(e) => updateCertification(index, { date: e.target.value })}
                placeholder="Jan 2023"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <Input
                value={cert.expiryDate || ''}
                onChange={(e) => updateCertification(index, { expiryDate: e.target.value })}
                placeholder="Jan 2026"
                className="h-12"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credential ID
              </label>
              <Input
                value={cert.credentialId || ''}
                onChange={(e) => updateCertification(index, { credentialId: e.target.value })}
                placeholder="ABC123DEF456"
                className="h-12"
              />
            </div>
          </div>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={addCertification}
        className="w-full min-h-[44px] border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Certification
      </Button>
    </div>
  );
}

function CustomEditor({ 
  content, 
  setContent 
}: { 
  content: any; 
  setContent: (content: any) => void 
}) {
  const handleContentChange = (value: string) => {
    setContent(value);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Custom Content
      </label>
      <textarea
        value={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Enter custom content..."
        rows={8}
        className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-mono"
      />
      <p className="text-xs text-gray-500 mt-1">
        You can enter plain text or JSON data for custom sections.
      </p>
    </div>
  );
}