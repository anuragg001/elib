import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";

const createUser = async (req: Request, res: Response, next: NextFunction) => {

    //validation 
    const { name, email, password } = req.body;

    if(!name || !email || !password) {
        const error = createHttpError(400, "Name, email, and password are required");
        return next(error);
    }

    //db call
    //process the request to create a new user
    const user = await userModel.findOne({ email: email });

    if(user){
        const error = createHttpError(409, "User with this email already exists");
        return next(error);
    }
    // now store the user 
    const hashedPassword = await bcrypt.hash(password,10)

    const newUser = await userModel.create({
        name,
        email,
        password: hashedPassword
    })

    // token generation logic can be added here if needed JWT


    //response
    res.json({id: newUser._id});
};

export { createUser };