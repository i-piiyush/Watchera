"use client";

import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { Product, ProductVariant } from "@/types/product";
import { ApiResponse } from "@/types/apiResponse";

// UI Components
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

import { Star, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { ProductReviews } from "@/components/ProductReview";
import { productRating } from "@/utils/productRating";




const ViewProductPage = ({ params }: { params: Promise<{ uid: string }> }) => {
  const { uid } = React.use(params);

  // Data State
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  // Carousel State
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  const { loading } = useAuthStore();

  // 1. Fetch Data
  useEffect(() => {
    if (loading) return;
    const fetchProduct = async () => {
      try {
        const res = await axios.get<ApiResponse<Product>>(
          `/api/products/${uid}`
        );
        const productData = res.data?.data;

        if (productData) {
          setProduct(productData);
          if (productData.variants && productData.variants.length > 0) {
            setSelectedVariant(productData.variants[0]);
          }
        }
      } catch (error) {
        const err = error as AxiosError<ApiResponse<null>>;
        console.error(err.response?.data.message);
      } finally {
        setProductLoading(false);
      }
    };

    fetchProduct();
  }, [uid, loading]);

  // 2. Sync Carousel
  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // 3. Variant Logic
  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (api) {
      api.scrollTo(0, true);
    }
  };

 
  

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (productLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-white">
        <Spinner className="text-zinc-900 size-6" />
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <div className="h-screen flex items-center justify-center">
        Product not found.
      </div>
    );
  }

  const isOutOfStock = selectedVariant.stock <= 0;
  const currentImages = selectedVariant.images;

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans animate-in fade-in duration-700">
      {/* Back Link */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-zinc-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collection
        </Link>
      </div>

      <div className="container mx-auto px-4 md:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* LEFT COLUMN: Image Gallery */}
          <div className="lg:col-span-7 flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start h-fit">
            <Carousel setApi={setApi} className="w-full group">
              <CarouselContent>
                {currentImages.map((img, index) => (
                  <CarouselItem key={img.fileId || index}>
                    <div className="relative aspect-[4/5] lg:aspect-square lg:max-h-[600px] w-full overflow-hidden bg-zinc-50 rounded-sm flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={`${product.name} - view ${index + 1}`}
                        className="h-full w-full object-contain mix-blend-multiply"
                      />
                      <div className="absolute top-4 left-4 z-10">
                        {isOutOfStock ? (
                          <Badge
                            variant="destructive"
                            className="rounded-full tracking-wider uppercase text-[10px]"
                          >
                            Sold Out
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-white/90 backdrop-blur text-zinc-900 rounded-full tracking-wider uppercase text-[10px]"
                          >
                            In Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {currentImages.length > 1 && (
                <>
                  <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 bg-white/80 border-0 hover:bg-white text-black" />
                  <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 bg-white/80 border-0 hover:bg-white text-black" />
                </>
              )}
            </Carousel>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-4 px-1">
              {currentImages.map((img, idx) => (
                <button
                  key={img.fileId || idx}
                  onClick={() => api?.scrollTo(idx)}
                  className={cn(
                    "relative aspect-square overflow-hidden bg-zinc-50 rounded-sm transition-all",
                    current === idx
                      ? "ring-1 ring-black ring-offset-2 opacity-100"
                      : "opacity-70 hover:opacity-100"
                  )}
                >
                  <img
                    src={img.url}
                    alt="Thumbnail"
                    className="h-full w-full object-cover mix-blend-multiply"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Details & Reviews */}
          <div className="lg:col-span-5 flex flex-col gap-8 pt-2">
            {/* --- PRODUCT DETAILS --- */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-light tracking-tight text-zinc-900">
                  {product.name}
                </h1>

                <div className="flex items-center justify-between">
                  <p className="text-2xl font-medium text-zinc-900">
                    {formatPrice(product.price)}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-sm font-medium text-zinc-900">
                      {productRating(product)}
                    </span>
                    <span className="text-xs text-zinc-500 ml-1">
                      ({product.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm text-zinc-500 leading-relaxed font-light">
                <p>{product.description}</p>
              </div>

              {/* Variant Selector */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-zinc-900 tracking-wide">
                  Select Finish
                </span>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.color}
                      onClick={() => handleVariantChange(variant)}
                      className={cn(
                        "px-4 py-2 border text-sm transition-all min-w-[3rem] capitalize rounded-sm",
                        selectedVariant.color === variant.color
                          ? "border-black bg-black text-white"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      )}
                    >
                      {variant.color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  className="w-full h-12 text-sm uppercase tracking-widest font-medium rounded-sm"
                  size="lg"
                  disabled={isOutOfStock}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  {isOutOfStock ? "Notify Me When Available" : "Add to Cart"}
                </Button>
              </div>
            </div>

            {/* --- REVIEWS SECTION --- */}
            <ProductReviews productId={uid} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductPage;