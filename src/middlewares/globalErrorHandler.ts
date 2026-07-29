import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { config } from "../config/config";

// global error handler  always needs to be the last middleware
 const globalErrorHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        message: err.message || "Internal Server Error",
        errorStack: config.env === "development" ? err.stack : "",

    })
};

export default globalErrorHandler;