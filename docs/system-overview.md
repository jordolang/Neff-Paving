# System Overview - Neff Paving

## Architecture Overview

The Neff Paving system is a modern, scalable web application built with a microservices-oriented architecture combining frontend static deployment with backend API services.

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Database      │
│   (Vercel)      │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│  • Vite/JS      │    │  • REST APIs    │    │  • Job Data     │
│  • Static Site  │    │  • Webhooks     │    │  • User Data    │
│  • Progressive  │    │  • Sync Service │    │  • Analytics    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  External APIs  │    │  File Storage   │    │  Monitoring     │
│                 │    │                 │    │                 │
│  • Google Maps  │    │  • Assets       │    │  • Vercel       │
│  • Calendly     │    │  • Gallery      │    │  • Analytics    │
│  • Stripe       │    │  • Documents    │    │  • Error Log    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. Frontend Application

**Technology Stack:**
- **Build Tool:** Vite 7.0.0
- **JavaScript:** ES6+ Modules
- **Styling:** Modern CSS with custom properties
- **Animation:** GSAP, AOS, Animate.css
- **Maps:** Google Maps JavaScript API
- **Analytics:** Vercel Analytics & Speed Insights

**Key Features:**
- Progressive Web App (PWA) capabilities
- Responsive design (mobile-first)
- Interactive photo galleries
- Real-time area calculation tools
- Estimate request forms
- Video showcase integration

### 2. API Layer (Conceptual/Future Implementation)

**Planned Technology Stack:**
- **Runtime:** Node.js 18+
- **Database:** PostgreSQL
- **ORM:** Placeholder for Entity Framework or Sequelize
- **Authentication:** JWT tokens
- **File Upload:** Multer/Sharp for image processing

**Planned API Endpoints:**
```
/api/v1/
├── auth/           # Authentication
├── jobs/           # Job management
├── estimates/      # Estimate requests
├── gallery/        # Image management
├── scheduling/     # Calendly integration
├── payments/       # Stripe integration
└── webhooks/       # External service hooks
```

### 3. Database Schema (PostgreSQL)

**Core Tables:**
- `users` - User management and authentication
- `job_schedules` - Job scheduling with Calendly integration
- `blog_posts` - Content management
- `analytics_events` - User interaction tracking
- `messages` - Contact form submissions
- `schedule_changes` - Audit trail for scheduling

### 4. External Service Integrations

**Google Maps API:**
- Interactive area drawing
- Address geocoding
- Distance calculations
- Satellite imagery

**Calendly Integration:**
- Automated scheduling
- Webhook notifications
- Event management
- Service-specific booking

**Stripe Payment Processing:**
- Secure payment handling
- Subscription management
- Webhook processing

## Current Implementation Status

### ✅ Completed Components

1. **Frontend Website**
   - Fully responsive design
   - Interactive gallery with lightbox
   - Video showcase with multiple players
   - Area calculation tools
   - Estimate request forms
   - Contact forms
   - SEO optimization
   - Performance optimization

2. **Build & Deployment System**
   - Vite-based build process
   - Multi-platform deployment (Vercel/GitHub Pages)
   - Asset optimization and compression
   - Cache management
   - Environment-specific configurations

3. **Service Architecture (Framework)**
   - Modular service structure
   - Sync service framework
   - Error handling patterns
   - Webhook handling structure

### 🏗️ Placeholder/Framework Components

1. **Backend API Services**
   - Service classes defined but not connected to database
   - Database schema designed but not implemented
   - Authentication framework outlined

2. **Database Integration**
   - Schema files present but not deployed
   - Migration scripts prepared
   - Connection configuration templated

3. **External Service Integration**
   - API configuration prepared
   - Service classes structured
   - Environment variables defined

## File Structure

```
neff-paving/
├── src/                          # Source code
│   ├── components/              # UI components
│   ├── services/                # Business logic services  
│   ├── config/                  # Configuration files
│   ├── styles/                  # Stylesheets
│   └── main.js                  # Application entry point
├── assets/                      # Static assets
│   ├── gallery/                 # Project photos
│   ├── images/                  # UI images
│   ├── videos/                  # Showcase videos
│   └── fonts/                   # Typography
├── scripts/                     # Build and utility scripts
├── docs/                        # Documentation
├── dist/                        # Build output
└── public/                      # Public assets
```

## Technology Decisions

### Frontend Choices

**Vite over Webpack:**
- Faster development builds
- Native ES modules support
- Simpler configuration
- Better developer experience

**Vanilla JavaScript over Framework:**
- Smaller bundle size
- Direct DOM control
- Easier maintenance
- No framework lock-in
- Better performance for static content

**CSS over CSS-in-JS:**
- Better caching
- Simpler debugging
- Framework independence
- Better performance

### Deployment Strategy

**Vercel for Frontend:**
- Automatic deployments
- Global CDN
- Serverless functions capability
- Built-in analytics
- Excellent performance

**PostgreSQL for Database:**
- ACID compliance
- JSON/JSONB support
- Excellent performance
- Robust ecosystem
- UUID primary key support

## Performance Characteristics

### Frontend Performance

**Build Optimization:**
- Code splitting and lazy loading
- Asset compression and minification
- Modern browser targeting (ES2020+)
- Critical resource preloading
- Service worker for caching

**Runtime Performance:**
- Optimized image formats (WebP)
- Efficient animation libraries
- Minimal JavaScript bundle
- Progressive enhancement
- Resource hints and preloading

### Scalability Considerations

**Frontend Scalability:**
- Static site generation
- CDN distribution
- Efficient caching strategies
- Optimized asset delivery

**Backend Scalability (Future):**
- Microservices architecture
- Database connection pooling
- Horizontal scaling capability
- Caching layers
- Load balancing ready

## Security Architecture

### Frontend Security

- Content Security Policy (CSP)
- XSS protection headers
- Secure cookie handling
- HTTPS enforcement
- Input validation and sanitization

### Backend Security (Planned)

- JWT authentication
- Role-based access control
- API rate limiting
- SQL injection prevention
- Secure environment variable handling

## Monitoring and Analytics

### Current Monitoring

- Vercel Analytics for usage tracking
- Speed Insights for performance monitoring
- Error tracking through Vercel
- Build process monitoring

### Planned Monitoring

- Application performance monitoring
- Database query performance
- API endpoint monitoring
- User behavior analytics
- Error reporting and alerting

## Development Workflow

### Local Development

1. Clone repository
2. Install dependencies (`npm install`)
3. Start development server (`npm run dev`)
4. Make changes with hot reload
5. Test build (`npm run build`)

### Deployment Workflow

1. Code changes pushed to repository
2. Automatic build triggered on Vercel
3. Build process runs optimization scripts
4. Static assets deployed to CDN
5. Environment-specific configurations applied

## Integration Points

### Current Integrations

- Google Maps JavaScript API
- Vercel deployment platform
- GitHub version control
- NPM package registry

### Planned Integrations

- Calendly API for scheduling
- Stripe API for payments
- PostgreSQL database
- Email service provider
- SMS service provider
- File storage service

This architecture provides a solid foundation for a scalable, maintainable paving company website with room for future enhancements and backend service integration.
