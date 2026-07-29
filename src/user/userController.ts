import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";

const createUser = async (req: Request, res: Response, next: NextFunction) => {

    //validation 
    const { name, email, password } = req.body;

    if(!name || !email || !password) {
        const error = createHttpError(400, "Name, email, and password are required");
        return next(error);
    }

    //db call
    const user = await userModel.findOne({ email: email });

    if(user){
        const error = createHttpError(409, "User with this email already exists");
        return next(error);
    }
    


    //process the request to create a new user


    //response





    // Implementation for creating a new user
    res.json({ message: "User registered successfully" })
};

export { createUser };