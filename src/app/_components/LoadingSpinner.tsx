import { motion } from "framer-motion";

const LoadingSpinner = () => (
  <div className="flex h-full items-center justify-center">
    <motion.div
      className="mt-10 h-32 w-32 rounded-full border-b-2 border-t-2 border-red-800"
      animate={{ rotate: 360 }}
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        duration: 2,
        ease: "linear",
      }}
    />
  </div>
);

export default LoadingSpinner;
