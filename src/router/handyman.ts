import express from "express";
import authMiddleware  from "../app/middleware/auth_middleware";
import { HandymanController } from "../app/controller/handyman_controller";
import { reviewHandyman } from '../helper/validation';

const router = express.Router();
const serviceController = new HandymanController();

router.get("/profile/:handyman_id", authMiddleware, (req, res) => serviceController.getHandymanDetail (req, res));
router.post("/review/:handyman_id/:service_order_id",authMiddleware, (req, res) => serviceController.handymanReview(req, res));


router.post("/proggress/:service_order_id", (req, res) => serviceController.addHandymanJobProggress (req, res));
router.get("/proggress/:service_order_id", (req, res) => serviceController.getDataHandymanJobProggress (req, res));

router.patch("/payment/update",authMiddleware, (req, res) => serviceController.updateStatusPayment (req, res));
router.get("/payment/:order_id",authMiddleware, (req, res) => serviceController.getPaymentDetail (req, res));
router.patch("/order/status/:order_id", (req, res) => serviceController.updateOrderStatus(req, res));
router.post("/order",authMiddleware, (req, res) => serviceController.createOrder(req, res));
router.post("/order",authMiddleware, (req, res) => serviceController.createOrder(req, res));
router.get("/:id",authMiddleware, (req, res) => serviceController.getServiceWithHandyman(req, res));
router.post("/:id",authMiddleware, (req, res) => serviceController.addHandymanToCart(req, res));






export default router;