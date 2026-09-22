import express from 'express'
import { CategoryController } from '../controllers/category.controller'

const categoryRouter = express.Router()

categoryRouter.route('/inStock').get((req, res) => new CategoryController().getInStock(req, res))

export default categoryRouter
