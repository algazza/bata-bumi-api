import { seedAddress } from "./address";
import { seedHandyman } from "./handyman";
import { seedReview } from "./review";
import { seedService } from "./service";
import { seedServiceOrder } from "./service_order";
import { seedUsers } from "./user";


async function seed() {
    await seedAddress()
    await seedUsers()
    await seedService()
    await seedHandyman()
    await seedServiceOrder()
    await seedReview()
}

await seed()