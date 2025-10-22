"use client";
import { fadeIn } from "@/lib/animation";
import { motion } from "framer-motion";
import { PanelLeft } from "lucide-react";
export interface AdminHeaderProps {
    title?: string;
    onToggleSidebar?: () => void;
    right?: React.ReactNode;
}

export function CafeAdminHeader({ title = "Dashboard", onToggleSidebar, right }: AdminHeaderProps) {
    return (
        <motion.header
            variants={fadeIn}
            initial="hidden"
            animate="show"
            className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/70 backdrop-blur px-4"
        >
<div className="flex items-center gap-2 p-2.5">
                <button
                    onClick={onToggleSidebar}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                    <PanelLeft className="size-4" />
                    <span className="hidden sm:inline">Menu</span>
                </button>
                <span className="font-medium text-foreground/90">{title}</span>
            </div>
            <div className="flex items-center gap-2">{right}</div>
        </motion.header>
    );
}
