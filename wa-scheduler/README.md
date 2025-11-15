# WA Content Scheduler

This is a full-stack web application for managing and scheduling content to be sent to WhatsApp groups. It provides an internal dashboard for administrators to create, categorize, and schedule posts.

## Features

-   **Content Management:** Create and manage a library of content including images, videos, and captions.
-   **Categorization:** Organize content into categories for easy management.
-   **Scheduling:** Schedule content to be sent at a specific time, or on a recurring basis (daily, weekly, monthly).
-   **WhatsApp Integration:** Automatically sends scheduled content to a configured WhatsApp group or number using the WhatsApp Cloud API.
-   **Dashboard:** View upcoming posts, and monitor the status of scheduled jobs.

## Tech Stack

-   **Framework:** Next.js 14+ with App Router
-   **Styling:** Tailwind CSS
-   **ORM:** Prisma
-   **Database:** PostgreSQL
-   **Runtime:** Node.js 18+

## Getting Started

### Prerequisites

-   Node.js 18+
-   PostgreSQL database (e.g., from Supabase or Neon)

### Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-repo/wa-content-scheduler.git
    cd wa-content-scheduler
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Copy the `.env.example` file to a new file named `.env` and fill in the required values.

    ```bash
    cp .env.example .env
    ```

    You will need to provide:
    -   `DATABASE_URL`: Your PostgreSQL connection string.
    -   `WHATSAPP_ACCESS_TOKEN`: Your WhatsApp Cloud API access token.
    -   `WHATSAPP_PHONE_NUMBER_ID`: Your WhatsApp phone number ID.
    -   `WHATSAPP_DEFAULT_DESTINATION_IDENTIFIER`: The default WhatsApp group or number to send to.

4.  **Run database migrations:**

    This will create the necessary tables in your database based on the schema defined in `prisma/schema.prisma`.

    ```bash
    npx prisma migrate dev
    ```

5.  **Start the development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## Scheduler Setup

The scheduler is responsible for sending out posts at their scheduled time. It can be run in two ways:

### Serverless (Vercel Cron Jobs)

Configure a cron job to call the `/api/scheduler/run` endpoint every 1-5 minutes.

### Traditional Cron

If you are running the application on a traditional server, you can set up a cron job to execute the scheduler script.

```bash
# Example cron job to run every 5 minutes
*/5 * * * * node scripts/scheduler.js
```

## Deploy to Vercel (Free Tier)

This project is optimized for deployment on Vercel's free tier. Follow these steps to deploy your application:

1.  **Push to GitHub:**
    Create a new repository on GitHub and push the project code to it.

2.  **Import Project to Vercel:**
    - Sign up for a Vercel account and navigate to your dashboard.
    - Click "Add New..." -> "Project".
    - Import the GitHub repository you just created. Vercel will automatically detect that it's a Next.js project.

3.  **Set Up a Free PostgreSQL Database:**
    - Go to a provider like [Neon](https://neon.tech/) or [Supabase](https://supabase.com/) and create a new free-tier PostgreSQL database.
    - After creation, find the **PostgreSQL connection URL** (it should look like `postgres://...`).

4.  **Configure Environment Variables:**
    - In your Vercel project settings, go to the "Environment Variables" section.
    - Add all the variables from the `.env.example` file, including:
        - `DATABASE_URL`: Paste the connection URL from your Neon/Supabase database.
        - `WHATSAPP_ACCESS_TOKEN`: Your token from Meta.
        - `WHATSAPP_PHONE_NUMBER_ID`: Your phone number ID.
        - `WHATSAPP_DEFAULT_DESTINATION_IDENTIFIER`: The target group or user ID.
        - `CRON_SECRET` (optional but recommended): A long, random string to secure your scheduler endpoint.

5.  **Deploy:**
    - Trigger a deployment from the Vercel dashboard. The first deployment will build the application and set up the infrastructure.

6.  **Run Production Database Migration:**
    - After the first deployment is successful, you need to run the database migration. The easiest way is to use Vercel's CLI.
    - Install the Vercel CLI: `npm install -g vercel`
    - Link your project: `vercel link`
    - Run the migration in production: `vercel run prisma:migrate`

7.  **Verify Cron Job:**
    - The `vercel.json` file in this repository configures a cron job to run every hour.
    - In your Vercel project settings, navigate to the "Cron Jobs" tab to verify that the job is scheduled and running successfully.

## Notes

-   The WhatsApp access token is configured only via environment variables and is not stored in the database.
-   Media URLs must be public HTTPS URLs that can be accessed by WhatsApp.
-   This application is designed to be free-tier friendly and can be deployed on platforms like Vercel with a database from Supabase or Neon.
