
# Recipe Vault

Recipe Vault is a web application built with Next.js, a Python Flask serverless function, Clerk for authentication, PostgreSQL database, Drizzle ORM, Tailwind CSS, and Shadcn UI. The application allows users to save recipes by pasting a recipe URL. It scrapes the webpage to find the recipe name, picture, ingredients, and instructions, and saves them for easy access in a centralized location.

Hosted on Vercel: https://recipe-vault-pied.vercel.app/

## Features

- User authentication with Clerk
- Save recipes by pasting a URL of a recipe page
- Create your own by entering ingredients, instructions, and an image
- Web scraping to extract recipe details
- Store recipe name, picture, ingredients, and instructions in PostgreSQL DB
- Uploads image to UploadCare
- Search functionality
- Checkbox for recipe ingredients for shopping (local storage)
- Edit and delete recipes
- Generates blurred placeholders for images while loading.
- Prefetch recipes on hover
- Responsive design using Tailwind CSS and Shadcn UI
- Parallel routes for Modal Views
- Infinite Scrolling
- Mark recipes as favorites

## Tech Stack

- **Frontend:** Next.js, Tailwind CSS, Shadcn UI
- **Backend:** Node.js & Python Flask (serverless function)
- **Authentication:** Clerk
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM

## Getting Started

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

## Usage

1. **Sign Up / Login:**

   Users can sign up or log in using Clerk authentication.

2. **Save a Recipe:**

   Paste the URL of the recipe you want to save, and the application will scrape the webpage to extract and save the recipe details.

3. **View Saved Recipes:**

   Access your saved recipes from your profile.

4. **Search Recipes:**

   Use the search functionality to find specific recipes.

5. **Edit and Delete Recipes:**

   Edit or delete recipes as needed.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.


## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Flask](https://flask.palletsprojects.com/)
- [Clerk](https://clerk.dev/)
- [PostgreSQL](https://www.postgresql.org/)
- [Drizzle ORM](https://drizzle-orm.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://shadcn.dev/)
