import { db } from "../../config/config";
import { handyman, service, service_handyman, disable_date, handyman_histories } from "../schema/schema";
import { faker } from "@faker-js/faker";

export async function seedHandyman() {
  // Ambil semua service dari DB
  const allServices = await db.select().from(service);

  // Ambil semua disable_date id
  const allDisableDates = await db.select({ id: disable_date.id }).from(disable_date);

  for (let i = 0; i < 50; i++) {
    // Pilih random 1 service sebagai priority
    const priorityService = faker.helpers.arrayElement(allServices);

    // Pilih random 1 disable date
    const disable = allDisableDates.length > 0 
    ? faker.helpers.arrayElement(allDisableDates)
    : null;


    // Buat handyman
    const handymanInsert = await db.insert(handyman).values({
      name: faker.person.fullName(),
      image_path: faker.image.urlLoremFlickr({ category: "person", width: 200, height: 200 }),
      description: faker.lorem.sentences(2).slice(0, 150),
      priority: priorityService.id,
      disable_id: disable?.id,
    }).returning({ id: handyman.id });

    const handymanId = handymanInsert[0]?.id;

    // Pilih 3 skill random dari service (bisa termasuk priority)
    const skills = faker.helpers.arrayElements(allServices, 3);
    for (const s of skills) {
      await db.insert(service_handyman).values({
        handyman_id: handymanId,
        service_id: s.id,
      });
    }

    // Tambahkan 1–3 histories per handyman
    const historyCount = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < historyCount; j++) {
      await db.insert(handyman_histories).values({
        handyman_id: handymanId,
        description: faker.lorem.sentence(10), // deskripsi panjang
      });
    }
  }

  console.log("Seeder Handyman + Histories selesai!");
}
