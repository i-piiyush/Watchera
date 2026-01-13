import { Product } from "@/types/product"

 export const productRating = (product:Product)=>{

    if(product.reviewCount === 0) return 0

    const ans = product.ratingSum / product.reviewCount
    const avg = Number(ans.toFixed(1))

    return avg

  }
  