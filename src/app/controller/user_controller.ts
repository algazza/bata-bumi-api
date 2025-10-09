import type { Request, Response } from "express";
import { db } from "../../config/config";
import { address, users } from '../../db/schema/schema';
import { eq } from "drizzle-orm";
import { UserDTO } from "../../helper/validation";
import { errorResponse, successResponse, validationErrorResponse } from "../../helper/reponse";
import bcrypt from "bcryptjs";

export class UserController {

  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const userResult = await db.select().from(users).where(eq(users.id, userId));
      const user = userResult[0];

      if (!user) errorResponse(res, 404, "User not found");

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

      successResponse(res, result, "User fetched successfully");
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }


  async updateUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const parsed = UserDTO.safeParse(req.body);
      if (!parsed.success) {
        validationErrorResponse(res, parsed.error);
        return;
      }

      const { name, email, password, phone } = parsed.data;
      const hashedPassword = await bcrypt.hash(password, 10);

      await db
        .update(users)         
        .set({ name: name,
               email: email,
               password: hashedPassword,
               phone: phone }) 
        .where(eq(users.id, userId))     

      successResponse(res, {}, "User updated user data successfully");
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Failed to update user");
    }
  }

}
