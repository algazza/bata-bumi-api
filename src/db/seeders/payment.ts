import { db } from "../../config/config";
import { payment } from "../schema/schema";

export async function seedPayment(): Promise<number> {
  const [inserted] = await db.insert(payment).values({
    status: "success", 
  }).returning({ id: payment.id });

  console.log("Seeder Payment selesai!", inserted?.id);
  return inserted?.id || 0;
}
