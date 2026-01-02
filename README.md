# Bun API Management Dashboard

A high-performance API Management Dashboard built with **Bun**, **Hono**,
**MariaDB**, **Drizzle ORM**, and **Tailwind CSS**.

## Features

- **Authentication**: Secure Login/Logout with JWT and Cookies.
- **Admin Dashboard**:
  - Manage Users (Activate/Deactivate, Reset Password).
  - Global Statistics.
  - Audit Logs for Admin actions.
- **User Dashboard**:
  - Manage API Keys (Create, List, Revoke).
  - Secure API Key generation (Keys shown once, hashed storage).
- **API Security**:
  - API Key Middleware Validation.
  - **Strict Access Control**: If a User is deactivated by Admin, all their API
    Keys are instantly rejected, even if valid.
  - Access Logging.

## Tech Stack

- **Runtime**: Bun 1.x
- **Framework**: Hono
- **Database**: MariaDB
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS (Server-side usage via static file) & Tabler Icons

## Prerequisites

- Bun installed
- MariaDB running

## Setup

1. **Clone & Install**
   ```bash
   bun install
   ```

2. **Setup Environment Variables**

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

**Konfigurasi GitHub OAuth (Opsional):**

1. Buat OAuth App di GitHub Developer Settings.
2. Set **Authorization callback URL** ke
   `http://your-domain.com/auth/github/callback`.
3. Isi `GITHUB_CLIENT_ID` dan `GITHUB_CLIENT_SECRET` di `.env`.

4. **Database Setup** Ensure MariaDB is providing a database (e.g.,
   `api_management`). Update `.env` if necessary:
   ```env
   DB_HOST="localhost"
   DB_USER="root"
   DB_PASSWORD="root"
   DB_NAME="api_management"
   DB_PORT=3306

   HOST="localhost"
   PORT=8080
   ```

5. **Migrations** Push the schema to the database:
   ```bash
   bunx drizzle-kit push
   ```

6. **Seed Admin User** Create the initial admin account (`banghasan@gmail.com` /
   `admin123`):
   ```bash
   bun seed.ts
   ```

7. **Run the App**
   ```bash
   bun --watch src/index.tsx
   ```
   Open [http://localhost:8080](http://localhost:8080)

## Run Scripts

- **Development**: `bun run dev` (Watches for changes)
- **Start**: `bun run start` (Production mode)
- **Database Push**: `bun run db:push`
- **Seed DB**: `bun run seed`

## API Usage

To use the API, include the `X-API-KEY` header:

```bash
curl -H "X-API-KEY: sk_your_key_here" http://localhost:8080/api/v1/resource
```
