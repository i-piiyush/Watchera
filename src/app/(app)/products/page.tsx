import Navbar from '@/components/Navbar'
import ProductGrid from '@/components/ProductGrid'
import { Separator } from '@/components/ui/separator'
import React from 'react'

const Products = () => {
  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans selection:bg-black selection:text-white">
     
      
      <main className="container mx-auto px-4 md:px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-12 mt-4">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-zinc-900">
                The Collection
            </h1>
            <p className="text-zinc-500 max-w-2xl font-light text-sm md:text-base leading-relaxed">
                Discover our curated selection of premium timepieces. 
                Designed for precision, crafted for elegance.
            </p>
        </div>

        <Separator className="mb-12 bg-zinc-100" />

        <ProductGrid />
      </main>
    </div>
  )
}

export default Products