'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Globe,
  Calendar,
  Building,
  GraduationCap,
  Award
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ResumeBlock, ResumeTemplate } from '@/types/editor';
import { ContactInfo, Experience, Education, Certification } from '@/types/resume';

interface ResumePreviewProps {
  blocks: ResumeBlock[];
  template?: ResumeTemplate | null;
  viewMode?: 'mobile' | 'desktop';
  className?: string;
}

export function ResumePreview({
  blocks,
  template,
  viewMode = 'mobile',
  className = ''
}: ResumePreviewProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  const containerClasses = viewMode === 'mobile' 
    ? 'max-w-full' 
    : 'max-w-2xl mx-auto';

  return (
    <div className={`${containerClasses} ${className}`}>
      <Card className="bg-white shadow-lg overflow-hidden">
        <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          {sortedBlocks.map((block) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="resume-section"
            >
              {renderBlock(block, viewMode)}
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function renderBlock(block: ResumeBlock, viewMode: 'mobile' | 'desktop') {
  switch (block.type) {
    case 'contact':
      return <ContactSection contact={block.content} viewMode={viewMode} />;
    case 'summary':
      return <SummarySection content={block.content} title={block.title} />;
    case 'experience':
      return <ExperienceSection experiences={block.content} title={block.title} viewMode={viewMode} />;
    case 'education':
      return <EducationSection education={block.content} title={block.title} viewMode={viewMode} />;
    case 'skills':
      return <SkillsSection skills={block.content} title={block.title} viewMode={viewMode} />;
    case 'certifications':
      return <CertificationsSection certifications={block.content} title={block.title} viewMode={viewMode} />;
    case 'custom':
      return <CustomSection content={block.content} title={block.title} />;
    default:
      return null;
  }
}

function ContactSection({ contact, viewMode }: { contact: ContactInfo; viewMode: 'mobile' | 'desktop' }) {
  if (!contact.name && !contact.email && !contact.phone) {
    return (
      <div className="text-center py-4 text-gray-400">
        <p className="text-sm">Contact information will appear here</p>
      </div>
    );
  }

  return (
    <div className="text-center border-b pb-4 md:pb-6">
      {contact.name && (
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          {contact.name}
        </h1>
      )}
      
      <div className={`
        flex flex-wrap items-center justify-center gap-2 md:gap-4 text-sm md:text-base text-gray-600
        ${viewMode === 'mobile' ? 'flex-col space-y-1' : ''}
      `}>
        {contact.email && (
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            <span>{contact.email}</span>
          </div>
        )}
        
        {contact.phone && (
          <div className="flex items-center gap-1">
            <Phone className="w-4 h-4" />
            <span>{contact.phone}</span>
          </div>
        )}
        
        {contact.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{contact.location}</span>
          </div>
        )}
        
        {contact.linkedin && (
          <div className="flex items-center gap-1">
            <Linkedin className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{contact.linkedin}</span>
          </div>
        )}
        
        {contact.website && (
          <div className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{contact.website}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SummarySection({ content, title }: { content: string; title: string }) {
  if (!content) {
    return (
      <div className="py-4 text-gray-400 text-center">
        <p className="text-sm">Professional summary will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3 border-b border-gray-200 pb-1">
        {title}
      </h2>
      <p className="text-sm md:text-base text-gray-700 leading-relaxed">
        {content}
      </p>
    </div>
  );
}

function ExperienceSection({ 
  experiences, 
  title, 
  viewMode 
}: { 
  experiences: Experience[]; 
  title: string; 
  viewMode: 'mobile' | 'desktop' 
}) {
  if (!experiences || experiences.length === 0) {
    return (
      <div className="py-4 text-gray-400 text-center">
        <p className="text-sm">Work experience will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 border-b border-gray-200 pb-1">
        {title}
      </h2>
      <div className="space-y-4 md:space-y-6">
        {experiences.map((exp) => (
          <div key={exp.id} className="relative">
            <div className={`
              ${viewMode === 'mobile' ? 'space-y-1' : 'flex justify-between items-start mb-2'}
            `}>
              <div className={viewMode === 'mobile' ? '' : 'flex-1'}>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  {exp.position}
                </h3>
                <div className="flex items-center gap-2 text-sm md:text-base text-gray-600">
                  <Building className="w-4 h-4" />
                  <span>{exp.company}</span>
                </div>
              </div>
              
              <div className={`
                flex items-center gap-1 text-xs md:text-sm text-gray-500
                ${viewMode === 'mobile' ? 'mt-1' : 'flex-shrink-0 ml-4'}
              `}>
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                <span>{exp.startDate} - {exp.endDate}</span>
              </div>
            </div>
            
            {exp.description && (
              <p className="text-sm md:text-base text-gray-700 mb-2 leading-relaxed">
                {exp.description}
              </p>
            )}
            
            {exp.achievements && exp.achievements.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-sm md:text-base text-gray-700">
                {exp.achievements.map((achievement, index) => (
                  <li key={index} className="leading-relaxed">
                    {achievement}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EducationSection({ 
  education, 
  title, 
  viewMode 
}: { 
  education: Education[]; 
  title: string; 
  viewMode: 'mobile' | 'desktop' 
}) {
  if (!education || education.length === 0) {
    return (
      <div className="py-4 text-gray-400 text-center">
        <p className="text-sm">Education will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 border-b border-gray-200 pb-1">
        {title}
      </h2>
      <div className="space-y-3 md:space-y-4">
        {education.map((edu) => (
          <div key={edu.id} className="relative">
            <div className={`
              ${viewMode === 'mobile' ? 'space-y-1' : 'flex justify-between items-start mb-1'}
            `}>
              <div className={viewMode === 'mobile' ? '' : 'flex-1'}>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  {edu.degree} in {edu.field}
                </h3>
                <div className="flex items-center gap-2 text-sm md:text-base text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span>{edu.institution}</span>
                </div>
              </div>
              
              <div className={`
                flex items-center gap-1 text-xs md:text-sm text-gray-500
                ${viewMode === 'mobile' ? 'mt-1' : 'flex-shrink-0 ml-4'}
              `}>
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                <span>{edu.startDate} - {edu.endDate}</span>
              </div>
            </div>
            
            {edu.gpa && (
              <p className="text-sm text-gray-600">
                GPA: {edu.gpa}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsSection({ 
  skills, 
  title, 
  viewMode 
}: { 
  skills: string[]; 
  title: string; 
  viewMode: 'mobile' | 'desktop' 
}) {
  if (!skills || skills.length === 0) {
    return (
      <div className="py-4 text-gray-400 text-center">
        <p className="text-sm">Skills will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 border-b border-gray-200 pb-1">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="px-2 md:px-3 py-1 bg-blue-100 text-blue-800 text-xs md:text-sm rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function CertificationsSection({ 
  certifications, 
  title, 
  viewMode 
}: { 
  certifications: Certification[]; 
  title: string; 
  viewMode: 'mobile' | 'desktop' 
}) {
  if (!certifications || certifications.length === 0) {
    return (
      <div className="py-4 text-gray-400 text-center">
        <p className="text-sm">Certifications will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 border-b border-gray-200 pb-1">
        {title}
      </h2>
      <div className="space-y-3 md:space-y-4">
        {certifications.map((cert) => (
          <div key={cert.id} className="relative">
            <div className={`
              ${viewMode === 'mobile' ? 'space-y-1' : 'flex justify-between items-start mb-1'}
            `}>
              <div className={viewMode === 'mobile' ? '' : 'flex-1'}>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  {cert.name}
                </h3>
                <div className="flex items-center gap-2 text-sm md:text-base text-gray-600">
                  <Award className="w-4 h-4" />
                  <span>{cert.issuer}</span>
                </div>
              </div>
              
              <div className={`
                text-xs md:text-sm text-gray-500
                ${viewMode === 'mobile' ? 'mt-1' : 'flex-shrink-0 ml-4'}
              `}>
                <span>{cert.date}</span>
                {cert.expiryDate && (
                  <span className="block">Expires: {cert.expiryDate}</span>
                )}
              </div>
            </div>
            
            {cert.credentialId && (
              <p className="text-xs md:text-sm text-gray-600">
                Credential ID: {cert.credentialId}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomSection({ content, title }: { content: any; title: string }) {
  if (!content) {
    return (
      <div className="py-4 text-gray-400 text-center">
        <p className="text-sm">Custom content will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3 border-b border-gray-200 pb-1">
        {title}
      </h2>
      <div className="text-sm md:text-base text-gray-700 leading-relaxed">
        {typeof content === 'string' ? (
          <p>{content}</p>
        ) : (
          <pre className="whitespace-pre-wrap font-sans">
            {JSON.stringify(content, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}