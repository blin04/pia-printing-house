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
userRouter.route('/adminLogin').post((req, res) => new UserController().adminLogin(req, res))
userRouter.route('/pending').get((req, res) => new UserController().getPending(req, res))
userRouter.route('/approve').post((req, res) => new UserController().approve(req, res))
userRouter.route('/reject').post((req, res) => new UserController().reject(req, res))
userRouter.route('/all').get((req, res) => new UserController().getAll(req, res))
userRouter.route('/adminUpdate').post((req, res) => new UserController().adminUpdate(req, res))
userRouter.route('/delete').post((req, res) => new UserController().deleteUser(req, res))

// Forgotten password
userRouter
  .route('/requestPasswordReset')
  .post((req, res) => new UserController().requestPasswordReset(req, res))
userRouter
  .route('/resetPassword')
  .post((req, res) => new UserController().resetPassword(req, res))

export default userRouter
