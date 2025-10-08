import { db } from "../../config/config";
import { service_order, users } from "../schema/schema";
import { faker } from "@faker-js/faker";
import { seedServiceOrderHandyman } from "./service_order_handyman";
import { seedOrders } from "./order";
import { eq } from "drizzle-orm";

export async function seedServiceOrder() {
  const allUsers = await db.select().from(users);

  for (let i = 0; i < 30; i++) {
    const userItem = faker.helpers.arrayElement(allUsers);

    // Insert service_order dulu tanpa order_id
    const inserted = await db.insert(service_order).values({
      total_price: faker.number.int({ min: 100_000, max: 1_000_000 }),
      session: faker.number.int({ min: 1, max: 5 }),
      issue_image_path: faker.image.urlLoremFlickr({ category: "technics", width: 200, height: 200 }),
      start_date: faker.date.future(),
      issue_description: faker.lorem.sentence(8),
      user_id: userItem.id,
      order_id: undefined,
    }).returning();

    // Ambil ID dari hasil insert
    const serviceOrderId = inserted[0]?.id;

    // Seed handyman untuk service_order ini
    await seedServiceOrderHandyman(serviceOrderId || 0);

    // Buat order baru
    const orderId = await seedOrders();

    // Update service_order dengan orderId
    await db.update(service_order)
      .set({ order_id: orderId })
      .where(eq(service_order.id, serviceOrderId));

    console.log(`ServiceOrder ${serviceOrderId} sudah terhubung dengan Order ${orderId}`);
  }

  console.log("Seeder ServiceOrder selesai!");
}
