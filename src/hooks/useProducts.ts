import { fetchProducts } from "@/services/product.service";
import { useInfiniteQuery } from "@tanstack/react-query";

export const useProducts = () => {
  return useInfiniteQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};
