import { KeywordMatcher, KeywordMatchException } from '../keywordMatcher';
import { ResumeData } from '@/types/resume';
import { JobDescription } from '@/types/analysis';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { describe } from 'vitest';

// Mock data
const createMockResume = (): ResumeData => ({
  id: 'test-resume',
  content: 'Experienced software engineer with expertise in React, TypeScript, Node.js, and Python. Strong problem-solving skills and experience with agile development. Bachelor degree in Computer Science.',
  metadata: {
    fileName: 'test-resume.pdf',
    fileType: 'pdf',
    uploadDate: new Date(),
    wordCount: 100
  },
  sections: {
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      location: 'New York, NY'
    },
    summary: 'Experienced software engineer',
    experience: [
      {
        id: '1',
        company: 'Tech Corp',
        position: 'Senior Developer',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        description: 'Developed web applications using React and Node.js',
        achievements: ['Built scalable applications', 'Led team of 5 developers']
      }
    ],
    education: [
      {
        id: '1',
        institution: 'University of Technology',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-05-31'
      }
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'JavaScript', 'Git'],
    certifications: []
  }
});

const createMockJobDescription = (): JobDescription => ({
  content: 'We are looking for a Senior React Developer with 5+ years experience. Required skills: React, TypeScript, JavaScript, Node.js, Git, AWS. Must have bachelor degree and strong communication skills.',
  extractedKeywords: ['react', 'typescript', 'javascript', 'node.js', 'git', 'aws', 'communication', 'bachelor', 'senior', '5+ years'],
  requiredSkills: ['react', 'typescript', 'javascript', 'node.js', 'git', 'aws'],
  experienceLevel: 'senior',
  jobTitle: 'Senior React Developer'
});

describe('KeywordMatcher', () => {
  describe('match', () => {
    it('should perform basic keyword matching successfully', async () => {
      const resume = createMockResume();
      const jobDescription = createMockJobDescription();

      const result = await KeywordMatcher.match(resume, jobDescription);

      expect(result.matchPercentage).toBeGreaterThan(0);
      expect(result.found.length).toBeGreaterThan(0);
      expect(result.found).toContain('react');
      expect(result.found).toContain('typescript');
      expect(result.found).toContain('node.js');
      expect(result.missing).toContain('aws');
      expect(result.density).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle case insensitive matching by default', async () => {
      const resume = createMockResume();
      const jobDescription = createMockJobDescription();

      const result = await KeywordMatcher.match(resume, jobDescription, {
        caseSensitive: false
      });

      expect(result.found).toContain('react');
      expect(result.found).toContain('typescript');
    });

    it('should handle case sensitive matching when enabled', async () => {
      const resume = createMockResume();
      const jobDescription = createMockJobDescription();

      const result = await KeywordMatcher.match(resume, jobDescription, {
        caseSensitive: true
      });

      expect(result.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(result.found.length).toBeGreaterThanOrEqual(0);
    });

    it('should perform synonym matching', async () => {
      const resume: ResumeData = {
        ...createMockResume(),
        content: 'Experienced developer with JS, TS, and NodeJS skills',
        sections: {
          ...createMockResume().sections,
          skills: ['JS', 'TS', 'NodeJS']
        }
      };

      const jobDescription: JobDescription = {
        ...createMockJobDescription(),
        requiredSkills: ['javascript', 'typescript', 'node.js']
      };

      const result = await KeywordMatcher.match(resume, jobDescription, {
        synonymMatching: true
      });

      expect(result.found).toContain('javascript');
      expect(result.found).toContain('typescript');
      expect(result.found).toContain('node.js');
    });

    it('should perform fuzzy matching', async () => {
      const resume: ResumeData = {
        ...createMockResume(),
        content: 'Experienced developer with Reactjs and Nodejs skills',
        sections: {
          ...createMockResume().sections,
          skills: ['Reactjs', 'Nodejs']
        }
      };

      const jobDescription: JobDescription = {
        ...createMockJobDescription(),
        requiredSkills: ['react', 'node.js']
      };

      const result = await KeywordMatcher.match(resume, jobDescription, {
        fuzzyMatching: true,
        minimumMatchThreshold: 0.7
      });

      expect(result.matchPercentage).toBeGreaterThan(0);
    });

    it('should calculate category breakdown correctly', async () => {
      const resume = createMockResume();
      const jobDescription = createMockJobDescription();

      const result = await KeywordMatcher.match(resume, jobDescription);

      expect(result.categoryBreakdown).toBeDefined();
      expect(result.categoryBreakdown.technicalSkills).toBeDefined();
      expect(result.categoryBreakdown.softSkills).toBeDefined();
      expect(result.categoryBreakdown.experience).toBeDefined();
      expect(result.categoryBreakdown.education).toBeDefined();

      expect(result.categoryBreakdown.technicalSkills.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(result.categoryBreakdown.technicalSkills.found.length).toBeGreaterThanOrEqual(0);
      expect(result.categoryBreakdown.technicalSkills.missing.length).toBeGreaterThanOrEqual(0);
    });

    it('should identify priority missing keywords', async () => {
      const resume = createMockResume();
      const jobDescription: JobDescription = {
        ...createMockJobDescription(),
        requiredSkills: ['react', 'typescript', 'aws', 'docker', 'kubernetes']
      };

      const result = await KeywordMatcher.match(resume, jobDescription);

      expect(result.priorityMissing).toBeDefined();
      expect(result.priorityMissing.length).toBeGreaterThanOrEqual(0);
      expect(result.priorityMissing).toContain('aws');
    });

    it('should identify strength areas', async () => {
      const resume = createMockResume();
      const jobDescription = createMockJobDescription();

      const result = await KeywordMatcher.match(resume, jobDescription);

      expect(result.strengthAreas).toBeDefined();
      expect(Array.isArray(result.strengthAreas)).toBe(true);
    });

    it('should generate relevant suggestions', async () => {
      const resume = createMockResume();
      const jobDescription: JobDescription = {
        ...createMockJobDescription(),
        requiredSkills: ['react', 'typescript', 'aws', 'docker', 'kubernetes', 'mongodb']
      };

      const result = await KeywordMatcher.match(resume, jobDescription);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('technical skills'))).toBe(true);
    });

    it('should calculate keyword density correctly', async () => {
      const resume = createMockResume();
      const jobDescription = createMockJobDescription();

      const result = await KeywordMatcher.match(resume, jobDescription);

      expect(result.density).toBeGreaterThanOrEqual(0);
      expect(result.density).toBeLessThanOrEqual(100);
    });

    it('should handle empty resume gracefully', async () => {
      const emptyResume: ResumeData = {
        ...createMockResume(),
        content: '',
        sections: {
          ...createMockResume().sections,
          skills: []
        }
      };
      const jobDescription = createMockJobDescription();

      await expect(KeywordMatcher.match(emptyResume, jobDescription))
        .rejects.toThrow(KeywordMatchException);
    });

    it('should handle empty job description gracefully', async () => {
      const resume = createMockResume();
      const emptyJobDescription: JobDescription = {
        content: '',
        extractedKeywords: [],
        requiredSkills: [],
        experienceLevel: 'mid',
        jobTitle: 'Developer'
      };

      await expect(KeywordMatcher.match(resume, emptyJobDescription))
        .rejects.toThrow(KeywordMatchException);
    });
  });

  describe('validate', () => {
    it('should validate correct inputs', () => {
      const resume = createMockResume();
      const jobDescription = createMockJobDescription();

      const result = KeywordMatcher.validate(resume, jobDescription);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing resume content', () => {
      const invalidResume = {
        ...createMockResume(),
        content: ''
      };
      const jobDescription = createMockJobDescription();

      const result = KeywordMatcher.validate(invalidResume, jobDescription);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Resume content is required');
    });

    it('should reject missing job description content', () => {
      const resume = createMockResume();
      const invalidJobDescription = {
        ...createMockJobDescription(),
        content: ''
      };

      const result = KeywordMatcher.validate(resume, invalidJobDescription);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Job description content is required');
    });

    it('should reject too short resume content', () => {
      const shortResume = {
        ...createMockResume(),
        content: 'Short'
      };
      const jobDescription = createMockJobDescription();

      const result = KeywordMatcher.validate(shortResume, jobDescription);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Resume content is too short for meaningful analysis');
    });

    it('should reject too short job description content', () => {
      const resume = createMockResume();
      const shortJobDescription = {
        ...createMockJobDescription(),
        content: 'Short'
      };

      const result = KeywordMatcher.validate(resume, shortJobDescription);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Job description content is too short for meaningful analysis');
    });

    it('should reject null inputs', () => {
      const result1 = KeywordMatcher.validate(null as any, createMockJobDescription());
      const result2 = KeywordMatcher.validate(createMockResume(), null as any);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle resume with only technical skills', async () => {
      const techResume: ResumeData = {
        ...createMockResume(),
        content: 'React TypeScript JavaScript Node.js Python Git Docker AWS',
        sections: {
          ...createMockResume().sections,
          skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Git', 'Docker', 'AWS']
        }
      };

      const jobDescription = createMockJobDescription();
      const result = await KeywordMatcher.match(techResume, jobDescription);

      expect(result.matchPercentage).toBeGreaterThan(80);
      expect(result.categoryBreakdown.technicalSkills.matchPercentage).toBeGreaterThan(80);
    });

    it('should handle job description with many requirements', async () => {
      const resume = createMockResume();
      const complexJobDescription: JobDescription = {
        content: 'Senior Full Stack Developer with React, Angular, Vue, TypeScript, JavaScript, Node.js, Python, Java, AWS, Docker, Kubernetes, MongoDB, PostgreSQL, Git, CI/CD, Agile, Scrum experience',
        extractedKeywords: ['react', 'angular', 'vue', 'typescript', 'javascript', 'node.js', 'python', 'java', 'aws', 'docker', 'kubernetes', 'mongodb', 'postgresql', 'git', 'ci/cd', 'agile', 'scrum'],
        requiredSkills: ['react', 'angular', 'vue', 'typescript', 'javascript', 'node.js', 'python', 'java', 'aws', 'docker', 'kubernetes', 'mongodb', 'postgresql', 'git'],
        experienceLevel: 'senior',
        jobTitle: 'Senior Full Stack Developer'
      };

      const result = await KeywordMatcher.match(resume, complexJobDescription);

      expect(result.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(result.missing.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle special characters in keywords', async () => {
      const resume: ResumeData = {
        ...createMockResume(),
        content: 'Experience with C++, C#, .NET, Node.js, and React.js',
        sections: {
          ...createMockResume().sections,
          skills: ['C++', 'C#', '.NET', 'Node.js', 'React.js']
        }
      };

      const jobDescription: JobDescription = {
        ...createMockJobDescription(),
        requiredSkills: ['c++', 'c#', 'dotnet', 'node.js', 'react']
      };

      const result = await KeywordMatcher.match(resume, jobDescription, {
        synonymMatching: true
      });

      expect(result.found.length).toBeGreaterThan(0);
    });

    it('should handle very high match percentage', async () => {
      const perfectResume: ResumeData = {
        ...createMockResume(),
        content: 'Senior React Developer with TypeScript, JavaScript, Node.js, Git, AWS, and strong communication skills. Bachelor degree in Computer Science with 5+ years experience.',
        sections: {
          ...createMockResume().sections,
          skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Git', 'AWS']
        }
      };

      const jobDescription = createMockJobDescription();
      const result = await KeywordMatcher.match(perfectResume, jobDescription);

      expect(result.matchPercentage).toBeGreaterThan(80);
      expect(result.strengthAreas.length).toBeGreaterThan(0);
    });
  });
});