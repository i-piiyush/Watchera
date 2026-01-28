"use client";

import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { Product, ProductVariant } from "@/types/product";
import { ApiResponse } from "@/types/apiResponse";

// UI Components
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator"; // Ensure you have this shadcn component
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

import { Star, ArrowLeft, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { ProductReviews } from "@/components/ProductReview";
import { productRating } from "@/utils/productRating";
import AddToCartButton from "@/components/AddToCartButton";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { handleAddToCart } from "@/utils/handleAddToCart";

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
  const [count, setCount] = React.useState(0);

  const { loading, user } = useAuthStore();
  const router = useRouter();
  const { addItem } = useCartStore();

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
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
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
      <div className="h-screen flex items-center justify-center text-zinc-500 font-light">
        Product not found.
      </div>
    );
  }

  const isOutOfStock = selectedVariant.stock <= 0;
  const currentImages = selectedVariant.images;
  const hasDiscount =
    product.discountedPrice && product.discountedPrice < product.price;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price - product.discountedPrice!) / product.price) * 100
      )
    : 0;

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans pb-24 lg:pb-0">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="container mx-auto px-4 h-14 flex items-center">
            <Link
            href="/products"
            className="inline-flex items-center text-xs font-medium uppercase tracking-widest text-zinc-500 hover:text-black transition-colors"
            >
            <ArrowLeft className="w-3 h-3 mr-2" /> Back
            </Link>
        </div>
      </div>

      <div className="container mx-auto px-0 md:px-6 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-16">
          
          {/* LEFT COLUMN: Image Gallery */}
          {/* Removed padding on mobile to allow edge-to-edge images for immersive feel */}
          <div className="lg:col-span-7 flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start h-fit">
            <div className="relative bg-zinc-50 lg:rounded-sm overflow-hidden">
                <Carousel setApi={setApi} className="w-full">
                <CarouselContent>
                    {currentImages.map((img, index) => (
                    <CarouselItem key={img.fileId || index}>
                        <div className="relative aspect-[3/4] md:aspect-square lg:aspect-[4/5] w-full flex items-center justify-center">
                        <img
                            src={img.url}
                            alt={`${product.name} - view ${index + 1}`}
                            className="h-full w-full object-cover mix-blend-multiply"
                        />
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                
                {/* Desktop Arrows */}
                {currentImages.length > 1 && (
                    <div className="hidden lg:block">
                        <CarouselPrevious className="left-4 bg-white/50 hover:bg-white border-none" />
                        <CarouselNext className="right-4 bg-white/50 hover:bg-white border-none" />
                    </div>
                )}
                </Carousel>

                {/* Mobile/Desktop Image Counter */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-medium tracking-widest uppercase shadow-sm">
                    {current} / {count}
                </div>

                {/* Badges on Image */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {hasDiscount && (
                        <Badge className="bg-red-600 text-white border-none rounded-none px-3 py-1 text-[10px] tracking-widest uppercase">
                            Sale
                        </Badge>
                    )}
                    {isOutOfStock && (
                        <Badge variant="secondary" className="bg-zinc-900 text-white rounded-none px-3 py-1 text-[10px] tracking-widest uppercase">
                            Sold Out
                        </Badge>
                    )}
                </div>
            </div>

            {/* Desktop Thumbnails */}
            <div className="hidden lg:grid grid-cols-6 gap-3">
              {currentImages.map((img, idx) => (
                <button
                  key={img.fileId || idx}
                  onClick={() => api?.scrollTo(idx)}
                  className={cn(
                    "relative aspect-square overflow-hidden bg-zinc-50 transition-all border border-transparent",
                    current === idx + 1
                      ? "border-black opacity-100"
                      : "opacity-60 hover:opacity-100"
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

          {/* RIGHT COLUMN: Details */}
          <div className="lg:col-span-5 flex flex-col px-4 md:px-0 pt-8 lg:pt-0">
            <div className="space-y-8">
              
              {/* Header Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight text-zinc-900 font-serif">
                    {product.name}
                    </h1>
                     {/* Rating - Hidden on tiny screens, visible on md+ */}
                    <div className="hidden md:flex items-center gap-1.5 bg-zinc-50 px-3 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-black text-black" />
                        <span className="text-sm font-medium">{productRating(product)}</span>
                        <span className="text-xs text-zinc-400">({product.reviewCount})</span>
                    </div>
                </div>

                <div className="flex items-baseline gap-4">
                  {hasDiscount ? (
                    <>
                      <span className="text-2xl font-medium text-zinc-900">
                        {formatPrice(product.discountedPrice!)}
                      </span>
                      <span className="text-lg text-zinc-400 line-through font-light">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 uppercase tracking-wide">
                        {discountPercentage}% Off
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-medium text-zinc-900">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              </div>

              <Separator className="bg-zinc-100" />

              {/* Description */}
              <div className="prose prose-zinc prose-sm max-w-none text-zinc-500 font-light leading-7">
                <p>{product.description}</p>
              </div>

              {/* Variants */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-900">
                  Select Finish: <span className="text-zinc-500 font-light normal-case ml-1">{selectedVariant.color}</span>
                </span>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.color}
                      onClick={() => handleVariantChange(variant)}
                      className={cn(
                        "h-10 px-6 border text-xs uppercase tracking-wider transition-all duration-300 min-w-[4rem]",
                        selectedVariant.color === variant.color
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-900"
                      )}
                    >
                      {variant.color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden lg:flex flex-col gap-3 pt-6">
                <AddToCartButton
                  isOutOfStock={isOutOfStock}
                  onClick={() =>
                    handleAddToCart({
                    product:product,
                    variant:selectedVariant,
                    addItem
                    })
                  }
                />
                 {/* Trust Badges / Extra Info */}
                 <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="flex items-center gap-3 p-3 bg-zinc-50/50 border border-zinc-100">
                         <div className="w-2 h-2 rounded-full bg-green-500" />
                         <span className="text-[10px] uppercase tracking-wider text-zinc-500">Authenticity Guaranteed</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50/50 border border-zinc-100">
                         <div className="w-2 h-2 rounded-full bg-zinc-400" />
                         <span className="text-[10px] uppercase tracking-wider text-zinc-500">Free Shipping</span>
                    </div>
                 </div>
              </div>

               {/* Mobile Review Summary (since we hid the top one) */}
               <div className="md:hidden flex items-center justify-between py-4 border-t border-b border-zinc-50">
                    <span className="text-sm font-medium">Reviews</span>
                    <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-black text-black" />
                        <span className="text-sm font-medium">{productRating(product)}</span>
                        <span className="text-xs text-zinc-400">({product.reviewCount})</span>
                        <ChevronRight className="w-4 h-4 text-zinc-300" />
                    </div>
               </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-12 lg:mt-16">
                 <h2 className="text-xl font-light tracking-tight mb-8">Customer Reviews</h2>
                 <ProductReviews productId={uid} />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 p-4 lg:hidden safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex gap-4 items-center">
             <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Total</span>
                <span className="font-medium text-zinc-900">
                    {hasDiscount ? formatPrice(product.discountedPrice!) : formatPrice(product.price)}
                </span>
             </div>
             <div className="flex-1">
                <AddToCartButton
                    isOutOfStock={isOutOfStock}
                    onClick={() =>
                        handleAddToCart({
                        product,
                        
                        variant: selectedVariant,
                        addItem,
                       
                        })
                    }
                />
             </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductPage;