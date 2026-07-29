import mongoose, { mongo } from "mongoose";
import { config } from "./config";

const connectDB = async () => {

    try {
        
        mongoose.connection.on("connected", () => {
            console.log("Connected Successfully");
            
        })
        
        mongoose.connection.on("error", (err) => {
            console.log("Error while connecting to the database", err);
        })
        await mongoose.connect(config.databaseURL as string);
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1); // Exit the process with an error code
    }
}

export default connectDB;