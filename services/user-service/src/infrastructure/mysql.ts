import { DataSource } from "typeorm";
import { User } from "../models/User";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, `../.env`) });

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "user_db",
    // In a microservice, entities are usually explicitly imported to avoid glob path issues in build
    entities: [User],
    synchronize: true,
    logging: process.env.NODE_ENV === "development",
    timezone: "+07:00",
});

export const connectDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");
        return AppDataSource;
    } catch (err) {
        console.error("Error during Data Source initialization", err);
        throw err;
    }
};