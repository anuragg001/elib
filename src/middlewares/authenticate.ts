import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { verify } from "jsonwebtoken";
import { config } from "../config/config";


export interface AuthRequest extends Request {
    userId: string;
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization');

    if (!token) {
        const error = createHttpError(401, "Unauthorized: No token provided");
        return next(error);
    }

    const parsedToken = token.split(' ')[1];


    try {
        //verify the token 
        const decoded = verify(parsedToken, config.jwtSecret as string);
        console.log(decoded);
        
        const _req = req as AuthRequest;
        _req.userId = decoded.sub as string;
        
        next();
    } catch (error) {
        const httpError = createHttpError(401, "Unauthorized: Invalid token");
        return next(httpError);
    }


}

export default authenticate;