import bcrypt from "bcryptjs";
import { db } from "../../config/config";
import { users, address } from "../schema/schema";
import { faker } from "@faker-js/faker";

export async function seedUsers() {
  const allAddresses = await db.select().from(address);
  const hashpassword = await bcrypt.hash("12345678", 10)
  const data = Array.from({ length: 20 }).map(($i) => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: '08' + faker.string.numeric(10), 
    password: hashpassword,
    address_id: faker.helpers.arrayElement(allAddresses).id,
  }));

  for (const user of data) {
    await db.insert(users).values(user);
  }

  console.log("Seeder Users selesai!");
}
