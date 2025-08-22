"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Search,
  ShoppingCart,
  Tags,
  Globe,
  Printer,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import RecipeList from "~/app/_components/RecipeList";

const VaultIcon = ({ className }: { className?: string }) => (
  <svg
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Recipe Vault Logo"
    role="img"
  >
    <path d="M15.935,6.06H8.065a2,2,0,0,0-2,2v6a1.993,1.993,0,0,0,2,2h7.87a2,2,0,0,0,2-2v-6A2.006,2.006,0,0,0,15.935,6.06Zm1,8a1,1,0,0,1-1,1H8.065a.99.99,0,0,1-1-1v-6a1,1,0,0,1,1-1h7.87a1,1,0,0,1,1,1Z" />
    <path d="M18.435,3.06H5.565a2.507,2.507,0,0,0-2.5,2.5v11a2.5,2.5,0,0,0,2.5,2.5v.38a1.5,1.5,0,0,0,1.5,1.5h1.43a1.5,1.5,0,0,0,1.5-1.5v-.38h4v.38a1.5,1.5,0,0,0,1.5,1.5h1.44a1.5,1.5,0,0,0,1.5-1.5v-.38a2.5,2.5,0,0,0,2.5-2.5v-11A2.507,2.507,0,0,0,18.435,3.06ZM8.995,19.44a.5.5,0,0,1-.5.5H7.065a.5.5,0,0,1-.5-.5v-.38h2.43Zm8.44,0a.5.5,0,0,1-.5.5H15.5a.508.508,0,0,1-.5-.5v-.38h2.44Zm2.5-2.88a1.5,1.5,0,0,1-1.5,1.5H5.565a1.5,1.5,0,0,1-1.5-1.5v-11a1.5,1.5,0,0,1,1.5-1.5h12.87a1.5,1.5,0,0,1,1.5,1.5Z" />
    <path d="M14.265,10.56h-.61A1.656,1.656,0,0,0,12.5,9.4V8.79a.491.491,0,0,0-.5-.48.5.5,0,0,0-.5.48V9.4a1.656,1.656,0,0,0-1.16,1.16h-.61a.5.5,0,0,0-.48.5.491.491,0,0,0,.48.5h.61a1.656,1.656,0,0,0,1.16,1.16v.62a.489.489,0,0,0,.5.47.483.483,0,0,0,.5-.47v-.62a1.622,1.622,0,0,0,1.16-1.16h.61a.485.485,0,0,0,.48-.5A.491.491,0,0,0,14.265,10.56ZM12,11.81a.75.75,0,1,1,.75-.75A.749.749,0,0,1,12,11.81Z" />
  </svg>
);

const LandingPage = () => (
  <div className="min-h-screen bg-black text-white">
    {/* Header */}
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="border-b border-gray-800/50 bg-black/80 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 text-white">
            <VaultIcon className="w-full h-full" />
          </div>
          <span className="text-xl font-semibold text-white">Recipe Vault</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <SignInButton>
            <Button className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-lg px-6">
              Sign In
            </Button>
          </SignInButton>
        </motion.div>
      </div>
    </motion.header>

    {/* Hero Section */}
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
              Recipe Vault
            </h1>
            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-400 mb-12">
              Import recipes from any website, organize with tags, generate
              shopping lists, and plan meals. Your recipe collection, finally
              organized and ready to cook. Stop scrolling, start cooking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <SignInButton>
                <Button
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg rounded-lg border-0"
                >
                  Start Cooking Now
                </Button>
              </SignInButton>
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Features Section */}
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
      className="py-16 bg-gray-950/50"
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            What you can do
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            viewport={{ once: true }}
          >
            <Card className="bg-gray-900/50 border-gray-800/50 hover:border-red-600/30 transition-all duration-300 rounded-xl h-full">
              <CardHeader>
                <Globe className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle className="text-white">Import Recipes</CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  Paste a recipe URL and watch ingredients, instructions, and
                  photos appear instantly.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            viewport={{ once: true }}
          >
            <Card className="bg-gray-900/50 border-gray-800/50 hover:border-red-600/30 transition-all duration-300 rounded-xl h-full">
              <CardHeader>
                <Tags className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle className="text-white">Organize Recipes</CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  Create tags and organize recipes by meal type or cooking time.
                  Find what you need in seconds.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.3,
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            viewport={{ once: true }}
          >
            <Card className="bg-gray-900/50 border-gray-800/50 hover:border-red-600/30 transition-all duration-300 rounded-xl h-full">
              <CardHeader>
                <Search className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle className="text-white">Search Recipes</CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  Find recipes by ingredients, cooking time, or cuisine type.
                  Discover new favorites.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.4,
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            viewport={{ once: true }}
          >
            <Card className="bg-gray-900/50 border-gray-800/50 hover:border-red-600/30 transition-all duration-300 rounded-xl h-full">
              <CardHeader>
                <ShoppingCart className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle className="text-white">Shopping Lists</CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  Generate shopping lists from recipes or meal plans. Never
                  forget an ingredient again.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.5,
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            viewport={{ once: true }}
          >
            <Card className="bg-gray-900/50 border-gray-800/50 hover:border-red-600/30 transition-all duration-300 rounded-xl h-full">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle className="text-white">Cooking Mode</CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  Step-by-step cooking interface with ingredient checkoffs. Cook
                  with confidence.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.6,
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            viewport={{ once: true }}
          >
            <Card className="bg-gray-900/50 border-gray-800/50 hover:border-red-600/30 transition-all duration-300 rounded-xl h-full">
              <CardHeader>
                <Printer className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle className="text-white">Print Recipes</CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  Print recipes for sharing or keeping physical copies.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.section>

    {/* How It Works Section */}
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
      className="py-16"
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.1,
              type: "spring",
              stiffness: 80,
            }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.3,
                type: "spring",
                stiffness: 200,
              }}
              viewport={{ once: true }}
              className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6"
            >
              1
            </motion.div>
            <h3 className="text-2xl font-semibold mb-4 text-white">
              Import & Create
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Paste recipe URLs or manually create recipes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              type: "spring",
              stiffness: 80,
            }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.4,
                type: "spring",
                stiffness: 200,
              }}
              viewport={{ once: true }}
              className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6"
            >
              2
            </motion.div>
            <h3 className="text-2xl font-semibold mb-4 text-white">
              Organize & Discover
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Tag recipes and search by ingredients or cooking time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              type: "spring",
              stiffness: 80,
            }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.5,
                type: "spring",
                stiffness: 200,
              }}
              viewport={{ once: true }}
              className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6"
            >
              3
            </motion.div>
            <h3 className="text-2xl font-semibold mb-4 text-white">
              Cook & Share
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Cook with step-by-step guidance and create shopping lists.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.section>

    {/* CTA Section */}
    <section className="py-16">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to transform your cooking?
          </h2>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            Sign in and start building your recipe collection.
          </p>
          <SignInButton>
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 text-lg rounded-lg border-0"
            >
              Get Started
            </Button>
          </SignInButton>
        </div>
      </div>
    </section>
  </div>
);

export default function HomePage() {
  return (
    <main>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <RecipeList />
      </SignedIn>
    </main>
  );
}
