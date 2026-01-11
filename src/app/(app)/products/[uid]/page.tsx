"use client";

import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { Product, ProductVariant } from "@/types/product";
import { ApiResponse } from "@/types/apiResponse";

// UI Components
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Label } from "@/components/ui/label";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

import { Star, ShoppingBag, Truck, ShieldCheck, ArrowLeft, ThumbsUp, MessageSquare, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// --- INITIAL DATA ---
const INITIAL_REVIEWS = [
  {
    id: 1,
    user: "Aarav P.",
    avatar: "",
    rating: 5,
    time: "2 weeks ago",
    content: "Absolutely stunning timepiece. The finish is even better in person than in the photos. It feels heavy and premium on the wrist. Worth every rupee.",
    likes: 24,
  },
  {
    id: 2,
    user: "Sarah Jenkins",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    rating: 4,
    time: "1 month ago",
    content: "Great watch, minimalist and elegant. The delivery was super fast (arrived in 2 days). Deducting one star because the strap was a bit stiff initially, but it softened up after a week.",
    likes: 8,
  },
  {
    id: 3,
    user: "Vikram Singh",
    avatar: "",
    rating: 5,
    time: "2 months ago",
    content: "Classy. I wear it to meetings and get compliments all the time. The unboxing experience was also very luxury.",
    likes: 12,
  },
];

const ViewProductPage = ({ params }: { params: Promise<{ uid: string }> }) => {
  const { uid } = React.use(params);

  // Data State
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Review & Auth State (Demo)
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // DEMO STATE
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);

  // Carousel State
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  // 1. Fetch Data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get<ApiResponse<Product>>(`/api/products/${uid}`);
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
        setLoading(false);
      }
    };
    fetchProduct();
  }, [uid]);

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
    if(api) {
        api.scrollTo(0, true);
    }
  };

  // 4. Handle Post Review
  const handlePostReview = () => {
    if (!newReviewText.trim()) return;

    const newReview = {
        id: Date.now(),
        user: "You (Demo User)",
        avatar: "https://github.com/shadcn.png", // Demo Avatar
        rating: newReviewRating,
        time: "Just now",
        content: newReviewText,
        likes: 0,
    };

    setReviews([newReview, ...reviews]);
    setNewReviewText("");
    setNewReviewRating(5);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-white">
        <Spinner className="text-zinc-900 size-6" />
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return <div className="h-screen flex items-center justify-center">Product not found.</div>;
  }

  const isOutOfStock = selectedVariant.stock <= 0;
  const currentImages = selectedVariant.images;

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans animate-in fade-in duration-700">
      
      {/* Back Link */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Link href="/products" className="inline-flex items-center text-sm text-zinc-500 hover:text-black transition-colors">
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
                                        <Badge variant="destructive" className="rounded-full tracking-wider uppercase text-[10px]">Sold Out</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-white/90 backdrop-blur text-zinc-900 rounded-full tracking-wider uppercase text-[10px]">In Stock</Badge>
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
                  <img src={img.url} alt="Thumbnail" className="h-full w-full object-cover mix-blend-multiply" />
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
                            <span className="text-sm font-medium text-zinc-900">{product.avgRating}</span>
                            <span className="text-xs text-zinc-500 ml-1">({product.reviewCount} reviews)</span>
                        </div>
                    </div>
                </div>

                <div className="prose prose-sm text-zinc-500 leading-relaxed font-light">
                    <p>{product.description}</p>
                </div>

                {/* Variant Selector */}
                <div className="space-y-3">
                    <span className="text-sm font-medium text-zinc-900 tracking-wide">Select Finish</span>
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
            <div className="pt-8">
                {/* Header with Demo Toggle */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-light flex items-center gap-2">
                        Reviews <span className="text-zinc-400 text-lg">{reviews.length}</span>
                    </h3>

                    {/* DEMO: Logged In Toggle */}
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="demo-mode" className="text-xs text-zinc-400">Demo: {isLoggedIn ? 'User' : 'Guest'}</Label>
                        <button 
                            onClick={() => setIsLoggedIn(!isLoggedIn)}
                            className={cn(
                                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
                                isLoggedIn ? "bg-black" : "bg-zinc-200"
                            )}
                        >
                            <span className={cn(
                                "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                isLoggedIn ? "translate-x-5" : "translate-x-1"
                            )} />
                        </button>
                    </div>
                </div>

                {/* ADD REVIEW INPUT */}
                <div className="mb-10">
                    {isLoggedIn ? (
                        <div className="flex gap-4 animate-in fade-in slide-in-from-top-2">
                            <Avatar className="w-10 h-10 border border-zinc-100">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>ME</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                                <div className="space-y-1">
                                    <p className="text-xs text-zinc-500 ml-1">Rate this product</p>
                                    <div className="flex text-zinc-200">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button 
                                                key={star} 
                                                onClick={() => setNewReviewRating(star)}
                                                className="focus:outline-none"
                                            >
                                                <Star className={cn("w-5 h-5 transition-colors", star <= newReviewRating ? "fill-yellow-500 text-yellow-500" : "hover:text-yellow-400")} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={newReviewText}
                                        onChange={(e) => setNewReviewText(e.target.value)}
                                        placeholder="Add a public review..."
                                        className="w-full min-h-[80px] text-sm text-zinc-900 bg-transparent border-b border-zinc-200 focus:border-black focus:outline-none resize-none py-2 placeholder:text-zinc-400"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <Button 
                                            onClick={handlePostReview}
                                            disabled={!newReviewText.trim()}
                                            className="h-8 rounded-full text-xs px-6"
                                        >
                                            Post
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-sm border border-zinc-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-zinc-200 p-2 rounded-full text-zinc-500">
                                    <UserCircle2 className="w-5 h-5" />
                                </div>
                                <p className="text-sm text-zinc-600">Please log in to share your thoughts.</p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-8"
                                onClick={() => setIsLoggedIn(true)} // Auto log in for demo
                            >
                                Log In
                            </Button>
                        </div>
                    )}
                </div>

                {/* REVIEW LIST */}
                <div className="space-y-8">
                    {reviews.map((review) => (
                        <div key={review.id} className="flex gap-4 group animate-in fade-in duration-500">
                            {/* Avatar */}
                            <Avatar className="w-10 h-10 border border-zinc-100">
                                <AvatarImage src={review.avatar} />
                                <AvatarFallback className="bg-zinc-100 text-zinc-600 text-sm font-medium">
                                    {review.user.charAt(0)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Content */}
                            <div className="flex-1 space-y-1.5">
                                {/* Header */}
                                <div className="flex items-center gap-2 text-sm">
                                    <span className={cn(
                                        "font-semibold px-2 py-0.5 rounded-full text-xs",
                                        review.user.includes("You") ? "bg-black text-white" : "text-zinc-900 bg-zinc-100"
                                    )}>
                                        @{review.user.replace(/\s/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')}
                                    </span>
                                    <span className="text-zinc-400 text-xs">•</span>
                                    <span className="text-zinc-500 text-xs">{review.time}</span>
                                </div>

                                {/* Rating Stars (Small) */}
                                <div className="flex text-yellow-500">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={cn("w-3 h-3", i < review.rating ? "fill-current" : "text-zinc-200 fill-zinc-200")} />
                                    ))}
                                </div>

                                {/* Comment */}
                                <p className="text-zinc-700 text-sm leading-relaxed">
                                    {review.content}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center gap-4 pt-1">
                                    <button className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors group/btn">
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium">{review.likes}</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium">Reply</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* View More Button */}
                <div className="mt-8 text-center">
                    <Button variant="outline" className="rounded-full px-6 text-xs uppercase tracking-wider h-9">
                        Load More Reviews
                    </Button>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductPage;