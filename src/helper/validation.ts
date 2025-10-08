import { z } from "zod";

export const UserDTO = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).strict();

export const authLogin = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(3, "Password must be at least 3 characters"),
}).strict();

export const authRegister = z.object({
  name: z.string().min(3, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(6, "Phone number must be at least 6 characters"),
  password: z.string().min(3, "Password must be at least 3 characters"),
}).strict();


export const handymanToCart = z.object({
  issue_descriiption: z.string().min(1, "Issue description is required"),
  address: z.string().min(1, "Address is required"),
  total_price: z.number().nonnegative("Total price must be 0 or greater"),
  start_date: z.string().min(1, "Start date is required"),
  session: z.string().min(1, "Session is required"),
  handyman: z.array(
    z.object({
      handyman_id: z.number().int().nonnegative("Handyman ID must be 0 or greater"),
      name: z.string().min(1, "Handyman name is required"),
    })
  ).min(1, "At least one handyman must be provided"),
  image: z.string().min(1, "Image is required"),
});