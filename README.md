# Recipe Vault

A recipe management app where you can collect recipes from anywhere on the web, organize them, and actually use them in your kitchen. Built with Next.js, TypeScript, and PostgreSQL.

[Try it →](https://recipe-vault-pied.vercel.app/)

## What it does

**Recipe Collection**
- Import recipes from any cooking website - paste a URL and it pulls everything
- Create your own recipes manually
- Edit anything, organize with categories and tags
- Mark favorites for quick access
- Print-friendly views (actually useful on a tablet in the kitchen)

**Meal Planning**
- Weekly calendar to plan your meals
- Drag and drop recipes onto days
- Automatically generate shopping lists from your meal plan
- Shopping lists with duplicate detection (no more buying onions three times)

**Organization**
- Search recipes by name, ingredient, or instruction
- Filter by category or tags
- Pagination for large collections
- Image view for full recipe photos

## Setup

You'll need Node.js 18+, PostgreSQL 14+, and Python 3.8+ for the recipe scraper.

1. Clone it
   ```bash
   git clone https://github.com/Chase-42/recipe_vault.git
   cd recipe_vault
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   
   You'll need:
   - `POSTGRES_URL` - Your PostgreSQL connection string
   - `BETTER_AUTH_SECRET` - At least 32 characters for auth
   - `BETTER_AUTH_URL` - Your app URL (optional, defaults to NEXT_PUBLIC_DOMAIN)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth (optional)
   - `UPLOADCARE_SECRET_KEY` / `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` - For image hosting
   - `NEXT_PUBLIC_DOMAIN` - Your app domain

4. Run migrations
   ```bash
   npm run db:push
   ```

5. Start the dev server
   ```bash
   npm run dev
   ```
   
   This starts both the Next.js app and the Python Flask scraper. Open `http://localhost:3000`.

## Tech Stack

- **Next.js** - Frontend and API routes
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database queries
- **Better Auth** - Authentication (email/password + Google OAuth)
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **Uploadcare** - Image hosting
- **Python Flask** - Recipe scraping server

The recipe scraper tries multiple methods - a JavaScript package first, then a Python Flask API, with fallbacks. Most recipe sites work.

## License

MIT
