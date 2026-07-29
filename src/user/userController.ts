import { NextFunction, Request, Response } from "express";

const createUser = async (req:Request, res:Response, next:NextFunction) => {
    // Implementation for creating a new user
    res.json({ message: "User registered successfully" })
};

export { createUser};