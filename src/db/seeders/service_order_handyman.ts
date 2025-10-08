import { db } from "../../config/config";
import { handyman, service, service_handyman, service_order_handyman } from "../schema/schema";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";

export async function seedServiceOrderHandyman(serviceOrderId: number) {
  const allServices = await db.select().from(service);
  if (allServices.length === 0) return;

  const chosenService = faker.helpers.arrayElement(allServices);
  const eligibleHandymans = await db
    .select({ id: handyman.id })
    .from(handyman)
    .innerJoin(
      service_handyman,
      eq(service_handyman.handyman_id, handyman.id) 
    )
    .where(eq(service_handyman.service_id, chosenService.id));

  if (eligibleHandymans.length === 0) return;
  const selectedHandymans = faker.helpers.arrayElements(
    eligibleHandymans,
    faker.number.int({ min: 1, max: Math.min(3, eligibleHandymans.length) })
  );

  for (const h of selectedHandymans) {
    await db.insert(service_order_handyman).values({
      service_order_id: serviceOrderId,
      handyman_id: h.id,
    });
  }

  console.log(`ServiceOrder ${serviceOrderId} dibuat dengan service ${chosenService.service} dan ${selectedHandymans.length} handyman`);
}
