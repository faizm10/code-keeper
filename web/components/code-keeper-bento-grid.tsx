"use client";

import { cn } from "@/lib/utils";
import {
    CheckCircle2,
    FileText,
    RefreshCw,
    TestTube,
    GitPullRequest,
    Shield,
} from "lucide-react";
import {
    motion,
    useMotionValue,
    useTransform,
    type Variants,
} from "motion/react";
import { useState } from "react";

interface BentoItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const bentoItems: BentoItem[] = [
    {
        id: "detect",
        title: "Detect Changes",
        description: "Intelligently identifies and analyzes changes across your codebase",
        icon: <CheckCircle2 className="h-6 w-6" />,
        size: "md",
        className: "col-span-1 row-span-1",
    },
    {
        id: "docs",
        title: "Update Documentation",
        description: "Automatically maintains README, API docs, and changelogs in sync with code changes",
        icon: <FileText className="h-6 w-6" />,
        size: "md",
        className: "col-span-1 row-span-1",
    },
    {
        id: "refactor",
        title: "Safe Refactoring",
        description: "Performs safe code transformations like renaming and file reorganization",
        icon: <RefreshCw className="h-6 w-6" />,
        size: "md",
        className: "col-span-1 row-span-1",
    },
    {
        id: "test",
        title: "Test Validation",
        description: "Runs your test suite to verify changes don't introduce regressions",
        icon: <TestTube className="h-6 w-6" />,
        size: "md",
        className: "col-span-1 row-span-1",
    },
    {
        id: "pr",
        title: "Pull Request Generation",
        description: "Creates comprehensive pull requests with all proposed changes for team review",
        icon: <GitPullRequest className="h-6 w-6" />,
        size: "md",
        className: "col-span-1 row-span-1",
    },
    {
        id: "safe",
        title: "Safe by Default",
        description: "Never commits directly to main. All changes are proposed through pull requests",
        icon: <Shield className="h-6 w-6" />,
        size: "md",
        className: "col-span-1 row-span-1",
    },
];

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut",
        },
    },
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const BentoCard = ({ item }: { item: BentoItem }) => {
    const [isHovered, setIsHovered] = useState(false);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [2, -2]);
    const rotateY = useTransform(x, [-100, 100], [-2, 2]);

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct * 100);
        y.set(yPct * 100);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
        setIsHovered(false);
    }

    return (
        <motion.div
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="h-full"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
        >
            <div
                className={cn(
                    "group relative flex flex-col gap-4 h-full rounded-xl p-6",
                    "bg-gradient-to-b from-card/60 via-card/40 to-card/30",
                    "border border-border/60",
                    "before:absolute before:inset-0 before:rounded-xl",
                    "before:bg-gradient-to-b before:from-primary/5 before:via-primary/10 before:to-transparent",
                    "before:opacity-0 before:transition-opacity before:duration-500",
                    "group-hover:before:opacity-100",
                    "backdrop-blur-sm",
                    "shadow-sm",
                    "hover:border-primary/50",
                    "hover:shadow-lg",
                    "transition-all duration-500 ease-out",
                    item.className
                )}
                tabIndex={0}
                aria-label={`${item.title} - ${item.description}`}
            >
                <div
                    className="relative z-10 flex flex-col gap-4 h-full"
                    style={{ transform: "translateZ(20px)" }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                            {item.icon}
                        </div>
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                            {item.title}
                        </h3>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export function CodeKeeperBentoGrid() {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
            {bentoItems.map((item) => (
                <motion.div key={item.id} variants={fadeInUp}>
                    <BentoCard item={item} />
                </motion.div>
            ))}
        </motion.div>
    );
}

