"use client";

import { useEffect, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useProducts();

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

  if (isLoading) return <p>Loading products...</p>;

  return (
    <>
      <div className="grid grid-cols-4 gap-6">
        {data?.pages.map((page) =>
          page.data.map((product: any) => (
            <ProductCard key={product.uid} product={product} />
          ))
        )}
      </div>

      {hasNextPage && (
        <div
          ref={loadMoreRef}
          className="h-10 flex justify-center items-center"
        >
          {isFetchingNextPage && <p>Loading more...</p>}
        </div>
      )}
    </>
  );
}
