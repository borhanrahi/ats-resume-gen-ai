#!/usr/bin/env node

/**
 * Pre-deployment check script
 * Validates the application is ready for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting pre-deployment checks...\n');

let hasErrors = false;

// Check 1: Environment variables
console.log('1. Checking environment variables...');
const requiredEnvVars = [
  'NEXT_PUBLIC_APPWRITE_ENDPOINT',
  'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
  'OPENROUTER_API_KEY',
  'GEMINI_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  hasErrors = true;
} else {
  console.log('✅ All required environment variables are set');
}

// Check 2: TypeScript compilation
console.log('\n2. Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.error('❌ TypeScript compilation failed');
  console.error(error.stdout?.toString() || error.message);
  hasErrors = true;
}

// Check 3: Build process
console.log('\n3. Testing build process...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build process successful');
} catch (error) {
  console.error('❌ Build process failed');
  console.error(error.stdout?.toString() || error.message);
  hasErrors = true;
}

// Check 4: Critical files exist
console.log('\n4. Checking critical files...');
const criticalFiles = [
  'package.json',
  'next.config.ts',
  'tailwind.config.ts',
  'vercel.json',
  'app/layout.tsx',
  'app/page.tsx',
  'app/api/health/route.ts'
];

const missingFiles = criticalFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));
if (missingFiles.length > 0) {
  console.error('❌ Missing critical files:', missingFiles.join(', '));
  hasErrors = true;
} else {
  console.log('✅ All critical files present');
}

// Check 5: Package.json scripts
console.log('\n5. Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'start', 'dev', 'lint'];
const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
if (missingScripts.length > 0) {
  console.error('❌ Missing required scripts:', missingScripts.join(', '));
  hasErrors = true;
} else {
  console.log('✅ All required scripts present');
}

// Check 6: Dependencies
console.log('\n6. Checking dependencies...');
try {
  execSync('npm audit --audit-level=high', { stdio: 'pipe' });
  console.log('✅ No high-severity vulnerabilities found');
} catch (error) {
  console.warn('⚠️  High-severity vulnerabilities detected. Run "npm audit fix" to resolve.');
  // Don't fail deployment for audit issues, just warn
}

// Check 7: Vercel configuration
console.log('\n7. Checking Vercel configuration...');
if (fs.existsSync('vercel.json')) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    if (vercelConfig.framework && vercelConfig.buildCommand) {
      console.log('✅ Vercel configuration is valid');
    } else {
      console.warn('⚠️  Vercel configuration may be incomplete');
    }
  } catch (error) {
    console.error('❌ Invalid vercel.json format');
    hasErrors = true;
  }
} else {
  console.warn('⚠️  No vercel.json found - using default Vercel settings');
}

// Check 8: Health check endpoint
console.log('\n8. Testing health check endpoint...');
if (fs.existsSync('app/api/health/route.ts')) {
  console.log('✅ Health check endpoint exists');
} else {
  console.error('❌ Health check endpoint missing');
  hasErrors = true;
}

// Check 9: Security configurations
console.log('\n9. Checking security configurations...');
const securityFiles = [
  'lib/security/adminSecurity.ts',
  'lib/monitoring/errorTracking.ts'
];

const missingSecurityFiles = securityFiles.filter(file => !fs.existsSync(file));
if (missingSecurityFiles.length > 0) {
  console.error('❌ Missing security files:', missingSecurityFiles.join(', '));
  hasErrors = true;
} else {
  console.log('✅ Security configurations present');
}

// Check 10: Monitoring setup
console.log('\n10. Checking monitoring setup...');
const monitoringFiles = [
  'lib/monitoring/healthCheck.ts',
  'lib/monitoring/analytics.ts',
  'app/api/analytics/route.ts',
  'app/api/errors/route.ts'
];

const missingMonitoringFiles = monitoringFiles.filter(file => !fs.existsSync(file));
if (missingMonitoringFiles.length > 0) {
  console.error('❌ Missing monitoring files:', missingMonitoringFiles.join(', '));
  hasErrors = true;
} else {
  console.log('✅ Monitoring setup complete');
}

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ Pre-deployment checks FAILED');
  console.error('Please fix the above issues before deploying to production.');
  process.exit(1);
} else {
  console.log('✅ All pre-deployment checks PASSED');
  console.log('Application is ready for production deployment!');
  
  console.log('\n📋 Deployment Checklist:');
  console.log('1. Set environment variables in Vercel dashboard');
  console.log('2. Configure domain and SSL');
  console.log('3. Set up monitoring alerts');
  console.log('4. Configure admin IP restrictions');
  console.log('5. Test health check endpoint after deployment');
  console.log('6. Monitor error rates and performance');
  
  process.exit(0);
}