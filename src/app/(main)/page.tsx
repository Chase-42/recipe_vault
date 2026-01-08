"use client";

import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Link from "next/link";
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

const LandingPage = () => (
  <div className="min-h-screen bg-black text-white">
    {/* Top Navigation */}
    <nav className="flex items-center justify-between p-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-white">Recipe Vault</h1>
      </div>
      <Link href="/sign-in">
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          Sign In
        </Button>
      </Link>
    </nav>

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
              <Link href="/sign-in">
                <Button
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg rounded-lg border-0"
                >
                  Start Cooking Now
                </Button>
              </Link>
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
          <Link href="/sign-in">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 text-lg rounded-lg border-0"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();
  
  // If we have a session, show RecipeList (it handles its own loading state)
  if (session) {
    return <RecipeList />;
  }
  
  // If we're sure there's no session, show landing page
  if (!isPending) {
    return <LandingPage />;
  }
  
  // While checking session (should be instant), show nothing
  // The layout will still render, so navbar won't show yet
  return null;
}
