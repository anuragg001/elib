import { NextFunction, Request, Response } from "express";

const createBook = async (req: Request, res: Response, next: NextFunction) => {


    




    res.json({ message: "Book created successfully" });
}

export { createBook };