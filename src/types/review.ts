export interface Review {
  userId: string;
  user:string,
  avatar:string
  rating: number; // 1–5
  content:string,
  likes:number
  createdAt: number;
}
