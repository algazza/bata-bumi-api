import { db } from "../../config/config";
import { address } from "../schema/schema";
import { faker } from "@faker-js/faker";

export async function seedAddress() {
  const data = Array.from({ length: 10 }).map(() => ({
    address: faker.location.streetAddress(),
    zip_code: Number(faker.location.zipCode({ format: '#####' })),
    city: faker.location.city(),
  }));

  for (const addr of data) {
    await db.insert(address).values(addr);
  }

  console.log("Seeder Address selesai!");
}
