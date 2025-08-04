export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface ResumeData {
  id: string;
  content: string;
  metadata: {
    fileName: string;
    fileType: 'pdf' | 'docx';
    uploadDate: Date;
    wordCount: number;
  };
  sections: {
    contact: ContactInfo;
    summary: string;
    experience: Experience[];
    education: Education[];
    skills: string[];
    certifications: Certification[];
  };
}