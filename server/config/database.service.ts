// External Dependencies

import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

dotenv.config({path: ".env"});

const mongoURL = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;

const client: mongoDB.MongoClient = new mongoDB.MongoClient(mongoURL);

console.log("Initiating MongoDB");

await client.connect();

export const db = client.db(process.env.DB_NAME);

// Global Variables

// Initialize Connection