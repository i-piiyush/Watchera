import axios, { AxiosError } from "axios";

export const fetchProducts= async ({
  pageParam = null,
}: {
  pageParam?: string | null;
}) => {
  try {
    const res = await axios.get(
      `/api/products?limit=20${pageParam ? `&cursor=${pageParam}` : ""}`
    );

    console.log(res.data)
    return res.data
  
  } catch (error) {
    const err = error as AxiosError;
    console.log("error while fetching products: ", err.response?.data);
  }
};
