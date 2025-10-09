import type { Request, Response } from "express";
import { db } from "../../config/config";
import { service, handyman, service_handyman, service_order_handyman, service_order, orders, payment, job_proggres, review, handyman_histories } from '../../db/schema/schema';
import { and, eq, inArray, isNull } from "drizzle-orm";
import { successResponse, errorResponse, validationErrorResponse } from '../../helper/reponse';
import { handymanJobHistoriesValidate, handymanToCart, jobProggressValidate, reviewHandyman, updateStatusPaymenValidate } from "../../helper/validation";
import { randomUUID } from "crypto";

export class HandymanController {
  async getServiceWithHandyman(req: Request, res: Response) {
    try {
      const serviceId = Number(req.params.id);
      if (isNaN(serviceId)) errorResponse(res, 400, "Invalid service ID");

      const serviceResult = await db.select().from(service).where(eq(service.id, serviceId));
      const s = serviceResult[0];
      if (!s) errorResponse(res, 404, "Service not found");

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

      successResponse(res, {
        price: s.price,
        service: s.service,
        craftman
      }, "Service with craftman fetched successfully");

    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }

   async addHandymanToCart(req: Request, res: Response) {
    try {
      const parsed = handymanToCart.safeParse(req.body);
      if (!parsed.success) {         
        validationErrorResponse(res, parsed.error)
        return;
      }

      const { issue_descriiption, address, total_price, start_date, session, handyman, image } = parsed.data;

      const serviceId = Number(req.params.id);
      if (isNaN(serviceId)) errorResponse(res, 400, "Invalid service ID");

      const serviceResult = await db.select().from(service).where(eq(service.id, serviceId));
      const s = serviceResult[0];
      if (!s) errorResponse(res, 404, "Service not found");

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

      successResponse(res, {}, "Service order created successfully");

    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }

  async getCartByUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) errorResponse(res, 401, "Unauthorized");

      const orders = await db
        .select({
          id: service_order.id,
          total_price: service_order.total_price,
          issue_description: service_order.issue_description,
        })
        .from(service_order)
        .where(and(eq(service_order.user_id, userId), isNull(service_order.order_id)));

      if (orders.length === 0)
        successResponse(res, [], "No service orders found");

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

      successResponse(res, result, "Cart fetched successfully");
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }

  async createOrder(req: Request, res: Response) {
    try {
      const { service_order_id } = req.body;
      if (!Array.isArray(service_order_id) || service_order_id.length === 0) {
        errorResponse(res, 400, "service_order_id must be a non-empty array");
      }

      const serviceOrders = await db
        .select({
          id: service_order.id,
          total_price: service_order.total_price,
        })
        .from(service_order)
        .where(inArray(service_order.id, service_order_id));

      if (serviceOrders.length === 0) {
        errorResponse(res, 404, "No service orders found");
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

      successResponse(res, { order_id: orderId }, "Order created successfully");
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }

  async updateOrderStatus(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const orderId = Number(req.params.order_id);

    if (isNaN(orderId)) errorResponse(res, 400, "Invalid order ID");
    if (!status) errorResponse(res, 400, "Status is required");

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

      successResponse(res, { payment_id: newPayment.id }, "Order accepted and payment created");
    }

    await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));

    successResponse(res, {}, `Order status updated to ${status}`);
  } catch (err) {
    console.error(err);
    errorResponse(res, 500, "Internal server error");
  }
  }

  async getPaymentDetail(req: Request, res: Response) {
    try {
      const orderId = Number(req.params.order_id);
      if (isNaN(orderId)) errorResponse(res, 400, "Invalid order ID");

      const orderResult = await db
        .select({
          id: orders.id,
          total_price: orders.total_price,
          order_unique_id: orders.order_unique_id,
        })
        .from(orders)
        .where(eq(orders.id, orderId));

      const order = orderResult[0];
      if (!order) errorResponse(res, 404, "Order not found");

      const serviceOrders = await db
        .select({
          id: service_order.id,
        })
        .from(service_order)
        .where(eq(service_order.order_id, orderId));

      if (serviceOrders.length === 0) errorResponse(res, 404, "No service orders found for this order");

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

      successResponse(res, {
        order_id: order.id,
        service_order: serviceDetails,
        total_price: order.total_price,
        order_unique_id: order.order_unique_id,
      }, "Order detail fetched successfully");
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }

  async updateStatusPayment(req: Request, res: Response) {
    try {
      const parsed = updateStatusPaymenValidate.safeParse(req.body);
      if (!parsed.success) {         
        validationErrorResponse(res, parsed.error)
        return;
      }

      const { status, order_id } = parsed.data;

      const orderIdNum = Number(order_id);
      if (isNaN(orderIdNum)) errorResponse(res, 400, "Invalid order_id");

      const result = await db
        .update(payment)
        .set({ status })
        .where(eq(payment.id, orderIdNum))
        .returning({ id: payment.id, status: payment.status });

      if (result.length === 0)
        errorResponse(res, 404, "Order not found");

      successResponse(res, result[0], "Order status updated successfully");
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }

  async addHandymanJobProggress(req: Request, res:Response){   
     try {
        const serviceOrderId = Number(req.params.service_order_id);
        if (isNaN(serviceOrderId)) errorResponse(res, 400, "Invalid service order ID");

        const parsed = jobProggressValidate.safeParse(req.body);
        if (!parsed.success){         
            validationErrorResponse(res, parsed.error)
            return;
          }

        const { description, finish, image_path, handyman_id} = parsed.data

        await db.insert(job_proggres).values({
          image_path: image_path,
          description: description,
          finish: finish,
          created_at: new Date(),
          handyman_id: handyman_id,
          service_order_id: serviceOrderId
        })

        successResponse(res, {}, "success add progress")
      }catch(err){
        console.log(err)
        errorResponse(res, 500, "Internal  error");
      } 
  }

  async getDataHandymanJobProggress(req: Request, res:Response){
    try{
      const serviceOrderId = Number(req.params.service_order_id);
      if (isNaN(serviceOrderId))
        errorResponse(res, 400, "Invalid service order ID");

      const data = await db
        .select({
          id: job_proggres.id,
          image_path: job_proggres.image_path,
          description: job_proggres.description,
          finish: job_proggres.finish,
          date_time: job_proggres.created_at,
        })
        .from(job_proggres)
        .where(eq(job_proggres.service_order_id, serviceOrderId));

      if (data.length === 0) {
        successResponse(res, [], "No progress found for this service order");
      }
      
      successResponse(res, data, "Job progress fetched successfully");
    }catch(err){
      errorResponse(res, 500, "Internal server error")
    }
  }

  async   handymanReview(req: Request, res: Response){
    try{
      const userId = (req as any).user?.id;
      if (!userId) errorResponse(res, 401, "Unauthorized");
  
      const serviceOrderId = Number(req.params.service_order_id);
      if (isNaN(serviceOrderId)) errorResponse(res, 400, "Invalid service order ID");
      const handymanId = Number(req.params.handyman_id);
      if (isNaN(handymanId)) errorResponse(res, 400, "Invalid handyman ID");
  
      const parsed = reviewHandyman.safeParse(req.body);
      if (!parsed.success) {         
        validationErrorResponse(res, parsed.error)
        return;
      }
  
      const {rate, description} = parsed.data
      
      await db.insert(review).values({
        rate: rate,
        description: description,
        user_id: userId,
        handyman_id: handymanId,
        service_order_id: serviceOrderId
      })

      successResponse(res, {}, "success add review on handyman")
    }catch(err){
      console.log(err)
      errorResponse(res, 500, "Internal server error")
    }
  }

  async  getHandymanDetail(req: Request, res: Response) {
  try {
    const handymanId = Number(req.params.handyman_id);
    if (isNaN(handymanId)) errorResponse(res, 400, "Invalid handyman ID");

    const [handymanData] = await db
      .select()
      .from(handyman)
      .where(eq(handyman.id, handymanId));

    if (!handymanData) errorResponse(res, 404, "Handyman not found");

    const services = await db
      .select({ name: service.service })
      .from(service_handyman)
      .innerJoin(service, eq(service_handyman.service_id, service.id))
      .where(eq(service_handyman.handyman_id, handymanId));

    const histories = await db
      .select({ description: handyman_histories.description })
      .from(handyman_histories)
      .where(eq(handyman_histories.handyman_id, handymanId));

    const reviews = await db
      .select({
        description: review.description,
        rate: review.rate
      })
      .from(review)
      .where(eq(review.handyman_id, handymanId));

    const avgRate =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rate, 0) / reviews.length
        : 0;

    const response = {
      id: handymanData.id,
      name: handymanData.name,
      rate: avgRate,
      image_path: handymanData.image_path,
      description: handymanData.description,
      priority: handymanData.priority,
      service: services.map(s => s.name),
      handyman_histories: histories,
      review: reviews
    };

    successResponse(res, response, "Success get handyman detail");
    } catch (err) {
      console.error(err);
      errorResponse(res, 500, "Internal server error");
    }
  }  

  async handymanJobHistories(req: Request, res:Response){
    try{
      const handymanId = Number(req.params.handyman_id);
      if (isNaN(handymanId)) errorResponse(res, 400, "Invalid handyman ID"); 
  
      const parsed = handymanJobHistoriesValidate.safeParse(req.body);
      if (!parsed.success) {         
        validationErrorResponse(res, parsed.error)
        return;
      }
      const {description} = parsed.data
  
      await db.insert(handyman_histories).values({
        description: description,
        handyman_id: handymanId
      })
  
      successResponse(res, {}, "Success add job histories detail");
    }catch(err){
      console.log(err)
      errorResponse(res, 500, "Internal server error");
    }

  }
}
