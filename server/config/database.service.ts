// External Dependencies

import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";
import * as rdf from "rdflib";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

dotenv.config({path: ".env"});

const mongoURL = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;

const client: mongoDB.MongoClient = new mongoDB.MongoClient(mongoURL);

await client.connect();

export let db: mongoDB.Db;

async function initialiseDatabase() {
    const odrlDoc = await db.collection('ontologies').findOne({name: "ODRL+DPV", isDefault: true});
    if (!odrlDoc) {
        const graph = rdf.graph();

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const filePath = path.resolve(
            __dirname,
            "ODRL+DPV.json"
        );

        const fileContent: string = await fs.readFile(filePath, "utf8");

        const labelsFilePath = path.resolve(
            __dirname,
            "ODRL_DPV_labels.json"
        );

        const labelsFileContent: string = await fs.readFile(labelsFilePath, "utf8");
        
        if (fileContent && labelsFileContent) {
            await new Promise<void>((resolve, reject) => {
                rdf.parse(
                    fileContent,
                    graph,
                    "http://example.org/",
                    "application/ld+json",
                    (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                    }
                );
            });
            await new Promise<void>((resolve, reject) => {
                rdf.parse(
                    labelsFileContent,
                    graph,
                    "http://example.org/",
                    "application/ld+json",
                    (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                    }
                );
            });
        }
        else{
            console.error("Could not parse ontology.");
            return;
        }

        const graphContent = rdf.serialize(rdf.sym("http://example.org/"), graph, "http://example.org/", 'application/ld+json', undefined, {flags: 'o'} );
        const content = graphContent !== undefined ? JSON.parse(graphContent) : {};

        const ontologyId = new mongoDB.ObjectId();
        
        const ontologyData = {
            _id: ontologyId,
            name: "ODRL+DPV",
            description: '',
            content: content,
            filename: '',
            uploadedBy: '',
            uploadedAt: '',
            isDefault: true,
        };

        await db.collection('ontologies').insertOne(ontologyData);
        console.log("DB initialised with default ontologies.");
    }
    else{
        console.log("Default ontologies found in DB.");
    }
}

export async function connectToDatabase() {
    db = client.db(process.env.DB_NAME);
    console.log(`Initiating MongoDB at ${mongoURL}`);

    initialiseDatabase();
    
}