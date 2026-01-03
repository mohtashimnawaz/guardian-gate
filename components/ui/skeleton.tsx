import * as React from "react";

export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`motion-safe:animate-pulse motion-reduce:animate-none bg-muted/50 rounded ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default Skeleton;
