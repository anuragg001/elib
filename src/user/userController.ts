import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {

    //validation 
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        const error = createHttpError(400, "Name, email, and password are required");
        return next(error);
    }


    try {
        //db call
        //process the request to create a new user
        const user = await userModel.findOne({ email: email });

        if (user) {
            const error = createHttpError(409, "User with this email already exists");
            return next(error);
        }
    } catch (error) {
        const httpError = createHttpError(500, "Internal Server Error");
        return next(httpError);
    }

    let newUser: User;
    try {
        // now store the user 
        const hashedPassword = await bcrypt.hash(password, 10)

        newUser = await userModel.create({
            name,
            email,
            password: hashedPassword
        })

    } catch (error) {
        const httpError = createHttpError(500, "Internal Server Error");
        return next(httpError);
    }


    try {
        // token generation logic can be added here if needed JWT
        const token = sign({ sub: newUser._id }, config.jwtSecret as string, { expiresIn: '7d' });
        //response
        res.status(201).json({ accessToken: token });

    } catch (error) {
        const httpError = createHttpError(500, "Internal Server Error");
        return next(httpError);
    }


};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const {email, password} = req.body;

    if(!email || !password){
        const error = createHttpError(400, "Email and password are required");
        return next(error);
    }

    let user: User | null;
    try {
         user = await userModel.findOne({email: email});
        if(!user){
            const error = createHttpError(401, "Invalid email or password");
            return next(error);
        }
        
    } catch (error) {
        const httpError = createHttpError(500, "Internal Server Error");
        return next(httpError);
    }

    // now check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        const error = createHttpError(401, "Invalid email or password");
        return next(error);
    }

    try {
        //creata a new accesTOoekn
        const token = sign({sub: user._id}, config.jwtSecret as string, {expiresIn: '7d'});
        res.status(200).json({accessToken: token});
        
    } catch (error) {
        const httpError = createHttpError(500, "Internal Server Error");
        return next(httpError);
    }
}

export { createUser, loginUser };