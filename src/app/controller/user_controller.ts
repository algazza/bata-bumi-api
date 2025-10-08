import type { Request, Response } from "express";
import { db } from "../../config/config";
import { address, users } from "../../db/schema/schema";
import { eq } from "drizzle-orm";
import { UserDTO } from "../../helper/validation";
import { errorResponse, successResponse, validationErrorResponse } from "../../helper/reponse";
import { pusher } from "../../config/pusher";

export class UserController {

  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const userResult = await db.select().from(users).where(eq(users.id, userId));
      const user = userResult[0];

      if (!user) return errorResponse(res, 404, "User not found");

      const userAddresses = await db.select().from(address).where(eq(address.id, user.address_id!));

      const result = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: userAddresses.map((a) => ({
          address: a.address,
          city: a.city,
          zip_code: a.zip_code,
        })),
      };

      return successResponse(res, result, "User fetched successfully");
    } catch (err) {
      console.error(err);
      return errorResponse(res, 500, "Internal server error");
    }
  }
}
