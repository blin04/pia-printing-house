import express from 'express'
import { CategoryController } from '../controllers/category.controller'

const categoryRouter = express.Router()

categoryRouter.route('/inStock').get((req, res) => new CategoryController().getInStock(req, res))
categoryRouter.route('/all').get((req, res) => new CategoryController().getAll(req, res))

export default categoryRouter
