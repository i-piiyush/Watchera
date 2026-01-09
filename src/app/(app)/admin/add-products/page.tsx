"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios, { AxiosError } from "axios";
// Added ImagePlus icon for the empty state
import { Loader2, X, ImagePlus } from "lucide-react"; 

// Data & Types
import { createProductSchema } from "@/app/schemas/addProductSchema";
import { auth } from "@/firebase/client";
import { ApiResponse } from "@/types/apiResponse";
import { Product } from "@/types/product";

// Custom Components
import ImageUploader from "@/components/imageUploader/imageUploader";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";


type Image = {
  url: string;
  fileId: string;
};

const AddProducts = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
 

  const form = useForm<z.infer<typeof createProductSchema>>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: undefined, // Better for number inputs to start undefined or empty string so placeholder shows
      stock: undefined,
    },
  });

  const onSubmit = async (data: z.infer<typeof createProductSchema>) => {
    if (images.length === 0) {
     toast.error("Please upload at least one product image.");
      return;
    }

    try {
      setLoading(true);
      // Ensure auth is ready before getting token
      if(!auth.currentUser) {
         toast.error("You must be logged in to perform this action.");
          return;
      }
      const token = await auth.currentUser.getIdToken();

      await axios.post<ApiResponse<Product>>(
        "/api/admin/add-product",
        { ...data, images },
        { headers: { Authorization: `Bearer ${token}` }}
      );

   toast.success("Product added successfully!");
      form.reset();
      setImages([]);

    } catch (error) {
      const err = error as AxiosError<ApiResponse<null>>;
     toast.error(
        err.response?.data.message || "An error occurred while adding the product."
      );
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (fileId: string) => {
    setImages((prev) => prev.filter((img) => img.fileId !== fileId));
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 ">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create Product</CardTitle>
          <CardDescription>
            Add a new item to your inventory. Fill out the details below.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* --- IMPROVED Image Upload Section --- */}
              <div className="space-y-4">
                <FormLabel className="text-base">Product Gallery</FormLabel>
                
                {/* The "Dropzone" Container */}
                <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col gap-4 items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors ${images.length === 0 ? 'py-12' : ''}`}>
                  
                  {/* The Upload Trigger Component */}
                  <div className={images.length === 0 ? "scale-110 transition-transform" : ""}>
                     <ImageUploader
                      onUpload={(image) => setImages((prev) => [...prev, image])}
                    />
                  </div>

                  {/* Empty State Message */}
                  {images.length === 0 && (
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm font-medium">Click button above to upload</p>
                      <p className="text-xs">Supports JPG, PNG. At least 1 required.</p>
                    </div>
                  )}
                  
                  {/* Image Preview Grid (shown if images exist) */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 w-full mt-2">
                      {images.map((img, i) => (
                        <div key={img.fileId} className="relative group aspect-square rounded-lg overflow-hidden border bg-background shadow-sm">
                          <img
                            src={img.url}
                            alt={`product-${i}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          {/* Remove Button with background blur */}
                          <button
                            type="button"
                            onClick={() => removeImage(img.fileId)}
                            className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* --- End Improved Section --- */}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* --- Name --- */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Rolex Submariner" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* --- Description --- */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about the product..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* --- Price --- */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        {/* Using type="number" and handling float conversion */}
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          // React Hook Form needs help with numbers in inputs
                          onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          value={field.value ?? ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* --- Stock --- */}
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                         <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                          value={field.value ?? ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- Submit Button --- */}
              <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Publishing Product...
                  </>
                ) : (
                  "Publish Product"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProducts;