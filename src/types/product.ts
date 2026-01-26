export type ProductImage = {
  url: string;
  fileId: string;
};

export type ProductVariant = {
  color: string;            // "black", "silver" etc
  images: ProductImage[];
  stock: number;
};

export type Product = {
  uid: string;

  name: string;
  description: string;

  price: number;            // base price
  discountedPrice?: number; // OPTIONAL => only exists if discount is active

  variants: ProductVariant[];

  ratingSum: number;
  reviewCount: number;

  createdAt: number;
  updatedAt: number;
};
