# SmartCoach Production Deployment Guide

This guide provides detailed instructions for deploying SmartCoach Backend to a production environment.

## Table of Contents

1. [Production Readiness Checklist](#production-readiness-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [External Services Configuration](#external-services-configuration)
6. [Deployment Options](#deployment-options)
7. [Post-Deployment](#post-deployment)
8. [Monitoring & Alerting](#monitoring--alerting)
9. [Backup & Recovery](#backup--recovery)
10. [Security Hardening](#security-hardening)

---


## Production Readiness Checklist

### Code & Configuration

- [ ] All environment variables configured for production
- [ ] `NODE_ENV=production` set
- [ ] Debug/development logging disabled
- [ ] Error messages don't expose sensitive information
- [ ] All console.log statements removed or replaced with proper logging
- [ ] TypeScript strict mode enabled
- [ ] No hardcoded secrets or credentials in code

### Security

- [ ] Strong JWT_SECRET (64+ characters, randomly generated)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] CORS configured with specific allowed origins
- [ ] Helmet.js security headers enabled
- [ ] Rate limiting configured appropriately
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection implemented (for web clients)
- [ ] Security audit completed (`npm audit`)

### Database

- [ ] MongoDB Atlas or managed MongoDB service configured
- [ ] Database connection pooling configured
- [ ] Indexes created for frequently queried fields
- [ ] Backup strategy in place
- [ ] Connection retry logic implemented
- [ ] Read replicas configured (if needed)

### External Services

- [ ] Stripe live keys configured
- [ ] Stripe webhook endpoint registered
- [ ] AWS S3 bucket configured with proper permissions
- [ ] Firebase project configured for production
- [ ] SMTP service configured (SendGrid, SES, etc.)
- [ ] AI Service endpoint configured

### Infrastructure

- [ ] SSL/TLS certificates configured
- [ ] Load balancer configured (if multiple instances)
- [ ] Health check endpoints verified
- [ ] Auto-scaling rules defined
- [ ] CDN configured for static assets (optional)

### Monitoring & Logging

- [ ] Application Performance Monitoring (APM) configured
- [ ] Error tracking service configured (Sentry, etc.)
- [ ] Log aggregation configured
- [ ] Alerting rules defined
- [ ] Uptime monitoring configured

### Testing

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load testing completed
- [ ] Security penetration testing completed

---

## Infrastructure Setup

### Recommended Architecture

```
                    ┌─────────────┐
                    │   DNS/CDN   │
                    │ (CloudFlare)│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Load     │
                    │  Balancer   │
                    │(ALB/nginx)  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │  App      │    │  App      │    │  App      │
    │ Instance 1│    │ Instance 2│    │ Instance N│
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───▼───┐            ┌─────▼─────┐          ┌─────▼─────┐
│MongoDB│            │   Redis   │          │  AWS S3   │
│ Atlas │            │  (Cache)  │          │ (Storage) │
└───────┘            └───────────┘          └───────────┘
```

### Minimum Requirements

| Component | Specification |
|-----------|---------------|
| CPU | 2 vCPUs |
| Memory | 4 GB RAM |
| Storage | 20 GB SSD |
| Node.js | 18.x LTS |

### Recommended Production Setup

| Component | Specification |
|-----------|---------------|
| CPU | 4+ vCPUs |
| Memory | 8+ GB RAM |
| Storage | 50+ GB SSD |
| Instances | 2+ (for high availability) |

---

## Environment Configuration

### Production Environment File

Create `.env.production` with these values:

```env
# ===========================================
# APPLICATION
# ===========================================
NODE_ENV=production
PORT=3000

# ===========================================
# DATABASE
# ===========================================
# Use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartcoach?retryWrites=true&w=majority

# ===========================================
# AUTHENTICATION
# ===========================================
# Generate with: openssl rand -base64 64
JWT_SECRET=<64-character-random-string>
JWT_EXPIRES_IN=60m

# ===========================================
# AI SERVICE
# ===========================================
AI_SERVICE_URL=https://ai.yourdomain.com

# ===========================================
# STRIPE (Live Keys)
# ===========================================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=https://app.yourdomain.com/payment/success
STRIPE_CANCEL_URL=https://app.yourdomain.com/payment/cancel

# ===========================================
# AWS S3
# ===========================================
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=smartcoach-prod-uploads

# ===========================================
# FIREBASE
# ===========================================
FIREBASE_CREDENTIALS_PATH=/app/config/firebase-credentials.json

# ===========================================
# EMAIL (Production SMTP)
# ===========================================
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIA...
SMTP_PASS=...
EMAIL_FROM=SmartCoach <noreply@yourdomain.com>

# ===========================================
# CORS (Restrict to your domains)
# ===========================================
CORS_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com

# ===========================================
# RATE LIMITING
# ===========================================
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### Generate Secure Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 64

# Generate random password
openssl rand -base64 32
```

---

## Database Setup

### MongoDB Atlas Configuration

1. **Create MongoDB Atlas Account**
   - Go to https://cloud.mongodb.com
   - Create organization and project

2. **Create Cluster**
   - Choose M10+ tier for production
   - Select region closest to your users
   - Enable auto-scaling

3. **Configure Network Access**
   - Add IP whitelist for your servers
   - Or use VPC peering for enhanced security

4. **Create Database User**
   - Create dedicated user with readWrite role
   - Use strong, randomly generated password

5. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/smartcoach?retryWrites=true&w=majority
   ```

### Index Optimization

The following indexes are already defined in schemas. Verify they exist:

```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ isBanned: 1 })
db.users.createIndex({ subscriptionStatus: 1 })

// CoachProfiles collection
db.coachprofiles.createIndex({ specialties: 1 })
db.coachprofiles.createIndex({ isVerified: 1 })

// Products collection
db.products.createIndex({ name: "text", description: "text" })
db.products.createIndex({ category: 1 })

// Messages collection
db.messages.createIndex({ conversationId: 1, createdAt: -1 })

// Notifications collection
db.notifications.createIndex({ userId: 1, read: 1 })
```

---

## External Services Configuration

### Stripe Setup

1. **Create Stripe Account**
   - Complete business verification
   - Enable live mode

2. **Configure Webhook**
   ```
   Endpoint URL: https://api.yourdomain.com/payments/webhook
   Events to listen:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   ```

3. **Get Live Keys**
   - Dashboard > Developers > API keys
   - Copy `sk_live_...` (secret key)
   - Copy `whsec_...` (webhook secret)

### AWS S3 Setup

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://smartcoach-prod-uploads --region us-east-1
   ```

2. **Configure CORS**
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["https://app.yourdomain.com"],
         "AllowedMethods": ["GET", "PUT", "POST"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

3. **Create IAM User**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::smartcoach-prod-uploads/*"
       }
     ]
   }
   ```

### Firebase Setup

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create new project

2. **Generate Service Account**
   - Project Settings > Service Accounts
   - Generate new private key
   - Download JSON file

3. **Enable Cloud Messaging**
   - Build > Cloud Messaging
   - Configure APNs (for iOS)
   - Get server key

### Email Service Setup (AWS SES)

1. **Verify Domain**
   ```bash
   aws ses verify-domain-identity --domain yourdomain.com
   ```

2. **Create SMTP Credentials**
   - SES > SMTP Settings
   - Create SMTP credentials

3. **Move Out of Sandbox**
   - Request production access
   - Verify sending limits

---

## Deployment Options

### Option 1: Docker + Docker Compose

**docker-compose.production.yml:**
```yaml
version: '3.8'

services:
  api:
    image: smartcoach-backend:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    volumes:
      - ./config/firebase-credentials.json:/app/config/firebase-credentials.json:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

**Deploy:**
```bash
# Build production image
docker build -t smartcoach-backend:latest .

# Deploy
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f api
```

### Option 2: AWS ECS (Fargate)

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name smartcoach-backend
   ```

2. **Push Image**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

   # Tag and push
   docker tag smartcoach-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/smartcoach-backend:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/smartcoach-backend:latest
   ```

3. **Create Task Definition** (task-definition.json)
   ```json
   {
     "family": "smartcoach-api",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "1024",
     "memory": "2048",
     "executionRoleArn": "arn:aws:iam::<account>:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "api",
         "image": "<account>.dkr.ecr.us-east-1.amazonaws.com/smartcoach-backend:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {"name": "NODE_ENV", "value": "production"}
         ],
         "secrets": [
           {
             "name": "MONGODB_URI",
             "valueFrom": "arn:aws:secretsmanager:us-east-1:<account>:secret:smartcoach/mongodb"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/smartcoach-api",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         },
         "healthCheck": {
           "command": ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"],
           "interval": 30,
           "timeout": 5,
           "retries": 3
         }
       }
     ]
   }
   ```

### Option 3: Kubernetes (GKE/EKS)

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smartcoach-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: smartcoach-api
  template:
    metadata:
      labels:
        app: smartcoach-api
    spec:
      containers:
      - name: api
        image: smartcoach-backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: smartcoach-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: smartcoach-api
spec:
  selector:
    app: smartcoach-api
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: smartcoach-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: smartcoach-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: smartcoach-api
            port:
              number: 80
```

### Option 4: PM2 on VPS

```bash
# Install PM2 globally
npm install -g pm2

# Build application
npm run build

# Start with PM2
pm2 start dist/main.js --name smartcoach-api -i max

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'smartcoach-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '1G',
    error_file: '/var/log/smartcoach/error.log',
    out_file: '/var/log/smartcoach/out.log',
    merge_logs: true,
    time: true
  }]
};
```

---

## Post-Deployment

### Verification Checklist

```bash
# 1. Health check
curl https://api.yourdomain.com/

# 2. API documentation loads
curl https://api.yourdomain.com/api

# 3. Test registration (should work)
curl -X POST https://api.yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'

# 4. Test login
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 5. Verify Stripe webhook
# Check Stripe Dashboard > Webhooks for successful deliveries

# 6. Test file upload
# Use the presigned URL endpoint and verify S3 upload
```

### Database Seeding (Optional)

```bash
# Run seed script
npm run seed

# Or manually create admin user
curl -X POST https://api.yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"secure-password","firstName":"Admin","lastName":"User","role":"Admin"}'
```

---

## Monitoring & Alerting

### Application Performance Monitoring

**Sentry Integration:**
```bash
npm install @sentry/node
```

```typescript
// main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Metrics to Monitor

| Metric | Threshold | Alert |
|--------|-----------|-------|
| API Response Time (p95) | > 500ms | Warning |
| API Response Time (p99) | > 1000ms | Critical |
| Error Rate | > 1% | Warning |
| Error Rate | > 5% | Critical |
| CPU Usage | > 80% | Warning |
| Memory Usage | > 85% | Warning |
| Database Connections | > 80% pool | Warning |
| Failed Logins | > 10/min | Warning |

### Logging Configuration

**Winston Logger:**
```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

WinstonModule.forRoot({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    // Add CloudWatch, Logstash, etc.
  ],
});
```

### Uptime Monitoring

Configure external monitoring with:
- Pingdom
- UptimeRobot
- AWS CloudWatch Synthetics
- Better Uptime

---

## Backup & Recovery

### Database Backup

**MongoDB Atlas (Automatic):**
- Continuous backups enabled by default
- Point-in-time recovery up to last 24 hours
- Daily snapshots retained for 30 days

**Manual Backup Script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out=/backups/smartcoach_$DATE
# Upload to S3
aws s3 sync /backups/smartcoach_$DATE s3://smartcoach-backups/$DATE/
```

### Recovery Procedures

1. **Database Recovery**
   ```bash
   # Restore from MongoDB Atlas backup
   # Use Atlas UI or CLI

   # Restore from mongodump
   mongorestore --uri="$MONGODB_URI" /backups/smartcoach_20250118_120000/
   ```

2. **Application Recovery**
   ```bash
   # Rollback to previous Docker image
   docker-compose -f docker-compose.production.yml down
   docker tag smartcoach-backend:previous smartcoach-backend:latest
   docker-compose -f docker-compose.production.yml up -d
   ```

---

## Security Hardening

### Application Level

1. **Enable Helmet.js**
   ```typescript
   // main.ts
   import helmet from 'helmet';
   app.use(helmet());
   ```

2. **Restrict CORS**
   ```typescript
   app.enableCors({
     origin: ['https://app.yourdomain.com'],
     credentials: true,
   });
   ```

3. **Rate Limiting Adjustments**
   ```typescript
   ThrottlerModule.forRoot({
     ttl: 60000,
     limit: 100,
   });
   ```

### Infrastructure Level

1. **Firewall Rules**
   - Allow only HTTPS (443) from internet
   - Allow SSH (22) from specific IPs only
   - Internal services communicate via private network

2. **WAF Configuration**
   - Enable AWS WAF or CloudFlare WAF
   - Block common attack patterns
   - Rate limit by IP

3. **SSL/TLS Configuration**
   - Use TLS 1.2+ only
   - Strong cipher suites
   - Enable HSTS

### Regular Security Tasks

| Task | Frequency |
|------|-----------|
| Dependency audit (`npm audit`) | Weekly |
| Security patches | As released |
| Access key rotation | Quarterly |
| Penetration testing | Annually |
| Access review | Quarterly |

---

## Rollback Procedures

### Quick Rollback

```bash
# Docker Compose
docker-compose -f docker-compose.production.yml down
docker tag smartcoach-backend:previous smartcoach-backend:latest
docker-compose -f docker-compose.production.yml up -d

# Kubernetes
kubectl rollout undo deployment/smartcoach-api

# ECS
aws ecs update-service --cluster prod --service smartcoach --task-definition smartcoach-api:previous-version
```

### Blue-Green Deployment

1. Deploy new version to "green" environment
2. Run smoke tests
3. Switch load balancer to green
4. Keep blue running for quick rollback
5. Decommission blue after validation period

---

## Troubleshooting Production Issues

### High CPU Usage

1. Check for infinite loops or expensive operations
2. Review recent deployments
3. Check database query performance
4. Consider scaling horizontally

### Memory Leaks

1. Enable Node.js heap snapshots
2. Review for unclosed connections
3. Check for growing arrays/caches
4. Restart instances as immediate fix

### Database Connection Issues

1. Check MongoDB Atlas status
2. Verify network connectivity
3. Check connection pool settings
4. Review slow query logs

### WebSocket Connection Drops

1. Verify load balancer sticky sessions
2. Check for Redis adapter (multi-instance)
3. Review timeout settings
4. Check client reconnection logic

---

## Support & Escalation

| Issue Severity | Response Time | Escalation |
|----------------|---------------|------------|
| Critical (service down) | 15 minutes | On-call engineer |
| High (major feature broken) | 1 hour | Development team |
| Medium (minor feature issue) | 4 hours | Support team |
| Low (cosmetic/minor) | 24 hours | Backlog |

---

This guide should be updated as the application evolves and new deployment requirements arise.
