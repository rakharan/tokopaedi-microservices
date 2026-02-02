import { DataSource } from "typeorm";
import { Delivery } from "../models/Delivery"; // Assuming you renamed entities -> models
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "tokopaedi_delivery",
    entities: [Delivery],
    synchronize: true, // Auto-create tables (Dev only)
    logging: false,
});