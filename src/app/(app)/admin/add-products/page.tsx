"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Trash2, Package, Layers, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { auth } from "@/firebase/client";
import { ApiResponse } from "@/types/apiResponse";
import { Product } from "@/types/product";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Assuming you have this shadcn component
import { Separator } from "@/components/ui/separator"; // Assuming you have this shadcn component
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createProductSchemaFrontend } from "@/app/schemas/addProductSchema";
import ImageUploader from "@/components/imageUploader/imageUploader";
import { Spinner } from "@/components/ui/spinner";

/* ---------------- TYPES ---------------- */

type Image = {
  url: string;
  fileId: string;
};

type VariantForm = {
  color: string;
  stock: number;
  images: Image[];
};

/* ---------------- UTILS ---------------- */

const buildImageFolder = (productName: string, color: string) => {
  return `/watchera/products/${productName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")}/${color.toLowerCase()}`;
};

/* ---------------- COMPONENT ---------------- */

const AddProducts = () => {
  /* ---------- REACT HOOK FORM (PRODUCT ONLY) ---------- */
  const form = useForm<z.infer<typeof createProductSchemaFrontend>>({
    resolver: zodResolver(createProductSchemaFrontend),
    defaultValues: {
      name: "",
      description: "",
      price: undefined,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = form;

  /* ---------- VARIANTS STATE ---------- */
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------- VARIANT HELPERS ---------- */

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { color: "", stock: 0, images: [] },
    ]);
  };

  const updateVariant = (
    index: number,
    field: keyof VariantForm,
    value: any
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------- SUBMIT ---------- */

  const onSubmit = async (
    data: z.infer<typeof createProductSchemaFrontend>
  ) => {
    if (variants.length === 0) {
      toast.error("At least one variant is required");
      return;
    }

    for (const v of variants) {
      if (!v.color || v.images.length === 0) {
        toast.error("Each variant must have color & images");
        return;
      }
    }

    try {
      setLoading(true);

      if (!auth.currentUser) {
        toast.error("You must be logged in");
        return;
      }

      const token = await auth.currentUser.getIdToken();

      await axios.post<ApiResponse<Product>>(
        "/api/admin/add-product",
        {
          ...data,
          variants,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Product added successfully");
      reset();
      setVariants([]);
    } catch (error) {
      const err = error as AxiosError<ApiResponse<null>>;
      toast.error(err.response?.data.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
            <p className="text-muted-foreground mt-1">
              Add a new product with multiple color variants and stocks.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* LEFT COLUMN: MAIN INFO */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="size-5 text-muted-foreground" />
                    Product Details
                  </CardTitle>
                  <CardDescription>
                    Basic information about the watch.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Chronos Silver"
                        {...register("name")}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        {...register("price", { valueAsNumber: true })}
                      />
                      {errors.price && (
                        <p className="text-sm text-destructive">
                          {errors.price.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the product details..."
                      className="min-h-[120px]"
                      {...register("description")}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* VARIANTS SECTION */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="size-5 text-muted-foreground" />
                      Variants
                    </CardTitle>
                    <CardDescription>
                      Manage colors, stock levels, and images.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addVariant}
                    className="gap-2"
                  >
                    <Plus className="size-4" /> Add Variant
                  </Button>
                </CardHeader>
                
                <Separator />

                <CardContent className="pt-6 space-y-6">
                  {variants.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                      <Layers className="size-10 mx-auto mb-3 opacity-50" />
                      <p>No variants added yet.</p>
                      <p className="text-sm">Click "Add Variant" to start.</p>
                    </div>
                  ) : (
                    variants.map((variant, index) => {
                      const productName = watch("name");
                      return (
                        <div
                          key={index}
                          className="relative group border rounded-xl p-5 bg-card shadow-sm space-y-5 transition-all hover:border-primary/50"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              Variant Configuration
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive h-8 w-8"
                              onClick={() => removeVariant(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs uppercase text-muted-foreground font-bold">
                                Color Name
                              </Label>
                              <Input
                                placeholder="e.g. Midnight Blue"
                                value={variant.color}
                                onChange={(e) =>
                                  updateVariant(index, "color", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs uppercase text-muted-foreground font-bold">
                                Stock Quantity
                              </Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={variant.stock}
                                onChange={(e) =>
                                  updateVariant(
                                    index,
                                    "stock",
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-dashed">
                            <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground font-bold">
                              <ImageIcon className="size-3" /> Variant Images
                            </Label>
                            
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <ImageUploader
                                    folder={
                                        productName && variant.color
                                        ? buildImageFolder(productName, variant.color)
                                        : "/watchera/drafts"
                                    }
                                    onUpload={(img) =>
                                        updateVariant(index, "images", [
                                        ...variant.images,
                                        img,
                                        ])
                                    }
                                    />
                                </div>
                                
                                {variant.images.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 max-w-full">
                                        {variant.images.map((img) => (
                                        <div key={img.fileId} className="relative shrink-0">
                                            <img
                                            src={img.url}
                                            alt="Preview"
                                            className="h-16 w-16 rounded-md object-cover border bg-background"
                                            />
                                        </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {!productName || !variant.color ? (
                                <p className="text-[10px] text-amber-500 font-medium">
                                    * Enter Product Name and Variant Color to enable upload
                                </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: ACTIONS & SUMMARY */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between py-1">
                        <span>Variants</span>
                        <span className="font-medium text-foreground">{variants.length}</span>
                    </div>
                    <div className="flex justify-between py-1 border-t mt-2 pt-2">
                        <span>Total Stock</span>
                        <span className="font-medium text-foreground">
                            {variants.reduce((acc, curr) => acc + (curr.stock || 0), 0)}
                        </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                        <>
                        <Spinner className="mr-2 text-primary-foreground" /> Publishing...
                        </>
                    ) : (
                      "Publish Product"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProducts;