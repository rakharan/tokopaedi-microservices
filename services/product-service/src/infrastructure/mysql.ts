import { DataSource } from "typeorm";
import { Product } from "../models/Product";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "product_db",
    entities: [Product],
    synchronize: true,
    logging: process.env.NODE_ENV === "development",
    timezone: "+07:00",
});

export const connectDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Product Data Source initialized!");
        return AppDataSource;
    } catch (err) {
        console.error("Error during Data Source initialization", err);
        throw err;
    }
};