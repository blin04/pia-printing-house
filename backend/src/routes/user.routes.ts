import express from 'express'
import { UserController } from '../controllers/user.controller'
import { upload } from '../config/upload'

const userRouter = express.Router()

userRouter
  .route('/register')
  .post(upload.single('profilna'), (req, res) => new UserController().register(req, res))
userRouter.route('/login').post((req, res) => new UserController().login(req, res))
userRouter.route('/profile/:id').get((req, res) => new UserController().getProfile(req, res))
userRouter
  .route('/updateProfile')
  .post(upload.single('profilna'), (req, res) => new UserController().updateProfile(req, res))

export default userRouter
