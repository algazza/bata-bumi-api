import express from "express";
import { UserController } from "../app/controller/user_controller";
import authMiddleware from "../app/middleware/auth_middleware";

const router = express.Router();
const userController = new UserController();

router.get("/", authMiddleware, (req, res) => userController.getMe(req, res));
router.patch("/", authMiddleware, (req, res) => userController.updateUser(req, res));




export default router;