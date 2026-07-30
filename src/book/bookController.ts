import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "fs";
import { AuthRequest } from "../middlewares/authenticate";


const createBook = async (req: Request, res: Response, next: NextFunction) => {
    //get the data  i.e formData  (we already handled by multer in the router)

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }; // Type assertion to specify the type of req.files
    const coverImageMimetype = files.coverImage?.[0].mimetype.split('/').at(-1); // Get the file extension from the mimetype

    const fileName = files.coverImage[0].filename;

    const filePath = path.resolve(__dirname, '../../public/data/uploads', fileName);



    try {
        // now upload the file to the cloduinary and get the url of the file and store it in the db
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: fileName,
            folder: 'book-covers',
            format: coverImageMimetype
        })

        const bookFileName = files.file[0].filename;
        const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName);

        const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
            resource_type: 'raw',
            filename_override: bookFileName,
            folder: 'book-pdfs',
            format: 'pdf'
        })



        console.log(uploadResult);
        console.log(bookFileUploadResult);

        const _req = req as AuthRequest; // typecast req to AuthRequest to access userId
        // now we have to make the changes in db so we can use the url of the file and store it in the db 
        const newBook = await bookModel.create({
            title: req.body.title,
            genre: req.body.genre,
            author: _req.userId,
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url
        })


        //now delete temp files taht is bneen locally created 
        await fs.promises.unlink(filePath);
        await fs.promises.unlink(bookFilePath);

        res.status(201).json({ id: newBook._id, message: "Book created successfully"  });

    } catch (error) {
        const httpError = createHttpError(500, "Failed to upload files to Cloudinary");
        return next(httpError);
    }



}

export { createBook }; 