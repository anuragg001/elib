import express from "express";
import { createBook } from "./bookController";
import multer from "multer";
import path from "node:path";
import authenticate from "../middlewares/authenticate";

const bookRouter = express.Router();

// file store local -->  temporily store the file in the server and then move it to the public folder
const upload = multer({
    dest: path.resolve(__dirname, '../../public/data/uploads'),
    limits: { fileSize: 10 * 1024 * 1024 } //10MB
})


//routes
bookRouter.post('/', authenticate, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'file', maxCount: 1 },

]), createBook);


export default bookRouter;