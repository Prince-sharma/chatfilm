# Deploying ChatFilm Monorepo to Vercel

This guide provides step-by-step instructions to deploy the ChatFilm application (both frontend and backend) to Vercel using the monorepo setup.

## Prerequisites

*   A Vercel account ([Sign up here](https://vercel.com/signup)).
*   Git repository hosted on GitHub, GitLab, or Bitbucket.
*   Vercel CLI installed (optional, but recommended for local testing): `npm install -g vercel`

## Deployment Steps

1.  **Push Code to Git Provider:**
    *   Ensure your project structure includes the `frontend`, `backend` directories, the root `package.json`, and the `vercel.json` file.
    *   Commit all changes and push them to your remote repository.

2.  **Import Project on Vercel:**
    *   Log in to your Vercel dashboard.
    *   Click on "Add New..." -> "Project".
    *   Import the Git repository containing your ChatFilm project.

3.  **Configure Project Settings:**
    *   Vercel should automatically detect the monorepo structure using the root `package.json` and `vercel.json`.
    *   **Root Directory:** Ensure the Root Directory is set to the base of your repository (it should default to this).
    *   **Framework Preset:** Vercel will likely detect Next.js for the `frontend`. The backend Node.js functions are handled by the `vercel.json` builds configuration.
    *   **Build & Development Settings:** Vercel uses the `vercel.json` file for build configuration. Usually, no overrides are needed here unless you have specific requirements.

4.  **Configure Environment Variables:**
    *   Navigate to your project settings in Vercel -> "Environment Variables".
    *   Add the `NEXT_PUBLIC_SOCKET_URL` variable.
        *   **Value:** Set this to your Vercel deployment URL (e.g., `https://your-app-name.vercel.app`) or just `/`. Using `/` is recommended as `vercel.json` handles the routing.
    *   Add any other necessary backend environment variables (like database connection strings, API keys, etc.) that your `backend/server.js` or `backend/socket-server.js` might require (e.g., `ALLOWED_ORIGIN` if you want to restrict CORS further than the default). Make sure *not* to prefix backend-only variables with `NEXT_PUBLIC_`.

5.  **Deploy:** 
    *   Click the "Deploy" button.
    *   Vercel will clone your repository, install dependencies for both `frontend` and `backend` workspaces, run the build commands defined in `vercel.json`, and deploy your application.

6.  **Verify Deployment:**
    *   Once the deployment is complete, Vercel will provide you with a URL.
    *   Visit the URL to ensure both the frontend (Next.js app) and backend (Socket.IO) are functioning correctly.

## Local Development & Testing

*   **Install Dependencies:** Run `npm install` in the root directory. This will install dependencies for both `frontend` and `backend` workspaces.
*   **Run Locally:** Run `npm run dev` in the root directory. This should start both the Next.js development server and the backend Node.js server (using nodemon if configured).
*   **Test with Vercel CLI:** You can simulate the Vercel deployment locally using `vercel dev` in the root directory. This uses the `vercel.json` configuration.

## Troubleshooting

*   **Build Errors:** Check the Vercel deployment logs for details. Ensure all necessary dependencies are listed in the correct `package.json` files (`frontend` or `backend`).
*   **Socket.IO Connection Issues:** Double-check the `NEXT_PUBLIC_SOCKET_URL` environment variable in Vercel. Ensure CORS is configured correctly in `backend/server.js` (or `socket-server.js`) and potentially the `ALLOWED_ORIGIN` environment variable if used.
*   **Routing Problems:** Verify the `routes` in your `vercel.json` file are correct. 