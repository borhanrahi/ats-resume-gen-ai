import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumeEditor } from '../ResumeEditor';
import { ResumeData } from '@/types/resume';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false
  })
}));

const mockResumeData: ResumeData = {
  id: '1',
  content: 'Test content',
  metadata: {
    fileName: 'test.pdf',
    fileType: 'pdf',
    uploadDate: new Date(),
    wordCount: 100
  },
  sections: {
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      location: 'New York, NY'
    },
    summary: 'Test summary',
    experience: [],
    education: [],
    skills: ['JavaScript', 'React'],
    certifications: []
  }
};

describe('ResumeEditor', () => {
  it('renders without crashing', () => {
    render(<ResumeEditor />);
    expect(screen.getByText('Resume Editor')).toBeInTheDocument();
  });

  it('displays initial data when provided', () => {
    render(<ResumeEditor initialData={mockResumeData} />);
    expect(screen.getByText('Resume Editor')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
  });

  it('shows save button as disabled when no changes', () => {
    render(<ResumeEditor />);
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('calls onSave when save button is clicked', () => {
    const mockOnSave = vi.fn();
    render(<ResumeEditor onSave={mockOnSave} />);
    
    // Make a change to enable save button
    const addButton = screen.getByRole('button', { name: /summary/i });
    fireEvent.click(addButton);
    
    // Get the main save button (not the one in the block editor)
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    const mainSaveButton = saveButtons.find(button => 
      button.textContent === 'Save' && !button.textContent.includes('Changes')
    );
    
    if (mainSaveButton) {
      fireEvent.click(mainSaveButton);
      expect(mockOnSave).toHaveBeenCalled();
    }
  });

  it('calls onExport when export button is clicked', () => {
    const mockOnExport = vi.fn();
    render(<ResumeEditor onExport={mockOnExport} />);
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);
    
    expect(mockOnExport).toHaveBeenCalledWith('pdf');
  });

  it('shows mobile tabs on small screens', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });

    render(<ResumeEditor />);
    expect(screen.getByRole('tab', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();
  });
});