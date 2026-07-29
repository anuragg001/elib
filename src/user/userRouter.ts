import express from "express";
import { createUser } from "./userController";

const userRouter = express.Router();

//routes
// userRouter.post('/register',(req,res,next)=>{
//     res.json({message:"User registered successfully"})
// })

userRouter.post('/register', createUser);

export default userRouter;