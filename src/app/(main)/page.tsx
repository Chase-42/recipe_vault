"use client";

import { useState } from "react";
import { authClient } from "~/lib/auth-client";
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
  Code,
} from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import RecipeList from "~/app/_components/RecipeList";

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

const TiltCard = ({ children }: { children: React.ReactNode }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [8, -8]);
  const rotateY = useTransform(x, [-100, 100], [-8, 8]);

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
};

const FloatingShapes = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute h-96 w-96 rounded-full bg-red-600/5 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20 + i * 5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          left: `${20 + i * 30}%`,
          top: `${10 + i * 20}%`,
        }}
      />
    ))}
  </div>
);

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
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 h-1 w-1 rounded-full bg-red-500"
          style={{ left: `${10 + i * 10}%` }}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -30 - Math.random() * 20, -50],
            x: (Math.random() - 0.5) * 40,
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
      "Filter by ingredient, cook time, or cuisine. Find that chicken thing you made last month.",
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
    icon: CheckCircle,
    title: "Cooking Mode",
    description:
      "Step-by-step view with checkboxes. Keep your place without scrolling back up.",
    delay: 0.5,
  },
  {
    icon: Printer,
    title: "Print",
    description:
      "Clean printable format. No ads, no popups, just the recipe on paper.",
    delay: 0.6,
  },
];

const LandingPage = () => (
  <div className="min-h-screen bg-black text-white">
    <FloatingShapes />

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
        <div className="mx-auto max-w-4xl text-center">
          <ChopSizzleTitle />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-gray-400"
          >
            Save recipes from anywhere, sort them by meal type, and generate
            grocery lists. No life stories—just the recipe.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/sign-in">
              <MagneticButton className="rounded-lg bg-red-600 px-8 py-4 text-lg font-medium text-white hover:bg-red-700">
                Get Started
              </MagneticButton>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>

    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
      className="bg-gray-950/50 py-16"
    >
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
            Features
          </h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: feature.delay,
                type: "spring",
                stiffness: 100,
              }}
              viewport={{ once: true }}
            >
              <TiltCard>
                <Card className="h-full rounded-xl border-gray-800/50 bg-gray-900/50 transition-colors duration-300 hover:border-red-600/30">
                  <CardHeader>
                    <feature.icon className="mb-4 h-12 w-12 text-red-600" />
                    <CardTitle className="text-white">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-gray-400">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TiltCard>
            </motion.div>
          ))}
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
            Zero AI. Forever.
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-gray-400">
            No chatbots suggesting dinner. No algorithms rewriting your
            grandma's recipe. Just good old fashioned code that does exactly
            what you tell it to. Your recipes stay yours.
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

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();

  if (session) {
    return <RecipeList />;
  }

  if (!isPending) {
    return <LandingPage />;
  }

  return null;
}
