import { Product, ProductVariant } from "@/types/product";

export const handleAddToCart = ({
  product,
  variant,
  addItem,
}: {
  product: Product | null;
  variant: ProductVariant | null;
  addItem: (item: {
    productId: string;
    variantColor: string;
    quantity: number;
    priceSnapshot: number;
  }) => void;
}) => {
  // ----------------------
  // Safety checks
  // ----------------------
  if (!product || !variant) {
    console.error("❌ Product or variant missing");
    return;
  }

  if (variant.stock <= 0) {
    console.warn("❌ Tried to add out-of-stock item");
    return;
  }

  // ----------------------
  // Prepare cart item
  // ----------------------
  const cartItem = {
    productId: product.uid,
    variantColor: variant.color,
    quantity: 1,
    priceSnapshot: product.discountedPrice ?? product.price,
  };


  addItem(cartItem);
  
};
