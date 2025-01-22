# 📗 Recipe Vault

Recipe Vault is a web application built with Next.js, a Python Flask serverless function, Clerk for authentication, PostgreSQL database, Drizzle ORM, Tailwind CSS, and Shadcn UI. The application allows users to save recipes by pasting a recipe URL. It scrapes the webpage to find the recipe name, picture, ingredients, and instructions, and saves them for easy access in a centralized location.

🌐 Hosted on Vercel: https://recipe-vault-pied.vercel.app/

## ✨ Features

### 🔑 Authentication & Security
- User authentication with Clerk
- Secure data handling
- Protected API routes

### 📝 Recipe Management
- Save recipes by pasting a URL of a recipe page
- Create your own by entering ingredients, instructions, and an image
- Edit and delete recipes
- Mark recipes as favorites
- Print-friendly recipe views

### 🤖 Automation
- Web scraping to extract recipe details
- Automatic image optimization
- Generates blurred placeholders for images while loading

### 💾 Data Storage
- Store recipe name, picture, ingredients, and instructions in PostgreSQL DB
- Uploads image to UploadCare
- Efficient data caching

### 🎯 User Experience
- Search functionality
- Checkbox for recipe ingredients for shopping (local storage)
- Prefetch recipes on hover
- Responsive design using Tailwind CSS and Shadcn UI
- Parallel routes for Modal Views
- Pagination with customizable page size

## 🛠️ Tech Stack

### Frontend
- **📱 Framework:** Next.js
- **🎨 Styling:** Tailwind CSS, Shadcn UI
- **📊 State Management:** TanStack Query

### Backend
- **⚙️ Runtime:** Node.js
- **🐍 Scraping:** Python Flask (serverless function)
- **🔐 Auth:** Clerk
- **📦 Database:** PostgreSQL
- **🗄️ ORM:** Drizzle ORM

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- Python
- PostgreSQL
- Clerk account

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Chase-42/recipe_vault.git
   cd recipe-vault
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up the PostgreSQL database:**

   Create a PostgreSQL database and update the connection string in your environment variables.

4. **Configure Clerk:**

   Set up your Clerk project and update the Clerk configuration in your environment variables.

5. **Environment Variables:**

   Create a `.env.local` file in the root directory and add the necessary environment variables:

   ```env
   DATABASE_URL=your_postgresql_connection_string
   CLERK_FRONTEND_API=your_clerk_frontend_api
   CLERK_API_KEY=your_clerk_api_key
   ```

6. **Run the development server:**

   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

### Deployment

To deploy the application, follow the deployment instructions for your hosting provider. Ensure that all environment variables are set up correctly on the hosting platform.

## 💡 Usage Tips

### Recipe Import
1. Find a recipe you love on any cooking website
2. Copy the URL
3. Paste it into Recipe Vault
4. Review and save the automatically extracted details

### Recipe Organization
- Use favorites for quick access to frequent recipes
- Utilize search to find specific recipes
- Print recipes for offline use
- Check off ingredients while cooking

## 🔄 Recent Updates
- Added print-friendly recipe views
- Implemented pagination system
- Enhanced image loading performance
- Improved recipe editing interface
- Added error handling and error pages


## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Flask](https://flask.palletsprojects.com/)
- [Clerk](https://clerk.dev/)
- [PostgreSQL](https://www.postgresql.org/)
- [Drizzle ORM](https://drizzle-orm.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://shadcn.dev/)
