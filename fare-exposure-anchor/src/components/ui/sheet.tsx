"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  /** Mobile: full width; desktop: max width */
  side?: "right" | "left";
}

export function Sheet({ open, onOpenChange, title, children, className, side = "right" }: SheetProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const sideClass = side === "right" ? "right-0" : "left-0";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto border-l bg-card shadow-lg transition-transform sm:max-w-xl",
          sideClass,
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 w-8 p-0"
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </>
  );
}
