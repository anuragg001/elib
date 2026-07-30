import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "fs";
import { AuthRequest } from "../middlewares/authenticate";


const getCloudinaryPublicId = (url: string) => {
    const urlParts = url.split('/');
    const folderName = urlParts.at(-2);
    const fileName = urlParts.at(-1) ?? "";
    const fileBaseName = fileName.split('.').slice(0, -1).join('.');

    return `${folderName}/${fileBaseName}`;
}


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

        res.status(201).json({ id: newBook._id, message: "Book created successfully" });

    } catch (error) {
        const httpError = createHttpError(500, "Failed to upload files to Cloudinary");
        return next(httpError);
    }



}

const updateBook = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { title, genre } = req.body;
        const bookId = req.params.bookId;

        const book = await bookModel.findOne({ _id: bookId });

        if (!book) {
            const httpError = createHttpError(404, "Book not found");
            return next(httpError);
        }

        //access check  of correct author
        const _req = req as AuthRequest;
        if (book.author.toString() !== _req.userId) {
            return next(createHttpError(403, "You are not authorized to update this book"));
        }

        const oldCoverImage = book.coverImage;
        const oldFile = book.file;


        //checck if image filed exist 
        const files = (req.files as { [fieldname: string]: Express.Multer.File[] } | undefined) ?? {};
        let completeCoverImage = "";

        if (files.coverImage) {
            const filename = files.coverImage[0].filename;
            const coverMimeType = files.coverImage[0].mimetype.split('/').at(-1);

            //send files to cloduinary
            const filePath = path.resolve(__dirname, '../../public/data/uploads', filename);

            completeCoverImage = filename

            const uploadResult = await cloudinary.uploader.upload(filePath, {
                filename_override: completeCoverImage,
                folder: 'book-covers',
                format: coverMimeType
            })

            completeCoverImage = uploadResult.secure_url;
            await fs.promises.unlink(filePath); // Delete the temporary file after uploading to cloudinary
        }

        // check if file fields exist
        let completeFileName = "";
        if (files.file) {
            const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', files.file[0].filename);

            const bookFileName = files.file[0].filename;
            completeFileName = bookFileName;

            const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
                resource_type: 'raw',
                filename_override: completeFileName,
                folder: 'book-pdfs',
                format: 'pdf'
            });

            completeFileName = uploadResultPdf.secure_url
            await fs.promises.unlink(bookFilePath); // Delete the temporary file after uploading to cloudinary
        }

        const updatedBook = await bookModel.findOneAndUpdate(
            {
                _id: bookId
            },
            {
                title: title,
                genre: genre,
                coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
                file: completeFileName ? completeFileName : book.file
            },
            {
                new: true
            }
        )

        const deletionResults = await Promise.allSettled([
            completeCoverImage ? cloudinary.uploader.destroy(getCloudinaryPublicId(oldCoverImage)) : Promise.resolve(null),
            completeFileName ? cloudinary.uploader.destroy(getCloudinaryPublicId(oldFile), { resource_type: 'raw' }) : Promise.resolve(null),
        ]);

        const failedDeletions = deletionResults.filter((result) => result.status === "rejected");
        if (failedDeletions.length > 0) {
            console.warn("Some old Cloudinary assets could not be deleted after update.");
        }

        res.json({ message: "Book updated successfully", book: updatedBook });
    } catch (error) {
        const httpError = createHttpError(500, "Failed to update book");
        return next(httpError);
    }



}

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // todo : add pagination
        const books = await bookModel.find();

        res.json({ books });
    } catch (error) {
        const httpError = createHttpError(500, "Failed to list books");
        return next(httpError);
    }
}


const getSingleBook = async (req: Request, res: Response, next: NextFunction) => {

    const bookId = req.params.bookId;

    try {

        const book = await bookModel.findOne({ _id: bookId });

        if (!book) {
            const httpError = createHttpError(404, "Book not found");
            return next(httpError);
        }

        res.json({ book });
    } catch (error) {
        const httpError = createHttpError(500, "Failed to get book");
        return next(httpError);
    }

}

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
    const bookId = req.params.bookId;

    try {
        const book = await bookModel.findOne({ _id: bookId });
        if (!book) {
            const httpError = createHttpError(404, "Book not found");
            return next(httpError);
        }

        //checck if the user is the author of the book
        const _req = req as AuthRequest;
        if (book.author.toString() !== _req.userId) {
            const httpError = createHttpError(403, "You are not authorized to delete this book");
            return next(httpError);
        }


        //https://res.cloudinary.com/nxweygya/image/upload/v1785432441/book-covers/zemxw1rryzhzvye4b4qp.jpg
        // in the form of this we need to get the book id 

        const coverFileSplits = book.coverImage.split('/');
        const coverImagePublicId = coverFileSplits.at(-2) + '/' + (coverFileSplits.at(-1)?.split('.').at(-2));
        // console.log(coverImagePublicId);


        const bookFileSplits = book.file.split('/');
        const bookFilePublicId = bookFileSplits.at(-2) + '/' + bookFileSplits.at(-1);
        // console.log(bookFilePublicId);

        try {
            await cloudinary.uploader.destroy(coverImagePublicId);
            await cloudinary.uploader.destroy(bookFilePublicId, { resource_type: 'raw' });

            await bookModel.deleteOne({ _id: bookId }); // from our deleteBook

            res.status(204).json({ id: bookId, message: "Book deleted successfully" });
        } catch (error) {
            const httpError = createHttpError(500, "Failed to delete cover image from Cloudinary");
            return next(httpError);
        }


    } catch (error) {
        const httpError = createHttpError(500, "Failed to delete book");
        return next(httpError);
    }
}

export { createBook, updateBook, listBooks, getSingleBook, deleteBook }; 