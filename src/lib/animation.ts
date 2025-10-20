
export const slideFade = {
    hidden: { x: -16, opacity: 0 },
    show: { x: 0, opacity: 1, transition: { duration: 0.22 } },
    exit: { x: -16, opacity: 0, transition: { duration: 0.18 } },
};

export const scaleUp = {
    rest: { scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" },
    hover: {
        scale: 1.02,
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        transition: { type: "spring", stiffness: 300, damping: 22 },
    },
};

export const fadeIn = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};
