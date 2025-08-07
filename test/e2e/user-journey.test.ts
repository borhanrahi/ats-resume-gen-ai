import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

describe('End-to-End User Journey Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterEach(async () => {
    await browser.close();
  });

  describe('Free User Journey', () => {
    it('should complete full free tier analysis journey', async () => {
      // Navigate to landing page
      await page.goto('http://localhost:3000');

      // Verify landing page loads
      await expect(page.locator('h1')).toContainText('AI ATS Resume Checker');
      
      // Click on "Analyze Resume" CTA
      await page.click('text=Analyze Your Resume');
      
      // Should navigate to analyze page
      await expect(page).toHaveURL('/analyze');
      
      // Upload a resume file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-resume.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF content for testing')
      });

      // Wait for file to be processed
      await expect(page.locator('text=File uploaded successfully')).toBeVisible();

      // Add job description
      const jobDescriptionTextarea = page.locator('textarea[placeholder*="job description"]');
      await jobDescriptionTextarea.fill(`
        We are looking for a Senior Software Engineer with experience in:
        - JavaScript and TypeScript
        - React and Node.js
        - AWS cloud services
        - Docker and Kubernetes
        - Agile development methodologies
      `);

      // Start analysis
      await page.click('button:has-text("Analyze Resume")');

      // Wait for analysis to complete
      await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });

      // Verify results are displayed
      await expect(page.locator('[data-testid="ats-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="grammar-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();

      // Check recommendations section
      await expect(page.locator('text=Recommendations')).toBeVisible();
      
      // Check missing keywords section
      await expect(page.locator('text=Missing Keywords')).toBeVisible();

      // Test social sharing functionality
      await page.click('button:has-text("Share Results")');
      await expect(page.locator('text=Share on Twitter')).toBeVisible();
      await expect(page.locator('text=Share on LinkedIn')).toBeVisible();

      // Verify usage tracking
      const usageIndicator = page.locator('[data-testid="usage-remaining"]');
      await expect(usageIndicator).toBeVisible();
      await expect(usageIndicator).toContainText('4 analyses remaining today');
    });

    it('should handle usage limit enforcement', async () => {
      // Mock localStorage to simulate user at limit
      await page.addInitScript(() => {
        localStorage.setItem('ats_usage_2024', JSON.stringify({
          date: new Date().toDateString(),
          count: 5
        }));
      });

      await page.goto('http://localhost:3000/analyze');

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-resume.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF content')
      });

      // Try to analyze
      await page.click('button:has-text("Analyze Resume")');

      // Should show upgrade prompt
      await expect(page.locator('text=Daily Limit Reached')).toBeVisible();
      await expect(page.locator('text=Upgrade to Premium')).toBeVisible();

      // Click upgrade button
      await page.click('button:has-text("Upgrade to Premium")');
      
      // Should navigate to pricing page
      await expect(page).toHaveURL('/pricing');
    });

    it('should display error messages for invalid files', async () => {
      await page.goto('http://localhost:3000/analyze');

      // Try to upload invalid file type
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'invalid-file.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is not a resume file')
      });

      // Should show error message
      await expect(page.locator('text=Invalid file type')).toBeVisible();
      await expect(page.locator('text=Please upload a PDF or DOCX file')).toBeVisible();
    });
  });

  describe('Premium User Journey', () => {
    beforeEach(async () => {
      // Mock authentication state for premium user
      await page.addInitScript(() => {
        localStorage.setItem('auth_token', 'mock-premium-token');
        localStorage.setItem('user_subscription', 'premium');
      });
    });

    it('should complete premium user dashboard workflow', async () => {
      await page.goto('http://localhost:3000/dashboard');

      // Verify dashboard loads with premium features
      await expect(page.locator('h1')).toContainText('Dashboard');
      await expect(page.locator('text=Premium Features')).toBeVisible();

      // Check analysis history
      await expect(page.locator('[data-testid="analysis-history"]')).toBeVisible();
      
      // Navigate to resume editor
      await page.click('text=Resume Editor');
      await expect(page).toHaveURL('/editor');

      // Verify editor loads
      await expect(page.locator('[data-testid="resume-editor"]')).toBeVisible();
      await expect(page.locator('text=Drag & Drop Blocks')).toBeVisible();

      // Test template selection
      await page.click('button:has-text("Choose Template")');
      await expect(page.locator('[data-testid="template-selector"]')).toBeVisible();

      // Select a template
      await page.click('[data-testid="template-modern"]');
      await expect(page.locator('text=Template Applied')).toBeVisible();

      // Test AI resume builder
      await page.click('text=AI Resume Builder');
      await expect(page.locator('textarea[placeholder*="job position"]')).toBeVisible();

      // Fill in job position
      await page.fill('textarea[placeholder*="job position"]', 'Senior Full Stack Developer');
      
      // Generate AI content
      await page.click('button:has-text("Generate Content")');
      await expect(page.locator('text=Generating content...')).toBeVisible();
      await expect(page.locator('text=Content generated successfully')).toBeVisible({ timeout: 15000 });
    });

    it('should handle resume export functionality', async () => {
      await page.goto('http://localhost:3000/editor');

      // Wait for editor to load
      await expect(page.locator('[data-testid="resume-editor"]')).toBeVisible();

      // Add some content to the resume
      await page.fill('[data-testid="name-input"]', 'John Doe');
      await page.fill('[data-testid="title-input"]', 'Software Engineer');

      // Test PDF export
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export as PDF")');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('.pdf');

      // Test DOCX export
      const downloadPromise2 = page.waitForEvent('download');
      await page.click('button:has-text("Export as DOCX")');
      const download2 = await downloadPromise2;
      
      expect(download2.suggestedFilename()).toContain('.docx');
    });

    it('should handle unlimited analysis for premium users', async () => {
      await page.goto('http://localhost:3000/analyze');

      // Perform multiple analyses (more than free limit)
      for (let i = 0; i < 7; i++) {
        // Upload file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: `test-resume-${i}.pdf`,
          mimeType: 'application/pdf',
          buffer: Buffer.from(`Mock PDF content ${i}`)
        });

        // Add job description
        await page.fill('textarea[placeholder*="job description"]', `Job description ${i}`);

        // Analyze
        await page.click('button:has-text("Analyze Resume")');
        await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });

        // Clear for next iteration
        await page.click('button:has-text("New Analysis")');
      }

      // Should not show any usage limits
      await expect(page.locator('text=Daily Limit Reached')).not.toBeVisible();
    });
  });

  describe('Authentication Flow', () => {
    it('should handle user registration and login', async () => {
      await page.goto('http://localhost:3000');

      // Click login/signup
      await page.click('text=Sign Up');
      await expect(page).toHaveURL('/auth/signup');

      // Fill registration form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'SecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

      // Submit registration
      await page.click('button:has-text("Create Account")');

      // Should show email verification message
      await expect(page.locator('text=Check your email')).toBeVisible();

      // Navigate to login
      await page.click('text=Already have an account? Sign in');
      await expect(page).toHaveURL('/auth/login');

      // Fill login form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'SecurePassword123!');

      // Submit login
      await page.click('button:has-text("Sign In")');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Welcome back')).toBeVisible();
    });

    it('should handle password reset flow', async () => {
      await page.goto('http://localhost:3000/auth/login');

      // Click forgot password
      await page.click('text=Forgot password?');
      await expect(page).toHaveURL('/auth/reset-password');

      // Enter email
      await page.fill('input[name="email"]', 'test@example.com');
      await page.click('button:has-text("Send Reset Link")');

      // Should show confirmation
      await expect(page.locator('text=Reset link sent')).toBeVisible();
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    });

    it('should work correctly on mobile devices', async () => {
      await page.goto('http://localhost:3000');

      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // Navigate to analyze page
      await page.click('text=Analyze Resume');
      await expect(page).toHaveURL('/analyze');

      // Test mobile file upload
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'mobile-test-resume.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mobile test PDF content')
      });

      // Verify mobile-optimized upload UI
      await expect(page.locator('[data-testid="mobile-upload-progress"]')).toBeVisible();

      // Test mobile job description input
      const jobDescTextarea = page.locator('textarea[placeholder*="job description"]');
      await jobDescTextarea.fill('Mobile test job description');

      // Test mobile analysis button (should be full width)
      const analyzeButton = page.locator('button:has-text("Analyze Resume")');
      await expect(analyzeButton).toHaveCSS('width', '100%');

      // Start analysis
      await analyzeButton.click();

      // Wait for mobile-optimized results
      await expect(page.locator('[data-testid="mobile-results"]')).toBeVisible({ timeout: 30000 });

      // Test mobile results interaction
      await page.click('[data-testid="mobile-score-card"]');
      await expect(page.locator('[data-testid="mobile-score-details"]')).toBeVisible();
    });

    it('should handle mobile touch interactions', async () => {
      await page.goto('http://localhost:3000/analyze');

      // Test touch-friendly file upload area
      const uploadArea = page.locator('[data-testid="upload-area"]');
      await expect(uploadArea).toHaveCSS('min-height', '120px'); // Touch-friendly size

      // Test mobile swipe gestures for results
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'touch-test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Touch test content')
      });

      await page.fill('textarea[placeholder*="job description"]', 'Touch test job');
      await page.click('button:has-text("Analyze Resume")');

      await expect(page.locator('[data-testid="mobile-results"]')).toBeVisible({ timeout: 30000 });

      // Test swipe navigation between result sections
      const resultsContainer = page.locator('[data-testid="results-container"]');
      
      // Simulate swipe left
      await resultsContainer.hover();
      await page.mouse.down();
      await page.mouse.move(-100, 0);
      await page.mouse.up();

      // Should show next section
      await expect(page.locator('[data-testid="recommendations-section"]')).toBeVisible();
    });
  });

  describe('Performance and Accessibility', () => {
    it('should meet performance benchmarks', async () => {
      await page.goto('http://localhost:3000');

      // Measure page load performance
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
        };
      });

      // Assert performance thresholds
      expect(performanceMetrics.loadTime).toBeLessThan(3000); // 3 seconds
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
      expect(performanceMetrics.firstPaint).toBeLessThan(1500); // 1.5 seconds
    });

    it('should be accessible to screen readers', async () => {
      await page.goto('http://localhost:3000');

      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);

      // Check for alt text on images
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }

      // Check for form labels
      const inputs = await page.locator('input, textarea, select').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          await expect(label).toBeVisible();
        }
      }

      // Check for ARIA attributes
      const interactiveElements = await page.locator('button, [role="button"], [role="tab"]').all();
      for (const element of interactiveElements) {
        const ariaLabel = await element.getAttribute('aria-label');
        const text = await element.textContent();
        expect(ariaLabel || text).toBeTruthy();
      }
    });

    it('should handle keyboard navigation', async () => {
      await page.goto('http://localhost:3000');

      // Test tab navigation
      await page.keyboard.press('Tab');
      let focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();

      // Continue tabbing through interactive elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        focusedElement = await page.locator(':focus').first();
        await expect(focusedElement).toBeVisible();
      }

      // Test Enter key activation
      await page.keyboard.press('Enter');
      
      // Should activate the focused element (likely navigate or trigger action)
      await page.waitForTimeout(1000); // Wait for any navigation or action
    });
  });
});