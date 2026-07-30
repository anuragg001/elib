import { NextFunction, Request, Response } from "express";

const createBook = async (req: Request, res: Response, next: NextFunction) => {

    //get the data  i.e formData  (we already handled by multer in the router)



    // console.log("files",req.files ); //form data

    res.json({ message: "Book created successfully" });
}

export { createBook };