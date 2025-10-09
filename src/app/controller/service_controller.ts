import { like } from "drizzle-orm";
import { db } from "../../config/config";
import { service } from "../../db/schema/schema";
import { errorResponse, successResponse } from "../../helper/reponse";
import type { Request, Response } from "express";

export class ServiceController {
  async getAll(req: Request, res: Response) {
    try {
      const { title } = req.query as { title?: string };

      const services = await (title
        ? db.select().from(service).where(like(service.service, `%${title}%`))
        : db.select().from(service)
      );

      const result = services.map((s) => ({
        id: s.id,
        service: s.service,
        description: s.description,
      }));

      successResponse(res, { service: result }, "Services fetched successfully");
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }
}
