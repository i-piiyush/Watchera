"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner"; // Assuming you have this from previous code


interface AddToCartButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOutOfStock?: boolean;
  isLoading?: boolean;
  compact?: boolean; // For use in Product Cards (smaller)
}

const AddToCartButton = ({
  isOutOfStock = false,
  isLoading = false,
  compact = false,
  className,
  onClick,
  ...props
}: AddToCartButtonProps) => {

    




  return (
    <Button
      onClick={onClick}
      disabled={isOutOfStock || isLoading || props.disabled}
      className={cn(
        "group relative w-full overflow-hidden rounded-sm font-medium uppercase tracking-widest transition-all duration-300",
        // Default Luxury Style (Black)
        "bg-zinc-900 text-white hover:bg-zinc-800",
        // Disabled State Style
        "disabled:bg-zinc-700 disabled:text-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-100",
        // Size Variants
        compact ? "h-10 text-[10px]" : "h-12 text-xs md:text-sm",
        className
      )}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading ? (
        <Spinner className={cn("mr-2", compact ? "size-3" : "size-4")} />
      ) : isOutOfStock ? (
        // Out of Stock Icon
        <Bell className={cn("mr-2", compact ? "size-3" : "size-4")} />
      ) : (
        // Default Cart Icon
        <ShoppingBag className={cn("mr-2", compact ? "size-3" : "size-4")} />
      )}

      {/* Text Logic */}
      <span>
        {isLoading
          ? "Adding..."
          : isOutOfStock
          ? "Notify Me"
          : compact
          ? "Quick Add"
          : "Add to Cart"}
      </span>
    </Button>
  );
};

export default AddToCartButton;