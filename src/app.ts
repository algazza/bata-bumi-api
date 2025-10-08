import express from "express";
import dotenv from "dotenv";
import userRouter from "./router/user";
import serviceController from "./router/service";
import handymanController from "./router/handyman";
import authRouter from "./router/auth";


dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter)
app.use("/api/service", serviceController)
app.use("/api/handyman", handymanController)

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
