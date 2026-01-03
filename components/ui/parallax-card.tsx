"use client";

import React, { useRef, useEffect, useCallback } from "react";

interface ParallaxCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tilt?: number; // max tilt degrees
  scale?: number; // hover scale
  children?: React.ReactNode;
}

export default function ParallaxCard({ tilt = 8, scale = 1.02, className = "", children, ...props }: ParallaxCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);
  const bounds = useRef<DOMRect | null>(null);

  const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleMove = useCallback((e: PointerEvent) => {
    if (!ref.current || prefersReduced) return;
    if (!bounds.current) bounds.current = ref.current.getBoundingClientRect();
    const b = bounds.current;

    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;

    const rotateY = (x - 0.5) * tilt * -1;
    const rotateX = (y - 0.5) * tilt;

    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
      ref.current.style.transition = `transform 180ms cubic-bezier(.2,.9,.2,1)`;
    });
  }, [tilt, scale, prefersReduced]);

  const handleLeave = useCallback(() => {
    if (!ref.current) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    ref.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    ref.current.style.transition = `transform 360ms cubic-bezier(.2,.9,.2,1)`;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced) return;
    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerleave", handleLeave);
    el.addEventListener("pointercancel", handleLeave);
    el.addEventListener("blur", handleLeave as any);

    const onResize = () => { bounds.current = el.getBoundingClientRect(); };
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerleave", handleLeave);
      el.removeEventListener("pointercancel", handleLeave);
      window.removeEventListener("resize", onResize);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [handleMove, handleLeave, prefersReduced]);

  return (
    <div
      ref={ref}
      {...props}
      className={`will-change-transform transform-gpu ${className}`}
      tabIndex={0}
      aria-hidden={false}
    >
      {children}
    </div>
  );
}
