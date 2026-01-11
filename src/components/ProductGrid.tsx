"use client";

import { useEffect, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "./ProductCard";
import { Spinner } from "./ui/spinner";
import { Skeleton } from "./ui/skeleton";

export default function ProductGrid() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useProducts();

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  // Loading Skeleton Component
  const ProductSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-[300px] w-full rounded-none" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </div>
  );

  if (isLoading)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
        {data?.pages.map((page) =>
          page.data.map((product: any) => (
            <ProductCard key={product.uid} product={product} />
          ))
        )}
      </div>

      {hasNextPage && (
        <div
          ref={loadMoreRef}
          className="h-24 flex justify-center items-center w-full mt-10"
        >
          {isFetchingNextPage && (
            <div className="flex flex-col items-center gap-2">
               <Spinner className="text-black size-6" />
               <span className="text-xs uppercase tracking-widest text-zinc-500">Loading Timepieces</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}