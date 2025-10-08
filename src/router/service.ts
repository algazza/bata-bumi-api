import express from "express";
import authMiddleware  from "../app/middleware/auth_middleware";
import { ServiceController } from "../app/controller/service_controller";

const router = express.Router();
const serviceController = new ServiceController();

router.get("/",authMiddleware, (req, res) => serviceController.getAll(req, res));




export default router;