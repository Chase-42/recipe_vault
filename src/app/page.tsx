"use client";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Search,
  ShoppingCart,
  Tags,
  Globe,
  Printer,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { SignInButton } from "@clerk/nextjs";

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

export default function HomePage() {
  return (
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
            <span className="text-xl font-semibold text-white">
              Recipe Vault
            </span>
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
              <Badge
                variant="secondary"
                className="mb-4 bg-red-600/20 text-red-400 border-red-600/30"
              >
                Built for Home Cooks
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
                Recipe Vault
              </h1>
              <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-400 mb-12">
                Import recipes from any website, organize with smart tags,
                generate shopping lists, and cook with kitchen-optimized
                guidance. Your digital recipe collection, finally organized.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <SignInButton>
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg rounded-lg border-0"
                  >
                    Sign In to Start
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
              Everything you need to organize recipes
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built for home cooks who want their recipes organized, accessible,
              and clutter-free.
            </p>
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
                  <CardTitle className="text-white">
                    Smart Recipe Import
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-base leading-relaxed">
                    Paste any recipe URL from popular cooking sites like
                    AllRecipes, Food Network, or NYT Cooking. Our parser
                    automatically extracts ingredients, instructions, cooking
                    times, and nutritional info. Works with 500+ recipe websites
                    and handles complex formatting like ingredient ranges and
                    optional steps.
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
                  <CardTitle className="text-white">
                    Flexible Organization System
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-base leading-relaxed">
                    Create custom tags like "weeknight dinner," "dairy-free," or
                    "under 30 minutes." Build collections for meal planning,
                    special diets, or seasonal cooking. Auto-tagging suggests
                    categories based on ingredients and cooking methods.
                    Organize by cuisine, difficulty, prep time, or any system
                    that works for you.
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
                  <CardTitle className="text-white">
                    Intelligent Recipe Search
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-base leading-relaxed">
                    Search by ingredients you have on hand, dietary
                    restrictions, cooking time, or cuisine type. Natural
                    language queries like "chicken recipes under 45 minutes" or
                    "what can I make with tomatoes and basil?" Advanced filters
                    help you find exactly what you're craving when you're
                    craving it.
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
                  <CardTitle className="text-white">
                    Smart Shopping Lists
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-base leading-relaxed">
                    Generate shopping lists from single recipes or entire meal
                    plans. Automatically combines duplicate ingredients and
                    organizes by grocery store sections. Scale recipes up or
                    down and the shopping list adjusts accordingly. Share lists
                    with family members and check off items in real-time.
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
                  <CardTitle className="text-white">
                    Kitchen-Optimized Cooking Mode
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-base leading-relaxed">
                    Large, touch-friendly interface perfect for messy hands.
                    Check off ingredients as you add them and steps as you
                    complete them. Built-in timers for each cooking stage.
                    Screen stays awake while cooking. Voice commands for
                    hands-free navigation when your hands are full.
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
                  <CardTitle className="text-white">
                    Beautiful Recipe Cards
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-base leading-relaxed">
                    Print clean, professional recipe cards optimized for
                    standard paper sizes. Customizable layouts include
                    ingredient lists, step-by-step instructions, and cooking
                    notes. Perfect for sharing with friends, creating physical
                    recipe books, or keeping backup copies of family favorites.
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
              How It Actually Works
            </h2>
            <p className="text-xl text-gray-400">
              Simple workflow, powerful results.
            </p>
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
                Paste recipe URLs from any cooking website, or manually create
                recipes with our structured editor. Import your existing recipe
                collection from other apps or documents. Bulk import from
                bookmarks or recipe emails.
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
                Tag recipes with custom categories, rate your favorites, and add
                personal notes. Use powerful search to find recipes by
                ingredients, cooking time, or dietary needs. Build meal plans
                and cooking schedules.
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
                Use kitchen mode for step-by-step cooking guidance. Generate
                shopping lists for grocery trips. Scale recipes for different
                serving sizes. Share favorite recipes with friends and family,
                or print beautiful recipe cards.
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
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              Sign in to start organizing your recipes.
            </p>
            <SignInButton>
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 text-lg rounded-lg border-0"
              >
                Sign In
              </Button>
            </SignInButton>
          </div>
        </div>
      </section>
    </div>
  );
}
