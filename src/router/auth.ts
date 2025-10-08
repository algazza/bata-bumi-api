import express from "express";
import { AuthController } from "../app/controller/auth_controller";
import authMiddleware  from "../app/middleware/auth_middleware";

const router = express.Router();
const authController = new AuthController();

router.post("/login", (req, res) => authController.login(req, res));
router.post("/register", (req, res) => authController.register(req, res));
router.post("/logout",  authMiddleware, (req, res) => authController.logout(req, res));




export default router;