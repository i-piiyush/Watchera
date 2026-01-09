import { redirect } from "next/navigation";

const page = () => {
  redirect("/admin/add-products");

}

export default page