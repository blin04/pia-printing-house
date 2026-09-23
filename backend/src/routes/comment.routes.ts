import express from 'express'
import { CommentController } from '../controllers/comment.controller'

const commentRouter = express.Router()

commentRouter.route('/add').post((req, res) => new CommentController().add(req, res))
commentRouter
  .route('/byProduct/:id')
  .get((req, res) => new CommentController().getByProduct(req, res))

export default commentRouter
