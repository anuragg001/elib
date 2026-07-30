import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import cors from "cors";
import { config } from "./config/config";

const app = express();

app.use(cors({
    origin: config.frontendUrl,
}));  // middleware for CORS

app.use(express.json());  // middleware for json parsing 

// Routes
app.get("/", (req, res, next) => {
   
    res.json({ message: "Welcome to the API" });
})

//middleware for Router
app.use('/api/users', userRouter);
app.use('/api/books', bookRouter);


// global error handler 
app.use(globalErrorHandler);

export default app;