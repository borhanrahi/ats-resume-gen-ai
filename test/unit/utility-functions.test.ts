import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unit tests for utility functions and helper methods

describe('Utility Functions Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('String Utilities', () => {
    it('should sanitize file names correctly', () => {
      // Mock utility function
      const sanitizeFileName = (fileName: string): string => {
        return fileName
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
      };

      expect(sanitizeFileName('John Doe Resume.pdf')).toBe('John_Doe_Resume.pdf');
      expect(sanitizeFileName('Resume (Final) - Copy.docx')).toBe('Resume_Final_Copy.docx');
      expect(sanitizeFileName('___test___')).toBe('test');
      expect(sanitizeFileName('file@#$%name.txt')).toBe('file_name.txt');
    });

    it('should truncate text with ellipsis', () => {
      const truncateText = (text: string, maxLength: number): string => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
      };

      expect(truncateText('Short text', 20)).toBe('Short text');
      expect(truncateText('This is a very long text that needs truncation', 20)).toBe('This is a very lo...');
      expect(truncateText('Exact', 5)).toBe('Exact');
      expect(truncateText('TooLong', 5)).toBe('To...');
    });

    it('should capitalize words correctly', () => {
      const capitalizeWords = (text: string): string => {
        return text.replace(/\b\w/g, char => char.toUpperCase());
      };

      expect(capitalizeWords('john doe')).toBe('John Doe');
      expect(capitalizeWords('software engineer')).toBe('Software Engineer');
      expect(capitalizeWords('full-stack developer')).toBe('Full-Stack Developer');
      expect(capitalizeWords('a')).toBe('A');
      expect(capitalizeWords('')).toBe('');
    });

    it('should extract email addresses from text', () => {
      const extractEmails = (text: string): string[] => {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        return text.match(emailRegex) || [];
      };

      const text1 = 'Contact me at john.doe@example.com or jane@company.org';
      expect(extractEmails(text1)).toEqual(['john.doe@example.com', 'jane@company.org']);

      const text2 = 'No emails here';
      expect(extractEmails(text2)).toEqual([]);

      const text3 = 'Invalid email: not-an-email';
      expect(extractEmails(text3)).toEqual([]);
    });

    it('should extract phone numbers from text', () => {
      const extractPhoneNumbers = (text: string): string[] => {
        const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
        return text.match(phoneRegex) || [];
      };

      const text1 = 'Call me at (555) 123-4567 or +1-555-987-6543';
      const phones = extractPhoneNumbers(text1);
      expect(phones).toHaveLength(2);
      expect(phones[0]).toContain('555');

      const text2 = 'No phone numbers here';
      expect(extractPhoneNumbers(text2)).toEqual([]);
    });
  });

  describe('Date Utilities', () => {
    it('should format dates consistently', () => {
      const formatDate = (date: Date, format: 'short' | 'long' | 'iso' = 'short'): string => {
        switch (format) {
          case 'short':
            return date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
          case 'long':
            return date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          case 'iso':
            return date.toISOString().split('T')[0];
          default:
            return date.toLocaleDateString();
        }
      };

      const testDate = new Date('2024-01-15');
      
      expect(formatDate(testDate, 'short')).toBe('Jan 15, 2024');
      expect(formatDate(testDate, 'long')).toBe('January 15, 2024');
      expect(formatDate(testDate, 'iso')).toBe('2024-01-15');
    });

    it('should calculate date differences', () => {
      const dateDifference = (startDate: Date, endDate: Date, unit: 'days' | 'months' | 'years' = 'days'): number => {
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (unit) {
          case 'days':
            return diffDays;
          case 'months':
            return Math.floor(diffDays / 30);
          case 'years':
            return Math.floor(diffDays / 365);
          default:
            return diffDays;
        }
      };

      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      expect(dateDifference(start, end, 'days')).toBe(30);
      expect(dateDifference(start, end, 'months')).toBe(1);
      
      const yearStart = new Date('2023-01-01');
      const yearEnd = new Date('2024-01-01');
      expect(dateDifference(yearStart, yearEnd, 'years')).toBe(1);
    });

    it('should validate date ranges', () => {
      const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
        return startDate <= endDate;
      };

      const validStart = new Date('2023-01-01');
      const validEnd = new Date('2024-01-01');
      const invalidEnd = new Date('2022-01-01');

      expect(isValidDateRange(validStart, validEnd)).toBe(true);
      expect(isValidDateRange(validStart, invalidEnd)).toBe(false);
      expect(isValidDateRange(validStart, validStart)).toBe(true);
    });
  });

  describe('Array Utilities', () => {
    it('should remove duplicates from arrays', () => {
      const removeDuplicates = <T>(array: T[]): T[] => {
        return [...new Set(array)];
      };

      expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(removeDuplicates([])).toEqual([]);
      expect(removeDuplicates([1])).toEqual([1]);
    });

    it('should chunk arrays into smaller arrays', () => {
      const chunkArray = <T>(array: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      };

      expect(chunkArray([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
      expect(chunkArray([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5]]);
      expect(chunkArray([], 2)).toEqual([]);
      expect(chunkArray([1], 2)).toEqual([[1]]);
    });

    it('should find intersection of arrays', () => {
      const intersection = <T>(arr1: T[], arr2: T[]): T[] => {
        return arr1.filter(item => arr2.includes(item));
      };

      expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
      expect(intersection(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['b', 'c']);
      expect(intersection([1, 2, 3], [4, 5, 6])).toEqual([]);
      expect(intersection([], [1, 2, 3])).toEqual([]);
    });

    it('should sort arrays by multiple criteria', () => {
      interface Person {
        name: string;
        age: number;
        score: number;
      }

      const multiSort = (array: Person[], criteria: Array<{ key: keyof Person; order: 'asc' | 'desc' }>): Person[] => {
        return [...array].sort((a, b) => {
          for (const criterion of criteria) {
            const aVal = a[criterion.key];
            const bVal = b[criterion.key];
            
            if (aVal < bVal) return criterion.order === 'asc' ? -1 : 1;
            if (aVal > bVal) return criterion.order === 'asc' ? 1 : -1;
          }
          return 0;
        });
      };

      const people: Person[] = [
        { name: 'John', age: 30, score: 85 },
        { name: 'Jane', age: 25, score: 90 },
        { name: 'Bob', age: 30, score: 80 }
      ];

      const sorted = multiSort(people, [
        { key: 'age', order: 'desc' },
        { key: 'score', order: 'desc' }
      ]);

      expect(sorted[0].name).toBe('John'); // age 30, score 85
      expect(sorted[1].name).toBe('Bob');  // age 30, score 80
      expect(sorted[2].name).toBe('Jane'); // age 25, score 90
    });
  });

  describe('Object Utilities', () => {
    it('should deep clone objects', () => {
      const deepClone = <T>(obj: T): T => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
        if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
        
        const cloned = {} as T;
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
          }
        }
        return cloned;
      };

      const original = {
        name: 'John',
        details: {
          age: 30,
          skills: ['JavaScript', 'React']
        },
        date: new Date('2024-01-01')
      };

      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.details).not.toBe(original.details);
      expect(cloned.details.skills).not.toBe(original.details.skills);
      expect(cloned.date).not.toBe(original.date);
    });

    it('should merge objects deeply', () => {
      const deepMerge = (target: any, source: any): any => {
        if (source === null || typeof source !== 'object') return source;
        if (target === null || typeof target !== 'object') return source;
        
        const result = { ...target };
        
        for (const key in source) {
          if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
              result[key] = deepMerge(result[key], source[key]);
            } else {
              result[key] = source[key];
            }
          }
        }
        
        return result;
      };

      const target = {
        a: 1,
        b: {
          c: 2,
          d: 3
        }
      };

      const source = {
        b: {
          d: 4,
          e: 5
        },
        f: 6
      };

      const merged = deepMerge(target, source);

      expect(merged).toEqual({
        a: 1,
        b: {
          c: 2,
          d: 4,
          e: 5
        },
        f: 6
      });
    });

    it('should get nested object values safely', () => {
      const getNestedValue = (obj: any, path: string, defaultValue: any = undefined): any => {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
          if (current === null || current === undefined || !(key in current)) {
            return defaultValue;
          }
          current = current[key];
        }
        
        return current;
      };

      const obj = {
        user: {
          profile: {
            name: 'John Doe',
            contact: {
              email: 'john@example.com'
            }
          }
        }
      };

      expect(getNestedValue(obj, 'user.profile.name')).toBe('John Doe');
      expect(getNestedValue(obj, 'user.profile.contact.email')).toBe('john@example.com');
      expect(getNestedValue(obj, 'user.profile.age', 0)).toBe(0);
      expect(getNestedValue(obj, 'nonexistent.path')).toBeUndefined();
    });
  });

  describe('Validation Utilities', () => {
    it('should validate email addresses', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should validate phone numbers', () => {
      const isValidPhone = (phone: string): boolean => {
        const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
        return phoneRegex.test(phone.trim());
      };

      expect(isValidPhone('(555) 123-4567')).toBe(true);
      expect(isValidPhone('555-123-4567')).toBe(true);
      expect(isValidPhone('+1-555-123-4567')).toBe(true);
      expect(isValidPhone('5551234567')).toBe(true);
      expect(isValidPhone('123-456')).toBe(false);
      expect(isValidPhone('invalid-phone')).toBe(false);
    });

    it('should validate URLs', () => {
      const isValidURL = (url: string): boolean => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('https://subdomain.example.com/path')).toBe(true);
      expect(isValidURL('invalid-url')).toBe(false);
      expect(isValidURL('ftp://example.com')).toBe(true);
      expect(isValidURL('')).toBe(false);
    });

    it('should validate required fields', () => {
      const validateRequired = (value: any): boolean => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
      };

      expect(validateRequired('test')).toBe(true);
      expect(validateRequired('  test  ')).toBe(true);
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
      expect(validateRequired([])).toBe(false);
      expect(validateRequired([1, 2, 3])).toBe(true);
      expect(validateRequired(0)).toBe(true);
      expect(validateRequired(false)).toBe(true);
    });
  });

  describe('File Utilities', () => {
    it('should get file extension', () => {
      const getFileExtension = (fileName: string): string => {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot === -1 ? '' : fileName.substring(lastDot + 1).toLowerCase();
      };

      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('resume.docx')).toBe('docx');
      expect(getFileExtension('file.name.txt')).toBe('txt');
      expect(getFileExtension('noextension')).toBe('');
      expect(getFileExtension('.hidden')).toBe('hidden');
    });

    it('should format file size', () => {
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should validate file types', () => {
      const isValidFileType = (fileName: string, allowedTypes: string[]): boolean => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return extension ? allowedTypes.includes(extension) : false;
      };

      const allowedTypes = ['pdf', 'docx', 'doc'];

      expect(isValidFileType('resume.pdf', allowedTypes)).toBe(true);
      expect(isValidFileType('document.docx', allowedTypes)).toBe(true);
      expect(isValidFileType('file.txt', allowedTypes)).toBe(false);
      expect(isValidFileType('noextension', allowedTypes)).toBe(false);
    });

    it('should generate unique file names', () => {
      const generateUniqueFileName = (baseName: string, existingNames: string[]): string => {
        let fileName = baseName;
        let counter = 1;
        
        while (existingNames.includes(fileName)) {
          const extension = baseName.split('.').pop();
          const nameWithoutExt = baseName.substring(0, baseName.lastIndexOf('.'));
          fileName = `${nameWithoutExt}_${counter}.${extension}`;
          counter++;
        }
        
        return fileName;
      };

      const existing = ['resume.pdf', 'resume_1.pdf', 'document.docx'];

      expect(generateUniqueFileName('resume.pdf', existing)).toBe('resume_2.pdf');
      expect(generateUniqueFileName('document.docx', existing)).toBe('document_1.docx');
      expect(generateUniqueFileName('new.pdf', existing)).toBe('new.pdf');
    });
  });

  describe('Performance Utilities', () => {
    it('should debounce function calls', async () => {
      const debounce = <T extends (...args: any[]) => any>(
        func: T,
        delay: number
      ): ((...args: Parameters<T>) => void) => {
        let timeoutId: NodeJS.Timeout;
        
        return (...args: Parameters<T>) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), delay);
        };
      };

      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });

    it('should throttle function calls', async () => {
      const throttle = <T extends (...args: any[]) => any>(
        func: T,
        delay: number
      ): ((...args: Parameters<T>) => void) => {
        let lastCall = 0;
        
        return (...args: Parameters<T>) => {
          const now = Date.now();
          if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
          }
        };
      };

      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call1');

      await new Promise(resolve => setTimeout(resolve, 150));

      throttledFn('call4');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('call4');
    });

    it('should memoize function results', () => {
      const memoize = <T extends (...args: any[]) => any>(func: T): T => {
        const cache = new Map();
        
        return ((...args: Parameters<T>) => {
          const key = JSON.stringify(args);
          
          if (cache.has(key)) {
            return cache.get(key);
          }
          
          const result = func(...args);
          cache.set(key, result);
          return result;
        }) as T;
      };

      const expensiveFunction = vi.fn((n: number) => {
        return n * n;
      });

      const memoizedFunction = memoize(expensiveFunction);

      expect(memoizedFunction(5)).toBe(25);
      expect(memoizedFunction(5)).toBe(25);
      expect(memoizedFunction(3)).toBe(9);

      expect(expensiveFunction).toHaveBeenCalledTimes(2); // Only called for unique inputs
    });
  });
});