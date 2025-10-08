import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import jwtConfig from "../../config/jwt";
import { errorResponse } from "../../helper/reponse";

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return errorResponse(res, 401, "Unauthorized: No token provided");
  }

  const token: string = authHeader.split(" ")[1]!;

  try {
    const user = jwt.verify(token, jwtConfig.secret) as any;
    (req as any).user = user; 
    next();
  } catch (err) {
    return errorResponse(res, 401, "Unauthorized: Invalid or expired token");
  }
}
