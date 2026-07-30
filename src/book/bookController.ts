import { NextFunction, Request, Response } from "express";

const createBook = async (req: Request, res: Response, next: NextFunction) => {

    //get the data  i.e formData  (we already handled by multer in the router)





    res.json({ message: "Book created successfully" });
}

export { createBook };