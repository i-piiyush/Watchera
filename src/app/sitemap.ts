import { MetadataRoute } from "next";
import { adminDb } from "@/firebase/admin"; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.chhabragifts.in";

  // 1. Static Routes (Jo aapke project me actually exist karte hain)
  const staticRoutes = [
    "",           // Home Page (src/app/page.tsx)
    "/products",  // Products List (src/app/(app)/products/page.tsx)
    // "/about",  // ❌ Screenshot me nahi dikha, isliye hata diya
    // "/contact" // ❌ Screenshot me nahi dikha, isliye hata diya
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8, // Home page ki priority sabse zyada
  }));

  // 2. Dynamic Products (Firebase se)
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const snapshot = await adminDb.collection("products").get();
    
    productRoutes = snapshot.docs.map((doc) => ({
      // Note: Aapka folder structure 'products' hai, toh URL '/products/ID' hoga
      url: `${baseUrl}/products/${doc.id}`, 
      lastModified: new Date(), // Agar aapke paas updatedAt field hai toh wo use karein
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Sitemap error:", error);
  }

  // Sirf ye public pages Google ko bheje jayenge
  return [...staticRoutes, ...productRoutes];
}