import { Product } from "@/types/product";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Star, ShoppingBag } from "lucide-react"; // Assuming you have lucide-react (standard with shadcn)
import Link from "next/link";
import { productRating } from "@/utils/productRating";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.variants[0]?.images[0]?.url;
  const inStock = product.variants[0]?.stock > 0;

  // Format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link href={`/products/${product.uid}`} className="block h-full">
      {" "}
      <Card className="group relative border-none shadow-none bg-transparent hover:bg-zinc-50/50 transition-colors duration-300 rounded-none">
        {/* Image Section */}
        <CardContent className="p-0 relative overflow-hidden bg-zinc-100/50">
          <AspectRatio ratio={1 / 1.1}>
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 mix-blend-multiply"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-zinc-100 text-zinc-400">
                No Image
              </div>
            )}
          </AspectRatio>

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {/* Example logic for "New" or "Best Seller" - customizable */}
            {productRating(product) > 4.5 && (
              <Badge
                variant="secondary"
                className="bg-white/90 text-black rounded-sm backdrop-blur-sm shadow-sm font-normal text-[10px] tracking-wider uppercase"
              >
                Top Rated
              </Badge>
            )}
            {!inStock && (
              <Badge
                variant="destructive"
                className="rounded-sm text-[10px] uppercase tracking-wider"
              >
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Quick Action Button - Appears on Hover */}
          <div className="absolute bottom-4 left-0 right-0 px-4 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <Button
              className="w-full bg-black text-white hover:bg-zinc-800 rounded-sm h-10 tracking-wide uppercase text-xs"
              disabled={!inStock}
            >
              <ShoppingBag className="w-3 h-3 mr-2" />
              {inStock ? "Quick Add" : "Sold Out"}
            </Button>
          </div>
        </CardContent>

        {/* Details Section */}
        <CardFooter className="flex flex-col items-start p-4 gap-1">
          <div className="flex justify-between items-start w-full">
            <h3 className="font-medium text-base text-zinc-900 leading-tight line-clamp-1 group-hover:underline decoration-zinc-400 underline-offset-4 decoration-1 transition-all">
              {product.name}
            </h3>
          </div>

          <div className="flex justify-between items-center w-full mt-1">
            <p className="font-semibold text-zinc-900 text-sm">
              {formatPrice(product.price)}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1 text-zinc-500">
              <Star className="w-3 h-3 fill-zinc-900 text-zinc-900" />
              <span className="text-xs font-medium">{productRating(product)}</span>
              <span className="text-[10px] text-zinc-400">
                ({product.reviewCount})
              </span>
            </div>
          </div>

          {/* Variant/Color indicator */}
          <p className="text-xs text-zinc-400 font-light mt-2 capitalize">
            {product.variants.length}{" "}
            {product.variants.length > 1 ? "Styles" : "Style"} Available
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}