export type ShippingAddress =  {
  firstName: string;
  lastName: string;
  address: string; // House/Flat No, Building, Street
  landmark?: string;
  city: string;
  state: string; // Crucial for tax and logistics
  pincode: string;
  phone?: string;
  email?:string
}

