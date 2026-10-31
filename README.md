# EduWallet

EduWallet is a student-focused personal finance app for tracking income and expenses, planning budgets, and understanding spending habits. This repository contains the React frontend; it communicates with the EduWallet API for authentication and financial data.

## Features

- Account registration, login, and password recovery
- Guided onboarding
- Dashboard for an overview of personal finances
- Income sources and income records
- Expense, category, and transaction tracking
- Budget allocations, budget periods, and budget-versus-actual views
- Bank statement uploads and statement insights
- Reports, financial tips, and notifications
- Profile and account settings
- Admin dashboard and tools for managing categories and tips

Authenticated areas require a valid access token. Administrative pages are available to accounts with the admin role.

## Tech stack

- React 19
- React Router 7
- Vite 8
- JavaScript and CSS

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A running EduWallet API for authentication and data-backed features

## Getting started

1. Install the project dependencies:

   ```sh
   npm install
   ```

2. Create a local environment file from the example:

   ```sh
   cp .env.example .env.local
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Set `VITE_API_URL` in `.env.local` to the base URL of the API, including its `/api` path. For example:

   ```dotenv
   VITE_API_URL=http://localhost:5199/api
   ```

   The frontend uses `http://localhost:5199/api` as its development default when this variable is omitted. Production builds require `VITE_API_URL` to be set and to use HTTPS.

4. Start the development server:

   ```sh
   npm run dev
   ```

   Open the local URL printed by Vite in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot module replacement. |
| `npm run build` | Create an optimized production build in `dist/`. Requires a production `VITE_API_URL` using HTTPS. |
| `npm run preview` | Serve the production build locally for a preview. |
| `npm run lint` | Run ESLint across the project. |

For example, configure the production API URL in the shell before building:

```powershell
$env:VITE_API_URL = "https://api.example.com/api"
npm run build
```

```sh
VITE_API_URL=https://api.example.com/api npm run build
```

## Project structure

```text
src/
  components/  Shared layout, route guards, loading, and feedback components
  pages/       Authentication, finance, reporting, and admin screens
  services/    API client, authentication helpers, and feedback scheduling
  assets/      Images and other bundled assets
public/        Static assets served as-is
```

## API configuration

The API base URL is read from the Vite environment variable `VITE_API_URL`. It should be the API root used by the frontend, typically ending in `/api`. The frontend sends authenticated API requests with the access token obtained at login. Configure the backend separately and ensure it is reachable from the browser; the API must allow requests from the frontend origin.

Do not put secrets in `VITE_*` variables: Vite embeds these values into client-side assets.

## Routing

Public pages include the welcome page, login, registration, password recovery, About, and Help. Onboarding and personal finance pages require authentication. Admin routes require an account with the admin role.

## Production deployment

1. Set `VITE_API_URL` to the HTTPS URL of the deployed API.
2. Run `npm run build`.
3. Deploy the contents of `dist/` to a static web host.
4. Configure the host to serve `index.html` for client-side routes, and configure the API to allow the deployed frontend origin.

The app uses browser-based routing, so the static host must support SPA history fallback for routes such as `/dashboard` and `/reports`.
