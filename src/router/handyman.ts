import express from "express";
import authMiddleware  from "../app/middleware/auth_middleware";
import { HandymanController } from "../app/controller/handyman_controller";

const router = express.Router();
const serviceController = new HandymanController();

router.get("/:id",authMiddleware, (req, res) => serviceController.getServiceWithHandyman(req, res));
router.post("/:id",authMiddleware, (req, res) => serviceController.addHandymanToCart(req, res));





export default router;