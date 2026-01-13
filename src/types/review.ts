export type Review = {
  uid: string; 
  userId: string;
  user:string;
  rating: number;
  avatar: string; 
  content: string;
  likes: number;
   likedBy?: string[]
  createdAt: number;
};