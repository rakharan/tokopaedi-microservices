import { DataSource } from "typeorm";
import { Order } from "../models/Order";
import { OrderItem } from "../models/OrderItem";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306, // Maps to 3309 in Docker
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "order_db",
    entities: [Order, OrderItem], // 👈 REGISTER BOTH HERE
    synchronize: true,
    logging: process.env.NODE_ENV === "development",
    timezone: "+07:00",
});

export const connectDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("✓ Order Data Source initialized!");
        return AppDataSource;
    } catch (err) {
        console.error("❌ Error during Order Data Source initialization", err);
        throw err;
    }
};