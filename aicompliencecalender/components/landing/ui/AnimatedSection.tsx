"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef, useState } from "react";

type Animation = "fade" | "fade-up" | "scale";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: Animation;
  delay?: number;
  as?: "div" | "section" | "article" | "header" | "footer";
}

const animationStyles: Record<Animation, { initial: string; visible: string }> = {
  fade: {
    initial: "opacity-0",
    visible: "opacity-100",
  },
  "fade-up": {
    initial: "opacity-0 translate-y-6",
    visible: "opacity-100 translate-y-0",
  },
  scale: {
    initial: "opacity-0 scale-95",
    visible: "opacity-100 scale-100",
  },
};

export function AnimatedSection({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  as: Component = "div",
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const styles = animationStyles[animation];

  return (
    <Component
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible ? styles.visible : styles.initial,
        className
      )}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Component>
  );
}
