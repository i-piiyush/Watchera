export type Reply = {
  userId: string;
  content: string;
  createdAt: number;
};

export type Review = {
  userId: string;        // author uid
  rating: number;        // 1–5
  content: string;
  replies: Reply[];
  likes: number;
  createdAt: number;
};
