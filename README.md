# Recipe Vault

A modern recipe management application that helps you collect, organize, and cook from your favorite recipes. Built with Next.js, TanStack Query, and Tailwind CSS for the frontend, Python Flask for recipe scraping, and PostgreSQL with Drizzle ORM for data persistence. Recipe Vault offers a seamless experience for managing your digital recipe collection, featuring Clerk authentication, Uploadcare for image hosting, and Shadcn UI components.

[Try Recipe Vault →](https://recipe-vault-pied.vercel.app/)

## Features

### Recipe Management
- Import recipes directly from any cooking website
- Create and edit custom recipes with rich formatting
- Organize recipes with tags and categories
- Mark favorites for quick access
- Print-optimized recipe views

### Smart Organization
- Powerful search across ingredients and instructions
- Shopping list generation from ingredients
- Interactive ingredient checklist while cooking
- Tag-based categorization
- Responsive layout optimized for kitchen use

### Technical Features
- Fast, modern UI built with Next.js and React
- Secure authentication via Clerk
- PostgreSQL database with Drizzle ORM
- Optimized image handling and caching
- Parallel routes for modal views
- Server-side recipe scraping

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Python 3.8+ (for recipe scraping)

### Quick Start
1. Clone the repository
   ```bash
   git clone https://github.com/Chase-42/recipe_vault.git
   cd recipe-vault
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see your local instance.

### Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_FRONTEND_API`: Clerk Frontend API key
- `CLERK_API_KEY`: Clerk API key
- `UPLOADCARE_PUBLIC_KEY`: Uploadcare public key for image hosting

## Recent Updates

- Improved recipe view layout and modal interactions
- Enhanced search functionality with categories and tags
- Added shopping list feature
- Optimized performance and image handling
- Implemented comprehensive error handling
- Added print-friendly recipe views

## Development

### Architecture
Recipe Vault follows a modern web architecture:
- Next.js for the frontend and API routes
- PostgreSQL with Drizzle ORM for data persistence
- Python Flask serverless function for recipe scraping
- Clerk for authentication and user management

### Key Technologies
- [Next.js](https://nextjs.org/) - React framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Drizzle ORM](https://drizzle-orm.com/) - TypeScript ORM
- [Clerk](https://clerk.dev/) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Shadcn UI](https://shadcn.dev/) - UI components

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
