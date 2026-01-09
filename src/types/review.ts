export interface Review {
  userId: string;
  rating: number; // 1–5
  title: string; // short summary
  description: string; // detailed review
  createdAt: number;
}
