export type CartItem = {
  productId: string
  variantColor: string
  quantity: number
  priceSnapshot: number 
}

export type CartViewItem = {
  productId: string;
  name: string;
  variantColor: string;
  quantity: number;
  priceSnapshot: number;
  image: string;
  stock: number;
};