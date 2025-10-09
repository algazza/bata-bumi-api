import bcrypt from "bcryptjs";
import { db } from "../../config/config";
import { users } from "../../db/schema/schema";
import { errorResponse, validationErrorResponse, successResponse } from "../../helper/reponse";
import { authLogin, authRegister } from "../../helper/validation";
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const parsed = authLogin.safeParse(req.body);
      if (!parsed.success){ 
        validationErrorResponse(res, parsed.error)
        return;
      }

      const { email, password } = parsed.data;

      const userResult = await db.select().from(users).where(eq(users.email, email));
      const user = userResult[0];

      if (!user) errorResponse(res, 404, "User not found");

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) errorResponse(res, 401, "Incorrect password");

      const token = jwt.sign(
        { id: user.id, name: user.name },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: "1h" }
      );

      successResponse(
        res,
        {
          id: user.id,
          name: user.name,
          token
        },
        "Login successful"
      );
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }

  async register(req: Request, res: Response) {
    try {
      const parsed = authRegister.safeParse(req.body);
      if (!parsed.success){         
        validationErrorResponse(res, parsed.error)
        return;
      }

      const { name, email, phone, password } = parsed.data;
      const existingUser = await db.select().from(users).where(eq(users.email, email));
      if (existingUser.length > 0) errorResponse(res, 400, "Email already exists");

      const hashedPassword = await bcrypt.hash(password, 10);

      const [newUser] = await db.insert(users).values({
        name,
        email,
        phone,
        password: hashedPassword,
      }).returning({ id: users.id, name: users.name });

      const token = jwt.sign(
        { id: newUser?.id, name: newUser?.name },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: "1h" }
      );

      successResponse(
        res,
        {
          id: newUser?.id,
          name: newUser?.name,
          token
        },
        "Registration successful"
      );
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      console.log(user)
      successResponse(res, {}, "Logout successful");
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }
}