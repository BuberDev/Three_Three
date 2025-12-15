# Environment Variables for Payment Integration

## Backend API (.env)
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Database Configuration (if using PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/three_three_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Application Configuration
NODE_ENV=development
PORT=3000
```

## Mobile App (.env.local)
```bash
# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Subscription Plan Price IDs (from Stripe Dashboard)
EXPO_PUBLIC_STRIPE_BASIC_PRICE_ID=price_basic_monthly_id
EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_premium_monthly_id
EXPO_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_premium_yearly_id

# Apple Pay Configuration (iOS only)
EXPO_PUBLIC_APPLE_MERCHANT_ID=merchant.com.yourcompany.threethree

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000

# Google Pay Configuration (Android only)
EXPO_PUBLIC_GOOGLE_MERCHANT_ID=your_google_merchant_id
```

## Production Environment Variables

### Backend API (Production .env)
```bash
# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Production Database
DATABASE_URL=postgresql://prod_user:prod_password@prod_host:5432/three_three_prod

# Security
JWT_SECRET=your_super_secure_production_jwt_secret
JWT_REFRESH_SECRET=your_super_secure_refresh_secret

# Application
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourapp.com
```

### Mobile App (Production .env.local)
```bash
# Stripe Production Keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_publishable_key

# Production Price IDs
EXPO_PUBLIC_STRIPE_BASIC_PRICE_ID=price_production_basic_monthly
EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_production_premium_monthly  
EXPO_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_production_premium_yearly

# Production API
EXPO_PUBLIC_API_URL=https://api.yourapp.com

# Apple Pay Production
EXPO_PUBLIC_APPLE_MERCHANT_ID=merchant.com.yourcompany.threethree

# Google Pay Production
EXPO_PUBLIC_GOOGLE_MERCHANT_ID=your_production_google_merchant_id
```

## Setup Instructions

### 1. Create Stripe Account
1. Go to https://stripe.com and create an account
2. Navigate to Developers > API Keys
3. Copy your test/live publishable and secret keys
4. Set up webhook endpoints in Developers > Webhooks

### 2. Configure Webhook Endpoints
Add these endpoints in your Stripe dashboard:
- `https://your-api-domain.com/api/payments/stripe/webhook` (POST)

Select these webhook events:
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `setup_intent.succeeded`
- `payment_method.attached`

### 3. Create Subscription Products in Stripe
Create these products in your Stripe dashboard:
- Basic Plan (Monthly) - $19.99/month
- Premium Plan (Monthly) - $39.99/month  
- Premium Plan (Yearly) - $383.90/year

Copy the Price IDs and add them to your environment variables.

### 4. Apple Pay Setup (iOS)
1. Register Apple Developer account
2. Create Merchant ID in Apple Developer Console
3. Configure Apple Pay in Stripe Dashboard
4. Add merchant ID to environment variables

### 5. Google Pay Setup (Android)
1. Register Google Pay API in Google Cloud Console
2. Create merchant account
3. Configure Google Pay in Stripe Dashboard
4. Add merchant ID to environment variables

## Security Best Practices

1. **Never commit .env files to git**
   - Add `.env*` to your `.gitignore`
   - Use separate env files for development/staging/production

2. **Use different keys for test/production**
   - Always use test keys during development
   - Switch to live keys only in production

3. **Secure environment variable storage**
   - Use secure services like AWS Secrets Manager, Azure Key Vault, or similar
   - Rotate keys regularly

4. **Webhook security**
   - Always verify webhook signatures
   - Use HTTPS endpoints only
   - Implement proper error handling

## Testing Configuration

For testing, you can use Stripe's test cards:
- `4242424242424242` - Visa (succeeds)
- `4000000000000002` - Visa (declined)
- `4000000000000341` - Visa (attaching fails)

Apple Pay and Google Pay require physical devices or simulators with payment methods configured.