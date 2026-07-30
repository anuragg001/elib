import express from "express";
import { createUser, loginUser } from "./userController";

const userRouter = express.Router();

//routes
// userRouter.post('/register',(req,res,next)=>{
//     res.json({message:"User registered successfully"})
// })

userRouter.post('/register', createUser);
userRouter.post('/login',loginUser)

export default userRouter;