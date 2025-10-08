import { db } from "../../config/config";
import { service } from "../schema/schema";

export async function seedService() {
  const data = [
    { 
      service: "keramik", 
      price: 100000, 
      description: "Pemasangan keramik berkualitas tinggi dengan finishing halus, cocok untuk lantai dan dinding rumah." 
    },
    { 
      service: "kaca", 
      price: 120000, 
      description: "Pemasangan kaca tempered dan laminated untuk jendela, pintu, atau sekat ruangan dengan hasil rapi dan aman." 
    },
    { 
      service: "cat", 
      price: 80000, 
      description: "Pengecatan interior dan eksterior menggunakan cat premium, memastikan warna merata dan tahan lama." 
    },
    { 
      service: "plafon", 
      price: 150000, 
      description: "Pemasangan plafon gypsum atau PVC dengan desain modern, rapi, dan tahan lama." 
    },
    { 
      service: "atap", 
      price: 200000, 
      description: "Pemasangan atap rumah dengan bahan berkualitas, tahan cuaca, dan pemasangan yang aman." 
    },
  ];

  for (const item of data) {
    await db.insert(service).values(item);
  }

  console.log("Seeder Service selesai!");
}
