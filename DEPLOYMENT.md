# Production Deployment Guide: Render & Vercel

This guide provides step-by-step instructions to deploy the HRMS monorepo to production:

- **Database**: MongoDB Atlas
- **Backend API**: Render (Node Web Service)
- **Frontend Application**: Vercel (Next.js)

---

## Step 1: MongoDB Atlas Setup

1. **Sign in to MongoDB Atlas**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Create a Database User**:
   - Navigate to **Security** → **Database Access**.
   - Click **Add New Database User**.
   - Choose **Password** authentication, choose a username (e.g., `hrms_admin`) and a secure password.
   - Assign the user the **Read and write to any database** role.
3. **Configure Network Access**:
   - Navigate to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render's dynamic outbound IP addresses can connect.
   - Click **Confirm**.
4. **Copy the Connection String**:
   - Go to **Database** → **Clusters** → click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the connection string.
   - Append the database name (e.g. `hrms`) before the query parameters:
     ```
     mongodb+srv://<username>:<password>@<cluster-address>.mongodb.net/hrms?retryWrites=true&w=majority
     ```
   > [!IMPORTANT]
   > Ensure you specify a dedicated database name such as `hrms` instead of connecting to the default `test` database.

---

## Step 2: Generate Authentication Secrets

Run this Node command twice in your terminal to generate two cryptographically secure random secrets (at least 32 characters each):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Save these two strings:

1. `JWT_ACCESS_SECRET`
2. `JWT_REFRESH_SECRET`

---

## Step 3: Deploy Backend on Render

1. **Sign in to Render**: Go to [dashboard.render.com](https://dashboard.render.com).
2. **Create Web Service using Blueprint or Web Service**:
   - Click **New +** → **Blueprint** and connect your Git repository (Render detects [`render.yaml`](file:///D:/Hrms/render.yaml) automatically).
   - _Alternatively_, click **New +** → **Web Service** and configure manually:
     - **Name**: `hrms-backend`
     - **Runtime**: `Node`
     - **Build Command**: `npm install && npm run build --workspace backend`
     - **Start Command**: `npm run start --workspace backend`
     - **Health Check Path**: `/api/v1/health`
3. **Configure Environment Variables in Render Dashboard**:
   In the **Environment** tab of your service, fill in the values:
   | Variable             | Value                                 | Notes                                  |
   | :------------------- | :------------------------------------ | :------------------------------------- |
   | `NODE_ENV`           | `production`                          | Enables production security & cookies  |
   | `MONGODB_URI`        | `mongodb+srv://.../hrms?...`          | Atlas connection string from Step 1    |
   | `JWT_ACCESS_SECRET`  | _(string from Step 2)_                | Minimum 32 characters                  |
   | `JWT_REFRESH_SECRET` | _(second string from Step 2)_         | Minimum 32 characters                  |
   | `JWT_ACCESS_EXPIRY`  | `15m`                                 | Token expiry                           |
   | `JWT_REFRESH_EXPIRY` | `7d`                                  | Refresh token lifetime                 |
   | `CLIENT_URL`         | `http://localhost:3000` _(temporary)_ | Update in Step 6 with final Vercel URL |
4. **Deploy & Verify Health**:
   - Click **Deploy Web Service**.
   - Wait for the build and startup to complete.
   - Open your browser or run:
     ```bash
     curl https://your-backend-app.onrender.com/api/v1/health
     ```
   - Expect `{ "success": true, "message": "Server is healthy", "data": { "status": "UP" } }`.

> [!NOTE]
> On Render's free tier, the web service automatically spins down after 15 minutes of inactivity. The first request after a period of idle sleep can take 30 to 60 seconds to respond.

---

## Step 4: Seed Database & Change Initial Passwords

1. Run the database seed script locally pointing to your production MongoDB Atlas cluster:

   ```bash
   MONGO_URI="mongodb+srv://<username>:<password>@<cluster-address>.mongodb.net/hrms?retryWrites=true&w=majority" NODE_ENV=production npm run seed --workspace backend -- --force
   ```

   > [!WARNING]
   > The seed script requires the `--force` flag when `NODE_ENV=production` to prevent accidental deletion or overwriting of production data.

2. **Default Demo Accounts**:
   - **Super Admin**: `superadmin@hrms.local` / `SuperAdmin@12345`
   - **HR Admin**: `priya.hr@hrms.local` / `Password@123`
   - **Manager**: `rajesh.manager@hrms.local` / `Password@123`
   - **Employee**: `anita.dev@hrms.local` / `Password@123`

3. Sign in immediately as Super Admin upon first launch and update the passwords for all standard accounts.

---

## Step 5: Deploy Frontend on Vercel

1. **Sign in to Vercel**: Go to [vercel.com](https://vercel.com).
2. **Import Git Repository**: Click **Add New...** → **Project**, and select your Git repository.
3. **Configure Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and set to `frontend`
   - **Build Command**: Leave as default (`next build`) or `npm run build`
   - **Output Directory**: Leave as default (`.next`)
4. **Set Environment Variables**:
   Under **Environment Variables**, add:
   | Key       | Value                                             | Example                             |
   | :-------- | :------------------------------------------------ | :---------------------------------- |
   | `API_URL` | Your Render web service URL _(no trailing slash)_ | `https://hrms-backend.onrender.com` |
5. **Deploy**:
   - Click **Deploy**.
   - Next.js will build the frontend and configure the `/api/:path*` rewrite to proxy API calls directly to Render, ensuring authentication cookies remain first-party.
   - Note your production Vercel URL (e.g. `https://your-hrms.vercel.app`).

---

## Step 6: Connect Frontend URL on Render

1. Return to [dashboard.render.com](https://dashboard.render.com).
2. Open your `hrms-backend` Web Service.
3. Go to **Environment** tab.
4. Update `CLIENT_URL` to your production Vercel URL (e.g. `https://your-hrms.vercel.app` without a trailing slash).
5. Click **Save Changes** and trigger a **Manual Deploy** → **Deploy latest commit** so the CORS middleware allows requests from the Vercel domain.

---

## Step 7: Post-Deployment Verification Checklist

Verify all critical user paths in production:

- [ ] **Health Check**: Open `https://your-backend.onrender.com/api/v1/health` and verify HTTP 200 `{ success: true }`.
- [ ] **Frontend Load**: Open your Vercel URL `https://your-hrms.vercel.app` and confirm the login page displays properly.
- [ ] **Login & Cookies**: Log in with `superadmin@hrms.local`. Open DevTools → Application → Cookies and verify the `refresh_token` cookie is set with `HttpOnly`, `Secure`, and `SameSite=Lax`.
- [ ] **Session Persistence**: Refresh the browser page (`F5`) and confirm that you remain logged in and your user profile data reloads smoothly.
- [ ] **Dashboard Metrics**: Confirm headcount, today's attendance summary, and leave balance widgets load without error.
- [ ] **Leave Approval Flow**:
  1. Log in as an Employee (`anita.dev@hrms.local`), apply for a leave.
  2. Log in as Manager (`rajesh.manager@hrms.local`) or HR Admin, view the pending leave in the dashboard or notifications, and approve or reject it with an optional note.
  3. Verify the employee receives the resolution notification.
