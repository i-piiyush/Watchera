export interface Product {
  uid: string;                // doc id
  name: string;
  description: string;
  price: number;
  stock: number;

  images: {
    url: string;
    fileId: string;          // ImageKit file id (important for delete)
  }[];

  avgRating: number;         // 0–5 (cached)
  reviewCount: number;

  createdAt: number;
  updatedAt: number;
}
