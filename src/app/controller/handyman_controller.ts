import type { Request, Response } from "express";
import { db } from "../../config/config";
import { service, handyman, service_handyman, service_order_handyman, service_order } from "../../db/schema/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, validationErrorResponse } from "../../helper/reponse";
import { handymanToCart } from "../../helper/validation";

export class HandymanController {
  async getServiceWithHandyman(req: Request, res: Response) {
    try {
      const serviceId = Number(req.params.id);
      if (isNaN(serviceId)) return errorResponse(res, 400, "Invalid service ID");

      const serviceResult = await db.select().from(service).where(eq(service.id, serviceId));
      const s = serviceResult[0];
      if (!s) return errorResponse(res, 404, "Service not found");

      const handymen = await db
        .select()
        .from(handyman)
        .leftJoin(service_handyman, eq(handyman.id, service_handyman.handyman_id))
        .where(eq(service_handyman.service_id, serviceId))
        .orderBy(handyman.priority);

      const craftman = handymen.map((h) => ({
        id: h.handyman.id,
        name: h.handyman.name,
        description: h.handyman.description,
        skill: h.handyman.description,              
      }));

      return successResponse(res, {
        price: s.price,
        service: s.service,
        craftman
      }, "Service with craftman fetched successfully");

    } catch (err) {
      console.error(err);
      return errorResponse(res, 500, "Internal server error");
    }
  }

   async addHandymanToCart(req: Request, res: Response) {
    try {
      const parsed = handymanToCart.safeParse(req.body);
      if (!parsed.success) return validationErrorResponse(res, parsed.error);

      const { issue_descriiption, address, total_price, start_date, session, handyman, image } = parsed.data;

      const serviceId = Number(req.params.id);
      if (isNaN(serviceId)) return errorResponse(res, 400, "Invalid service ID");

      const serviceResult = await db.select().from(service).where(eq(service.id, serviceId));
      const s = serviceResult[0];
      if (!s) return errorResponse(res, 404, "Service not found");

      const userId = (req as any).user.id;

      const [newOrder] = await db.insert(service_order).values({
        total_price,
        session: Number(session),
        issue_image_path: image,
        start_date: new Date(start_date),
        issue_description: issue_descriiption,
        order_id: null,
        user_id: userId
      }).returning({ id: service_order.id });

      if (handyman.length > 0) {
        await db.insert(service_order_handyman).values(
          handyman.map(h => ({
            service_order_id: newOrder?.id,
            handyman_id: h.handyman_id
          }))
        );
      }

      return successResponse(res, {}, "Service order created successfully");

    } catch (err) {
      console.error(err);
      return errorResponse(res, 500, "Internal server error");
    }
  }
}
