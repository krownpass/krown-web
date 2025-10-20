"use client"
import * as React from "react";
import { motion } from "framer-motion";
import { scaleUp } from "@/lib/animation";
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
}

export function Card({ className = "", children, hover = true, ...props }: CardProps) {
    return (
        <motion.div
            variants={scaleUp}
            initial="rest"
            whileHover={hover ? "hover" : "rest"}
            className={
                "rounded-xl border bg-card text-card-foreground p-4 transition-colors " + className
            }
            {...(props as any)}
        >
            {children}
        </motion.div>
    );
}
