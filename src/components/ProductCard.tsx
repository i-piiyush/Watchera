import { Product } from "@/types/product";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Star, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { productRating } from "@/utils/productRating";
import AddToCartButton from "./AddToCartButton";
import { handleAddToCart } from "@/utils/handleAddToCart";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.variants[0]?.images[0]?.url;
  const inStock = product.variants[0]?.stock > 0;

  // Check if there is a valid discount
  const hasDiscount =
    product.discountedPrice && product.discountedPrice < product.price;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link href={`/products/${product.uid}`} className="block h-full">
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
            {/* Sale Badge */}
            {hasDiscount && inStock && (
              <Badge className="bg-red-600 hover:bg-red-600 text-white rounded-sm shadow-sm font-medium text-[10px] tracking-wider uppercase">
                Sale
              </Badge>
            )}

            {/* Top Rated Badge */}
            {productRating(product) > 4.5 && (
              <Badge
                variant="secondary"
                className="bg-white/90 text-black rounded-sm backdrop-blur-sm shadow-sm font-normal text-[10px] tracking-wider uppercase"
              >
                Top Rated
              </Badge>
            )}

            {/* Out of Stock Badge */}
            {!inStock && (
              <Badge
                variant="destructive"
                className="rounded-sm text-[10px] uppercase tracking-wider"
              >
                Out of Stock
              </Badge>
            )}
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
            {/* Price Logic */}
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <>
                  <p className="font-semibold text-zinc-900 text-sm">
                    {formatPrice(product.discountedPrice!)}
                  </p>
                  <p className="text-xs text-zinc-400 line-through decoration-zinc-400">
                    {formatPrice(product.price)}
                  </p>
                </>
              ) : (
                <p className="font-semibold text-zinc-900 text-sm">
                  {formatPrice(product.price)}
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 text-zinc-500">
              <Star className="w-3 h-3 fill-zinc-900 text-zinc-900" />
              <span className="text-xs font-medium">
                {productRating(product)}
              </span>
              <span className="text-[10px] text-zinc-400">
                ({product.reviewCount})
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 font-light mt-2 capitalize">
            {product.variants.length}{" "}
            {product.variants.length > 1 ? "Styles" : "Style"} Available
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
