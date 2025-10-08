import { db } from "../../config/config";
import { orders } from "../schema/schema";
import { faker } from "@faker-js/faker";
import { seedPayment } from "./payment";

export async function seedOrders(): Promise<number> {

  const paymentId = await seedPayment();

  const [inserted] = await db.insert(orders).values({
    total_price: faker.number.int({ min: 100_000, max: 1_000_000 }),
    status: "pending",
    order_unique_id: faker.string.uuid(), 
    payment_id: paymentId,
    created_at: new Date(),
  }).returning({ id: orders.id });

  console.log("Seeder Orders selesai!", inserted?.id);
  return inserted?.id || 0;
}
