# Production Deployment Guide

This guide covers the complete deployment process for the AI-Powered ATS & Resume App.

## Pre-Deployment Checklist

### 1. Environment Variables

Set the following environment variables in your Vercel dashboard:

#### Required Variables
```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
OPENROUTER_API_KEY=your-openrouter-key
GEMINI_API_KEY=your-gemini-key
```

#### Optional Variables
```bash
NEXT_PUBLIC_ADSENSE_CLIENT_ID=your-adsense-id
WISP_CMS_API_KEY=your-wisp-key
ADMIN_SECRET_KEY=your-admin-secret
ADMIN_JWT_SECRET=your-jwt-secret
ADMIN_ALLOWED_IPS=127.0.0.1,your-office-ip
SECURITY_WEBHOOK_URL=your-slack-webhook
CRITICAL_ERROR_WEBHOOK=your-error-webhook
```

### 2. Run Pre-Deployment Checks

```bash
node scripts/deploy-check.js
```

This script will verify:
- Environment variables
- TypeScript compilation
- Build process
- Critical files
- Security configurations
- Monitoring setup

## Deployment Steps

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 2. Configure Domain and SSL

1. Go to Vercel dashboard
2. Navigate to your project settings
3. Add your custom domain
4. SSL certificates are automatically provisioned

### 3. Set Up Monitoring

#### Health Check Endpoint
- URL: `https://your-domain.com/api/health`
- Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- Configure alerts for downtime

#### Error Monitoring
- Errors are automatically tracked at `/api/errors`
- Set up webhook notifications for critical errors
- Monitor error rates and trends

#### Analytics
- Privacy-compliant analytics at `/api/analytics`
- Track user behavior and conversion rates
- GDPR compliant with opt-out functionality

### 4. Admin Security Configuration

#### IP Restrictions
```bash
# Set allowed IPs for admin access
ADMIN_ALLOWED_IPS=127.0.0.1,203.0.113.0/24,your-office-ip
```

#### Security Features
- Brute force protection
- Rate limiting
- IP blocking
- Security alerts
- Session management

### 5. Performance Optimization

#### Caching
- Static assets cached by Vercel CDN
- API responses cached where appropriate
- Client-side caching for analysis results

#### Bundle Optimization
- Code splitting implemented
- Lazy loading for heavy components
- Tree shaking enabled
- Image optimization

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "checks": {
    "database": true,
    "aiServices": true,
    "storage": true,
    "memory": true,
    "responseTime": 150
  }
}
```

### 2. Core Functionality Tests

#### Free Tier Analysis
1. Visit `/analyze`
2. Upload a test resume
3. Add job description
4. Verify analysis results
5. Check usage tracking

#### Premium Features (if configured)
1. Test user authentication
2. Verify dashboard access
3. Test resume editor
4. Check export functionality

#### Admin Panel
1. Access `/admin` (from allowed IP)
2. Verify authentication
3. Check user management
4. Test system metrics

### 3. Performance Metrics

Monitor these key metrics:
- Page load time < 3 seconds
- API response time < 1 second
- Error rate < 1%
- Uptime > 99.9%

## Monitoring and Alerts

### 1. Uptime Monitoring

Set up external monitoring for:
- Main application (`/`)
- Health check endpoint (`/api/health`)
- Admin panel (`/admin`)

### 2. Error Alerts

Configure webhooks for:
- Critical errors (immediate notification)
- High error rates (> 5%)
- Security incidents
- Performance degradation

### 3. Performance Monitoring

Track:
- Response times
- Memory usage
- API success rates
- User conversion rates

## Security Considerations

### 1. Admin Access
- Restrict admin access to specific IPs
- Use strong authentication
- Enable MFA in production
- Monitor login attempts

### 2. API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- Security headers

### 3. Data Privacy
- GDPR compliant analytics
- No PII in logs
- Secure data transmission
- User data export/deletion

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check TypeScript errors
npx tsc --noEmit

# Check for missing dependencies
npm install

# Clear cache and rebuild
rm -rf .next
npm run build
```

#### Environment Variable Issues
```bash
# Verify variables are set
vercel env ls

# Add missing variables
vercel env add VARIABLE_NAME
```

#### Performance Issues
```bash
# Check bundle size
npm run analyze

# Monitor memory usage
curl https://your-domain.com/api/health
```

### Support Contacts

For deployment issues:
1. Check Vercel deployment logs
2. Review error tracking dashboard
3. Monitor health check endpoint
4. Check security alerts

## Maintenance

### Regular Tasks

#### Daily
- Monitor error rates
- Check uptime status
- Review security alerts

#### Weekly
- Update dependencies
- Review performance metrics
- Check user feedback

#### Monthly
- Security audit
- Performance optimization
- Feature usage analysis
- Cost optimization review

### Updates and Rollbacks

#### Deploying Updates
```bash
# Deploy to preview first
vercel

# Test preview deployment
# Deploy to production
vercel --prod
```

#### Emergency Rollback
```bash
# List deployments
vercel ls

# Rollback to previous version
vercel rollback [deployment-url]
```

## Cost Optimization

### Vercel Usage
- Monitor function execution time
- Optimize API response sizes
- Use edge functions where appropriate
- Implement proper caching

### External Services
- Monitor AI API usage
- Optimize Appwrite database queries
- Use CDN for static assets
- Implement request batching

## Scaling Considerations

### Traffic Growth
- Monitor concurrent users
- Optimize database queries
- Implement caching strategies
- Consider edge computing

### Feature Expansion
- Modular architecture
- API versioning
- Database migrations
- Backward compatibility

This deployment guide ensures a secure, monitored, and optimized production environment for the AI-Powered ATS & Resume App.