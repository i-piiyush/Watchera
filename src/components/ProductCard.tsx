import { Product } from "@/types/product";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow transition">
      <img
        src={product.images[0]?.url}
        alt={product.name}
        className="h-40 w-full object-cover rounded mb-3"
      />

      <h3 className="font-medium">{product.name}</h3>
      <p className="text-sm text-gray-500">₹{product.price}</p>
    </div>
  );
}
