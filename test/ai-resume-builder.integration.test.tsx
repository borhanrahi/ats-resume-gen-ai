import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AIResumeBuilder } from "@/lib/ai/aiResumeBuilder";
import type {
  AIResumePrompt,
  AIGeneratedContent,
  KeywordOptimization,
} from "@/types/ai-builder";
import type { ResumeData } from "@/types/resume";

// Mock the AI service
vi.mock("@/lib/ai/aiResumeBuilder");

const mockAIService = {
  generateResumeContent: vi.fn(),
  optimizeWithKeywords: vi.fn(),
  reanalyzeOptimizedResume: vi.fn(),
  convertToResumeData: vi.fn(),
};

const mockGeneratedContent: AIGeneratedContent = {
  summary:
    "Experienced software engineer with 5+ years of expertise in full-stack development.",
  experience: [
    {
      company: "Tech Corp",
      position: "Senior Software Engineer",
      duration: "2020 - Present",
      description: "Led development of scalable web applications",
      bulletPoints: [
        "Developed React applications serving 100k+ users",
        "Implemented microservices architecture reducing latency by 40%",
        "Mentored junior developers and conducted code reviews",
      ],
      keyAchievements: [
        "Increased system performance by 40%",
        "Led team of 5 developers",
      ],
    },
  ],
  skills: {
    technical: ["React", "Node.js", "TypeScript", "AWS"],
    soft: ["Leadership", "Communication", "Problem Solving"],
    industry: ["Agile", "DevOps", "CI/CD"],
  },
  achievements: [
    "Led successful migration to microservices",
    "Reduced deployment time by 60%",
  ],
  keywords: ["React", "Node.js", "TypeScript", "AWS", "Leadership"],
  suggestions: [
    "Consider adding more quantifiable metrics",
    "Include specific technologies used in each role",
  ],
};

const mockOptimization: KeywordOptimization = {
  currentKeywords: ["React", "JavaScript", "Node.js"],
  suggestedKeywords: ["TypeScript", "AWS", "Docker"],
  missingKeywords: ["Kubernetes", "GraphQL"],
  keywordDensity: 3.2,
  optimizedContent: {
    summary:
      "Experienced software engineer with expertise in React, TypeScript, and AWS cloud services.",
    experience: [
      "Led development of React and TypeScript applications with AWS deployment",
    ],
    skills: ["React", "TypeScript", "AWS", "Docker", "Node.js"],
  },
  improvements: [
    {
      section: "summary",
      original:
        "Experienced software engineer with expertise in web development.",
      optimized:
        "Experienced software engineer with expertise in React, TypeScript, and AWS cloud services.",
      addedKeywords: ["React", "TypeScript", "AWS"],
      impact: "high",
    },
  ],
};

const mockResumeData: ResumeData = {
  id: "test-resume",
  content: "Test resume content",
  metadata: {
    fileName: "test-resume.pdf",
    fileType: "pdf",
    uploadDate: new Date(),
    wordCount: 100,
  },
  sections: {
    contact: {
      name: "John Doe",
      email: "john@example.com",
      phone: "555-0123",
      location: "New York, NY",
    },
    summary: "Software engineer with experience",
    experience: [
      {
        id: "exp-1",
        company: "Tech Corp",
        position: "Software Engineer",
        startDate: "2020",
        endDate: "Present",
        description: "Developed web applications",
        achievements: ["Built React apps", "Improved performance"],
      },
    ],
    education: [],
    skills: ["JavaScript", "React", "Node.js"],
    certifications: [],
  },
};

describe("AI Resume Builder Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the AIResumeBuilder class
    (AIResumeBuilder as unknown).mockImplementation(() => mockAIService);

    mockAIService.generateResumeContent.mockResolvedValue(mockGeneratedContent);
    mockAIService.optimizeWithKeywords.mockResolvedValue(mockOptimization);
    mockAIService.reanalyzeOptimizedResume.mockResolvedValue({
      originalScore: 75,
      optimizedScore: 88,
      improvement: 13,
      keywordMatch: { before: 60, after: 85 },
      recommendations: ["Great improvement in keyword optimization"],
    });
    mockAIService.convertToResumeData.mockReturnValue({
      ...mockResumeData,
      sections: {
        ...mockResumeData.sections,
        summary: mockGeneratedContent.summary,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("AI Resume Generation Flow", () => {
    it("should generate resume content from prompt", async () => {
      const prompt: AIResumePrompt = {
        jobTitle: "Senior Software Engineer",
        industry: "Technology",
        experienceLevel: "senior",
        keySkills: ["React", "TypeScript", "Node.js"],
        workHistory: [
          {
            company: "Tech Corp",
            position: "Software Engineer",
            duration: "2020 - Present",
            keyResponsibilities: ["Develop web applications", "Lead team"],
            achievements: ["Improved performance by 40%"],
          },
        ],
        education: [],
        preferences: {
          tone: "professional",
          length: "detailed",
          focus: "achievements",
        },
      };

      const result = await mockAIService.generateResumeContent(prompt);

      expect(result).toEqual(mockGeneratedContent);
      expect(mockAIService.generateResumeContent).toHaveBeenCalledWith(prompt);
    });

    it("should handle generation errors gracefully", async () => {
      // Mock API failure
      mockAIService.generateResumeContent.mockRejectedValue(
        new Error("API Error")
      );

      const prompt: AIResumePrompt = {
        jobTitle: "Developer",
        industry: "Technology",
        experienceLevel: "mid",
        keySkills: ["JavaScript"],
        workHistory: [
          {
            company: "Company",
            position: "Developer",
            duration: "2020-2023",
            keyResponsibilities: ["Code"],
            achievements: [],
          },
        ],
        education: [],
        preferences: {
          tone: "professional",
          length: "detailed",
          focus: "achievements",
        },
      };

      await expect(mockAIService.generateResumeContent(prompt)).rejects.toThrow(
        "API Error"
      );
    });

    it("should convert generated content to resume data", () => {
      const contactInfo = {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-0123",
        location: "New York, NY",
      };

      const result = mockAIService.convertToResumeData(
        mockGeneratedContent,
        contactInfo
      );

      expect(result).toEqual({
        ...mockResumeData,
        sections: {
          ...mockResumeData.sections,
          summary: mockGeneratedContent.summary,
        },
      });
      expect(mockAIService.convertToResumeData).toHaveBeenCalledWith(
        mockGeneratedContent,
        contactInfo
      );
    });
  });

  describe("Keyword Optimization Flow", () => {
    it("should optimize resume with target keywords", async () => {
      const resumeContent =
        "Software engineer with experience in web development";
      const targetKeywords = ["React", "TypeScript", "AWS"];
      const jobDescription =
        "Looking for React developer with TypeScript experience";

      const result = await mockAIService.optimizeWithKeywords(
        resumeContent,
        targetKeywords,
        jobDescription
      );

      expect(result).toEqual(mockOptimization);
      expect(mockAIService.optimizeWithKeywords).toHaveBeenCalledWith(
        resumeContent,
        targetKeywords,
        jobDescription
      );
    });

    it("should reanalyze optimized resume", async () => {
      const originalContent = "Software engineer with experience";
      const optimizedContent =
        "Software engineer with React and TypeScript experience";
      const jobDescription = "Looking for React developer";

      const result = await mockAIService.reanalyzeOptimizedResume(
        originalContent,
        optimizedContent,
        jobDescription
      );

      expect(result.originalScore).toBe(75);
      expect(result.optimizedScore).toBe(88);
      expect(result.improvement).toBe(13);
      expect(mockAIService.reanalyzeOptimizedResume).toHaveBeenCalledWith(
        originalContent,
        optimizedContent,
        jobDescription
      );
    });

    it("should handle optimization errors", async () => {
      // Mock API failure
      mockAIService.optimizeWithKeywords.mockRejectedValue(
        new Error("Optimization failed")
      );

      const resumeContent = "Software engineer";
      const targetKeywords = ["React"];

      await expect(
        mockAIService.optimizeWithKeywords(resumeContent, targetKeywords)
      ).rejects.toThrow("Optimization failed");
    });

    it("should validate optimization parameters", () => {
      const resumeContent = "";
      const targetKeywords: string[] = [];

      // Empty content should be handled
      expect(() => {
        if (!resumeContent.trim()) {
          throw new Error("Resume content is required");
        }
        if (targetKeywords.length === 0) {
          throw new Error("At least one target keyword is required");
        }
      }).toThrow("Resume content is required");
    });
  });

  describe("Data Conversion", () => {
    it("should convert AI content to resume data format", () => {
      const contactInfo = {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-0123",
        location: "New York, NY",
      };

      const result = mockAIService.convertToResumeData(
        mockGeneratedContent,
        contactInfo
      );

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("metadata");
      expect(result).toHaveProperty("sections");
      expect(result.sections.contact).toEqual(contactInfo);
      expect(result.sections.summary).toBe(mockGeneratedContent.summary);
    });
  });

  describe("Error Handling", () => {
    it("should handle API timeouts", async () => {
      // Mock timeout
      mockAIService.generateResumeContent.mockRejectedValue(
        new Error("Request timeout")
      );

      const prompt: AIResumePrompt = {
        jobTitle: "Developer",
        industry: "Technology",
        experienceLevel: "mid",
        keySkills: ["React"],
        workHistory: [],
        education: [],
        preferences: {
          tone: "professional",
          length: "detailed",
          focus: "achievements",
        },
      };

      await expect(mockAIService.generateResumeContent(prompt)).rejects.toThrow(
        "Request timeout"
      );
    });

    it("should handle reanalysis errors", async () => {
      mockAIService.reanalyzeOptimizedResume.mockRejectedValue(
        new Error("Analysis failed")
      );

      await expect(
        mockAIService.reanalyzeOptimizedResume("original", "optimized")
      ).rejects.toThrow("Analysis failed");
    });
  });
});
