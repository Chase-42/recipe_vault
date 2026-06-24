"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Code,
  Globe,
  ListChecks,
  Printer,
  Search,
  ShoppingCart,
  Tags,
  Timer,
} from "lucide-react";
import { motion, useMotionValue, useAnimation } from "framer-motion";
import RecipeList from "~/app/_components/RecipeList";
import type { PaginatedRecipes } from "~/types";

interface HomeContentProps {
  isAuthenticated: boolean;
  initialData: PaginatedRecipes | null;
}

const MagneticButton = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isChopped, setIsChopped] = useState(false);

  return (
    <motion.button
      style={{ x, y }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.3);
        y.set((e.clientY - centerY) * 0.3);
      }}
      onMouseEnter={() => setIsChopped(true)}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
        setIsChopped(false);
      }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      className={`${className} relative overflow-visible`}
    >
      <span className="relative block">
        <motion.span
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-white to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: isChopped ? [0, 1.2, 0] : 0,
            opacity: isChopped ? [0, 1, 0] : 0,
          }}
          transition={{ duration: 0.15 }}
        />
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          style={{ clipPath: "inset(0 0 50% 0)" }}
          animate={{
            y: isChopped ? -4 : 0,
            x: isChopped ? -2 : 0,
            rotate: isChopped ? -1.5 : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          {children}
        </motion.span>
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          style={{ clipPath: "inset(50% 0 0 0)" }}
          animate={{
            y: isChopped ? 4 : 0,
            x: isChopped ? 2 : 0,
            rotate: isChopped ? 1.5 : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          {children}
        </motion.span>
        <span className="invisible">{children}</span>
      </span>
    </motion.button>
  );
};


// Fixed particle offsets for deterministic animation
const PARTICLE_OFFSETS = [
  { y: -38, x: -15 },
  { y: -42, x: 12 },
  { y: -35, x: -8 },
  { y: -45, x: 18 },
  { y: -40, x: -12 },
  { y: -36, x: 5 },
  { y: -44, x: -18 },
  { y: -39, x: 10 },
];

const ChopSizzleTitle = () => {
  const text = "Recipe Vault";

  return (
    <div className="relative mb-8">
      <motion.div
        className="absolute -top-4 left-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent"
        style={{ width: "100%" }}
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: [0, 1, 1, 0] }}
        transition={{
          duration: 0.3,
          times: [0, 0.4, 0.6, 1],
          ease: "easeOut",
        }}
      />
      <h1 className="text-5xl font-bold leading-[1.1] tracking-tight lg:text-7xl">
        {text.split("").map((char, i) => (
          <motion.span
            key={i}
            className="relative inline-block"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{
              delay: 0.15 + i * 0.025,
              duration: 0.08,
              ease: "linear",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </h1>
      {PARTICLE_OFFSETS.map((offset, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 h-1 w-1 rounded-full bg-red-500"
          style={{ left: `${10 + i * 10}%` }}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, offset.y, -50],
            x: offset.x,
            scale: [0, 1, 0.5],
          }}
          transition={{
            delay: 0.2 + i * 0.03,
            duration: 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

const features = [
  {
    icon: Globe,
    title: "Import from URL",
    description:
      "Paste a link, get the recipe. Ingredients, steps, and photos pulled automatically.",
    delay: 0.1,
  },
  {
    icon: Tags,
    title: "Categories",
    description:
      "Organize by breakfast, lunch, dinner, or dessert. Find what you need fast.",
    delay: 0.2,
  },
  {
    icon: Search,
    title: "Search",
    description:
      "Filter by ingredient, cook time, or cuisine. Find that recipe you bookmarked three weeks ago.",
    delay: 0.3,
  },
  {
    icon: ShoppingCart,
    title: "Shopping Lists",
    description:
      "Pick recipes, get a grocery list. Combines duplicate ingredients automatically.",
    delay: 0.4,
  },
  {
    icon: ListChecks,
    title: "Cooking Mode",
    description:
      "Step-by-step view with checkboxes. Keep your place without scrolling back up.",
    delay: 0.5,
  },
  {
    icon: Timer,
    title: "Timer",
    description:
      "Built-in cooking timer. Set it while you cook without switching apps.",
    delay: 0.6,
  },
  {
    icon: Printer,
    title: "Print",
    description:
      "Clean printable format. No ads, no popups, just the recipe on paper.",
    delay: 0.7,
  },
];

const LandingPage = () => {
  const [landed, setLanded] = useState(false);
  const hasLanded = useRef(false);
  const shakeControls = useAnimation();

  const handleLanded = () => {
    if (hasLanded.current) return;
    hasLanded.current = true;
    setLanded(true);
    void shakeControls.start({
      x: [0, -6, 6, -3, 3, 0],
      transition: { duration: 0.25, ease: "easeOut" },
    });
  };

  return (
  <div className="min-h-screen bg-black text-white">

    <nav className="flex items-center justify-between p-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white">Recipe Vault</span>
      </div>
      <Link href="/sign-in">
        <MagneticButton className="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
          Sign In
        </MagneticButton>
      </Link>
    </nav>

    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-6">
        <motion.div
          animate={shakeControls}
          className="mx-auto flex min-h-[480px] max-w-4xl flex-col items-center pt-8 text-center"
        >
          <motion.div
            initial={{ y: -500, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 28, mass: 1.5 }}
            onAnimationComplete={handleLanded}
            className="mb-8"
          >
            <Image
              src="/recipe_vault_image.svg"
              alt="Recipe Vault"
              width={80}
              height={80}
              priority
            />
          </motion.div>

          {landed && (
            <>
              <ChopSizzleTitle />
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-gray-400"
              >
                Save recipes from anywhere, sort them by meal type, and generate
                grocery lists. No ads, no stories, no scrolling through someone's
                life story to find the instructions.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Link href="/sign-in">
                  <MagneticButton className="rounded-lg bg-red-600 px-8 py-4 text-lg font-medium text-white hover:bg-red-700">
                    Get Started
                  </MagneticButton>
                </Link>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </section>

    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
      className="py-16"
    >
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: feature.delay }}
                viewport={{ once: true }}
                className="flex items-start gap-4 border-t border-gray-800 py-6"
              >
                <span className="mt-1 w-6 shrink-0 font-mono text-sm text-gray-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-gray-800 bg-gray-900">
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <span className="text-base font-medium text-white">
                    {feature.title}
                  </span>
                  <p className="mt-1 text-base leading-relaxed text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
          <div className="border-t border-gray-800" />
        </div>
      </div>
    </motion.section>

    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="border-y border-gray-800/50 py-16"
    >
      <div className="container mx-auto px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-700 bg-gray-900">
            <Code className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white lg:text-3xl">
            Zero AI. I promise.
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-gray-400">
            No chatbots suggesting dinner. No algorithms rewriting your favorite
            recipes. Just good old fashioned code that does exactly what you
            tell it to.
          </p>
        </div>
      </div>
    </motion.section>

    <section className="py-16">
      <div className="container mx-auto px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-4xl font-bold leading-tight text-white lg:text-5xl">
            Free to use
          </h2>
          <p className="mb-12 text-xl leading-relaxed text-gray-400">
            Just sign up and start saving recipes.
          </p>
          <Link href="/sign-in">
            <MagneticButton className="rounded-lg bg-red-600 px-12 py-4 text-lg font-medium text-white hover:bg-red-700">
              Get Started
            </MagneticButton>
          </Link>
        </div>
      </div>
    </section>
  </div>
  );
};

export default function HomeContent({
  isAuthenticated,
  initialData,
}: HomeContentProps) {
  if (isAuthenticated && initialData) {
    return <RecipeList initialData={initialData} />;
  }

  return <LandingPage />;
}
