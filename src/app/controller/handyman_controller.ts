import type { Request, Response } from "express";
import { db } from "../../config/config";
import { service, handyman, service_handyman, service_order_handyman, service_order, orders, payment } from "../../db/schema/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { successResponse, errorResponse, validationErrorResponse } from "../../helper/reponse";
import { handymanToCart, updateStatusPaymenValidate } from "../../helper/validation";
import { randomUUID } from "crypto";

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

  async getCartByUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return errorResponse(res, 401, "Unauthorized");

      const orders = await db
        .select({
          id: service_order.id,
          total_price: service_order.total_price,
          issue_description: service_order.issue_description,
        })
        .from(service_order)
        .where(and(eq(service_order.user_id, userId), isNull(service_order.order_id)));

      if (orders.length === 0)
        return successResponse(res, [], "No service orders found");

      const result = [];

      for (const order of orders) {
        const handymanList = await db
          .select({
            handyman_id: handyman.id,
            name: handyman.name,
          })
          .from(handyman)
          .leftJoin(
            service_order_handyman,
            eq(handyman.id, service_order_handyman.handyman_id)
          )
          .where(eq(service_order_handyman.service_order_id, order.id));

        let serviceName = "Unknown";

        if (handymanList.length > 0) {
          const firstHandymanId = handymanList[0].handyman_id;

          const serviceData = await db
            .select({
              service: service.service,
            })
            .from(service)
            .leftJoin(
              service_handyman,
              eq(service.id, service_handyman.service_id)
            )
            .where(eq(service_handyman.handyman_id, firstHandymanId));

          if (serviceData.length > 0) {
            serviceName = serviceData[0].service;
          }
        }

        result.push({
          id: order.id,
          total_price: order.total_price,
          service: serviceName,
          handyman: handymanList.map((h) => ({
            handyman_id: h.handyman_id,
            name: h.name,
          })),
        });
      }

      return successResponse(res, result, "Cart fetched successfully");
    } catch (err) {
      console.error(err);
      return errorResponse(res, 500, "Internal server error");
    }
  }

  async createOrder(req: Request, res: Response) {
    try {
      const { service_order_id } = req.body;
      if (!Array.isArray(service_order_id) || service_order_id.length === 0) {
        return errorResponse(res, 400, "service_order_id must be a non-empty array");
      }

      const serviceOrders = await db
        .select({
          id: service_order.id,
          total_price: service_order.total_price,
        })
        .from(service_order)
        .where(inArray(service_order.id, service_order_id));

      if (serviceOrders.length === 0) {
        return errorResponse(res, 404, "No service orders found");
      }

      const totalPrice = serviceOrders.reduce((sum, so) => sum + so.total_price, 0);

      const [newOrder] = await db
        .insert(orders)
        .values({
          total_price: totalPrice,
          status: "pending",
          order_unique_id: randomUUID(),
          created_at: new Date(),
        })
        .returning({ id: orders.id });

      const orderId = newOrder.id;

      await db
        .update(service_order)
        .set({ order_id: orderId })
        .where(inArray(service_order.id, service_order_id));

      return successResponse(res, { order_id: orderId }, "Order created successfully");
    } catch (err) {
      console.error(err);
      return errorResponse(res, 500, "Internal server error");
    }
  }

  async updateOrderStatus(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const orderId = Number(req.params.order_id);

    if (isNaN(orderId)) return errorResponse(res, 400, "Invalid order ID");
    if (!status) return errorResponse(res, 400, "Status is required");

    if (status === "accepted") {
      const [newPayment] = await db
        .insert(payment)
        .values({ status: "pending" }) 
        .returning({ id: payment.id });

      await db
        .update(orders)
        .set({
          payment_id: newPayment.id,
          status: "accepted",
        })
        .where(eq(orders.id, orderId));

      return successResponse(res, { payment_id: newPayment.id }, "Order accepted and payment created");
    }

    await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));

    return successResponse(res, {}, `Order status updated to ${status}`);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Internal server error");
  }
  }

  async getPaymentDetail(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.order_id);
      if (isNaN(orderId)) return errorResponse(res, 400, "Invalid order ID");

      const orderResult = await db
        .select({
          id: orders.id,
          total_price: orders.total_price,
          order_unique_id: orders.order_unique_id,
        })
        .from(orders)
        .where(eq(orders.id, orderId));

      const order = orderResult[0];
      if (!order) return errorResponse(res, 404, "Order not found");

      const serviceOrders = await db
        .select({
          id: service_order.id,
        })
        .from(service_order)
        .where(eq(service_order.order_id, orderId));

      if (serviceOrders.length === 0) return errorResponse(res, 404, "No service orders found for this order");

      const serviceDetails = [];
      for (const so of serviceOrders) {
        const handymen = await db
          .select({
            handyman_id: handyman.id,
          })
          .from(handyman)
          .leftJoin(
            service_order_handyman,
            eq(handyman.id, service_order_handyman.handyman_id)
          )
          .where(eq(service_order_handyman.service_order_id, so.id));

        let serviceType = "Unknown";
        if (handymen.length > 0) {
          const firstHandyman = handymen[0];
          const serviceData = await db
            .select({
              service: service.service,
            })
            .from(service)
            .leftJoin(service_handyman, eq(service.id, service_handyman.service_id))
            .where(eq(service_handyman.handyman_id, firstHandyman.handyman_id));

          if (serviceData.length > 0) {
            serviceType = serviceData[0].service;
          }
        }

        serviceDetails.push({
          service_type: serviceType,
          handyman_ammount: handymen.length.toString(),
        });
      }

      return successResponse(res, {
        order_id: order.id,
        service_order: serviceDetails,
        total_price: order.total_price,
        order_unique_id: order.order_unique_id,
      }, "Order detail fetched successfully");
    } catch (err) {
      console.error(err);
      return errorResponse(res, 500, "Internal server error");
    }
  }

  async updateStatusPayment(req: Request, res: Response) {
    try {
      const parsed = updateStatusPaymenValidate.safeParse(req.body);
      if (!parsed.success) return validationErrorResponse(res, parsed.error);

      const { status, order_id } = parsed.data;

      const orderIdNum = Number(order_id);
      if (isNaN(orderIdNum)) return errorResponse(res, 400, "Invalid order_id");

      const result = await db
        .update(payment)
        .set({ status })
        .where(eq(payment.id, orderIdNum))
        .returning({ id: payment.id, status: payment.status });

      if (result.length === 0)
        return errorResponse(res, 404, "Order not found");

      return successResponse(res, result[0], "Order status updated successfully");
    } catch (err) {
      console.error(err);
      return errorResponse(res, 500, "Internal server error");
    }
  }


}
