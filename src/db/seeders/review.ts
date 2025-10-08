import { db } from "../../config/config";
import { review, handyman, users, service_order } from "../schema/schema";
import { faker } from "@faker-js/faker";

export async function seedReview() {
  // Ambil semua handyman
  const allHandymen = await db.select().from(handyman);

  const allUsers = await db.select().from(users);

  const allOrders = await db.select().from(service_order);

  for (const h of allHandymen) {
    // Tentukan jumlah review untuk tiap handyman (1–5)
    const reviewCount = faker.number.int({ min: 1, max: 5 });

    for (let i = 0; i < reviewCount; i++) {
      // Pilih random user
      const user = faker.helpers.arrayElement(allUsers);

      // Pilih random service_order (bisa null kalau mau)
      const order = faker.helpers.arrayElement(allOrders);

      // Insert review
      await db.insert(review).values({
        description: faker.lorem.sentences(2), // review panjang
        rate: faker.number.int({ min: 1, max: 5 }), // rate 1-5
        handyman_id: h.id,
        user_id: user.id,
        service_order_id: order?.id ?? null,
      });
    }
  }

  console.log("Seeder Review selesai!");
}
