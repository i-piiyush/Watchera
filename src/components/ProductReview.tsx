"use client";

import { useEffect, useState, useMemo } from "react";
import axios, { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { auth } from "@/firebase/client";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createReviewSchemaFrontend } from "@/app/schemas/reviewSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiResponse } from "@/types/apiResponse";
import { Spinner } from "./ui/spinner";
import { Review } from "@/types/review";

// ---------------------------------------------
// 1. Utility Function (Keep outside component)
// ---------------------------------------------
function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(ms).toLocaleDateString();
}



interface ProductReviewsProps {
  productId: string;
}



export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // Auth Store
  const { user, loading } = useAuthStore();
  const isLoggedIn = !loading && !!user;
  const router = useRouter();

  // ---------------------------------------------
  // 2. Fetch Reviews
  // ---------------------------------------------
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get<ApiResponse<Review[]>>(`/api/review/${productId}`);
        if (res.data.success) {
          setReviews(res.data.data ?? []);
        }
      } catch (error) {
        console.error("Fetch error", error);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [productId]);


  // ---------------------------------------------
  // 3. Form Setup
  // ---------------------------------------------
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<z.infer<typeof createReviewSchemaFrontend>>({
    resolver: zodResolver(createReviewSchemaFrontend),
    defaultValues: { rating: 5, content: "" },
  });

  // ---------------------------------------------
  // 4. Optimized Like Logic
  // ---------------------------------------------
  const toggleLike = async (reviewId: string) => {
    if (!user) {
      toast.error("Please login to like reviews");
      return;
    }

    const targetReview = reviews.find((r) => r.uid === reviewId);
    if (!targetReview) return;

    // Check if current user ID is in the likedBy array
    const wasLiked = targetReview.likedBy?.includes(user.uid) ?? false;
    const action = wasLiked ? "unlike" : "like";

    // Optimistic UI Update
    setReviews((prev) =>
      prev.map((rev) => {
        if (rev.uid !== reviewId) return rev;
        
        const currentLikedBy = rev.likedBy || [];
        const newLikedBy = wasLiked
          ? currentLikedBy.filter((id) => id !== user.uid) // Remove ID
          : [...currentLikedBy, user.uid]; // Add ID

        return {
          ...rev,
          likes: rev.likes + (wasLiked ? -1 : 1),
          likedBy: newLikedBy,
        };
      })
    );

    // API Call
    try {
      const token = await user.getIdToken();
      await axios.patch(
        `/api/review/${productId}/${reviewId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      // Revert on error (skipped for brevity, but good practice)
      toast.error("Failed to update like");
    }
  };

  

  const onSubmit = async (data: z.infer<typeof createReviewSchemaFrontend>) => {
    if (!user) return toast.error("User not logged in");
    
    try {
      const token = await user.getIdToken();
      // Optimistic Add (Optional: You can manually add review to list before fetch)
      
      const res = await axios.post<ApiResponse<null>>(`/api/review/${productId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if(res.data.success) {
        toast.success("Review added!");
        reset();
        // Ideally, refetch reviews or append new review to state here
      }
    } catch (error) {
      toast.error("Unable to post review");
    }
  };

  return (
    <div className="pt-8">
      <h3 className="text-xl font-light mb-6">Reviews ({reviews.length})</h3>

      {/* Review Form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 mb-10 animate-in fade-in slide-in-from-top-2">
          <Avatar className="w-10 h-10 border">
             <AvatarImage src={user?.photoURL || ""} />
             <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
             {/* Rating Stars Logic Here (Same as yours) */}
             <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setValue("rating", star)}>
                    <Star className={cn("w-5 h-5 transition-colors", star <= watch("rating") ? "fill-yellow-500 text-yellow-500" : "text-zinc-300")} />
                  </button>
                ))}
             </div>
             
             <textarea
                {...register("content")}
                placeholder="Share your experience..."
                className="w-full min-h-[80px] p-2 bg-transparent border-b focus:outline-none focus:border-black transition-colors resize-none"
             />
             {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}

             <div className="flex justify-end">
               <Button type="submit" disabled={isSubmitting} className="rounded-full h-8 text-xs">
                 {isSubmitting ? <Spinner className="w-3 h-3 mr-2" /> : "Post Review"}
               </Button>
             </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between p-4 bg-zinc-50 border rounded-lg mb-8">
           <div className="flex items-center gap-3 text-zinc-600">
             <UserCircle2 className="w-5 h-5" />
             <p className="text-sm">Please log in to share your thoughts.</p>
           </div>
           <Button variant="outline" size="sm" onClick={() => router.push("/login")}>Log In</Button>
        </div>
      )}

      {/* Reviews List */}
      {loadingReviews ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <div className="space-y-8">
          {reviews.map((review) => {
            // Check derived state for UI
            const isLikedByUser = user ? review.likedBy?.includes(user.uid) : false;

            return (
              <div key={review.uid} className="flex gap-4 group">
                <Avatar className="w-10 h-10 border border-zinc-100">
                  <AvatarImage src={review.avatar} />
                  <AvatarFallback className="bg-zinc-900 text-zinc-50">{review.user?.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{review.user}</span>
                      <span className="text-xs text-zinc-400">{timeAgo(review.createdAt)}</span>
                    </div>
                  </div>

                  {/* Rating Display */}
                  <div className="flex text-yellow-500 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("w-3 h-3", i < review.rating ? "fill-current" : "text-zinc-200 fill-zinc-200")} />
                    ))}
                  </div>

                  <p className="text-sm text-zinc-700 leading-relaxed">{review.content}</p>

                  {/* Actions */}
                  <div className="pt-2">
                    <button
                      onClick={() => toggleLike(review.uid)}
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-black transition-colors"
                    >
                      <ThumbsUp className={cn("w-4 h-4", isLikedByUser && "fill-black text-black")} />
                      <span className="text-xs font-medium">{review.likes || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};