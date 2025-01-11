"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect } from "react";
import { Utensils, ChefHat, Clock } from "lucide-react";
import RecipeList from "~/app/_components/RecipeList";

const FloatingIcon = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{
        y: [-10, 10, -10],
        rotate: [-5, 5, -5],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      className={`absolute ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default function HomePage() {
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    });
  }, [controls]);

  return (
    <main>
      <SignedOut>
        <div className="flex min-h-screen flex-col items-center overflow-hidden bg-background p-8 text-center">
          {/* Floating Icons */}
          <FloatingIcon className="left-1/4 top-32 text-muted-foreground opacity-20">
            <ChefHat size={48} />
          </FloatingIcon>
          <FloatingIcon
            className="right-1/4 top-48 text-muted-foreground opacity-20"
            delay={1}
          >
            <Utensils size={48} />
          </FloatingIcon>
          <FloatingIcon
            className="bottom-32 left-1/3 text-muted-foreground opacity-20"
            delay={2}
          >
            <Clock size={48} />
          </FloatingIcon>

          {/* Background Gradient */}
          <motion.div
            className="absolute left-0 right-0 top-0 h-96 bg-gradient-to-r from-primary via-primary to-primary opacity-10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            className="relative z-10 max-w-4xl pt-20"
          >
            <div className="pb-8">
              <h1 className="relative mb-6 text-5xl font-bold tracking-tight text-foreground">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  className="absolute -bottom-2 left-0 h-1 bg-primary"
                  style={{ originX: 0 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                <motion.span
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="inline-block"
                >
                  Welcome to
                </motion.span>{" "}
                <motion.span
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative inline-block text-primary"
                >
                  Recipe Vault
                </motion.span>
              </h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative"
              >
                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  Add your favorite recipes in seconds—simply share a recipe
                  link for automatic import of ingredients, instructions, and
                  photos, or manually enter your cherished family recipes. Keep
                  all your cooking inspiration organized in one place, making it
                  easy to find and cook what you love.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative mt-12"
            >
              <motion.div
                className="absolute inset-0 rounded-lg bg-primary/20 blur-lg"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              <motion.p
                className="relative rounded-lg border bg-card px-8 py-4 text-xl text-primary shadow-sm"
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
              >
                Please sign in to start saving recipes
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </SignedOut>

      <SignedIn>
        <RecipeList />
      </SignedIn>
    </main>
  );
}
