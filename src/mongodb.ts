import db, { MongoClient } from "mongodb"

const mongoConfig = {
    mongo_url: `mongodb://${import.meta.env.MONGO_USER}:${import.meta.env.MONGO_PASSWORD}@${import.meta.env.MONGO_HOST}:${import.meta.env.MONGO_PORT}`,
} 

const client = new MongoClient(mongoConfig.mongo_url)
const mongo = client.connect()

try {
    const authenticated = await client.connect();
    if (authenticated) {
        console.log('User is authenticated');
    }
    else {
        console.log('User is not authenticated');
    }
} catch (error) {
    console.error('Failed to initialise adapter:', error);
}

export default mongo