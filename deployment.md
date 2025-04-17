# Deploying ChatFilm to Vercel

This guide provides step-by-step instructions to deploy the ChatFilm application (both frontend and backend) to Vercel using the monorepo setup.

## Prerequisites

* A Vercel account ([Sign up here](https://vercel.com/signup))
* Git repository hosted on GitHub, GitLab, or Bitbucket
* Vercel CLI installed (optional, for local testing): `npm install -g vercel`

## Deployment Steps

1. **Prepare Your Code**
   * Ensure your codebase has the correct structure with `frontend/` and `backend/` directories
   * Make sure you've committed all changes to your repository

2. **Import Project to Vercel**
   * Login to your Vercel dashboard
   * Click "Add New Project"
   * Import your Git repository

3. **Configure Project Settings**
   * Set the framework preset to "Other"
   * Root Directory: leave as default
   * Build Command: `npm run build`
   * Output Directory: leave blank
   * Install Command: `npm install`

4. **Set Environment Variables**
   * Navigate to "Settings" > "Environment Variables"
   * Add `NEXT_PUBLIC_SOCKET_URL` with value `/` (just a forward slash)
   * Add any other environment variables your backend might need

5. **Configure Project Settings (Optional Overrides)**
   * In some cases, you might need to override the settings in the project's "Build & Development Settings" section
   * For Build Command, you might use: `npm run build:frontend && npm run build:backend`
   * For Output Directory, you might use: `frontend/.next`

6. **Deploy**
   * Click "Deploy"
   * Vercel will clone your repository, install dependencies, and build your application
   * Once deployed, Vercel will provide you with a URL

## Troubleshooting Common Issues

1. **404 Errors for Chat Pages**
   * Make sure `vercel.json` has the correct routes configuration
   * Ensure the frontend has the right dynamic routes in the `app/chat/[role]` directory
   * Check that environment variables are set correctly

2. **Socket.IO Connection Issues**
   * Verify the `NEXT_PUBLIC_SOCKET_URL` is set to `/` in Vercel environment variables
   * Make sure `frontend/hooks/use-real-time-chat.ts` is using `process.env.NEXT_PUBLIC_SOCKET_URL`
   * Check that CORS is configured properly in `backend/server.js`

3. **Build Errors**
   * Check Vercel build logs for details
   * Make sure dependencies are correctly specified in each workspace's package.json

## Local Development

1. **Install Dependencies**
   ```
   npm install
   ```

2. **Run Development Servers**
   ```
   npm run dev
   ```
   This will start both frontend and backend servers concurrently

3. **Environment Variables**
   * For local development, use `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001` in frontend/.env.local
   * For production, set `NEXT_PUBLIC_SOCKET_URL=/` in Vercel environment variables

## File Structure

```
chatfilm/
├── frontend/             # Next.js frontend
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks like useRealTimeChat
│   ├── lib/              # Utilities and libraries
│   └── package.json      # Frontend dependencies
├── backend/              # Node.js backend
│   ├── server.js         # Express + Socket.IO server
│   └── package.json      # Backend dependencies
├── package.json          # Root package.json with workspace config
├── vercel.json           # Vercel deployment configuration
└── deployment.md         # This guide
``` 