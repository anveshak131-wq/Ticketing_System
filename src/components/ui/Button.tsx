"use client";

import { buttonStyles, type ButtonSize, type ButtonVariant } from "@/components/ui/button-styles";
import { motion, type HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {children}
    </motion.button>
  );
}
