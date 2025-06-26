# Incantations Voice AI - Production Environment Variables

# Update your frontend .env file:
VITE_API_URL=https://api.incantations.witchcraftery.io
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Backend environment variables (copy to server):
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://incantations_user:secure_password@localhost:5432/incantations_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=generate_a_super_secure_random_string_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://incantations.witchcraftery.io/auth/callback
FRONTEND_URL=https://incantations.witchcraftery.io
