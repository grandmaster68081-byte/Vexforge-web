import { ReactNode } from "react";
import { useReveal } from "../lib/useReveal";

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return <div ref={ref} className={`${className} reveal ${visible ? "reveal--visible" : ""}`}>{children}</div>;
}
