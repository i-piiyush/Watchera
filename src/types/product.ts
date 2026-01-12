export type ProductImage = {
  url: string;
  fileId: string;
};

export type ProductVariant = {
  color: string;
  images: ProductImage[];
  stock: number;
};

export type Product = {
  uid: string;
  name: string;
  description: string;
  price: number;
  variants: ProductVariant[];
  ratingSum: number;
  reviewCount: number;
  createdAt: number;
  updatedAt: number;
};
