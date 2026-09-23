import express from 'express'
import { CategoryController } from '../controllers/category.controller'

const categoryRouter = express.Router()

categoryRouter.route('/inStock').get((req, res) => new CategoryController().getInStock(req, res))
categoryRouter.route('/all').get((req, res) => new CategoryController().getAll(req, res))
categoryRouter.route('/add').post((req, res) => new CategoryController().add(req, res))
categoryRouter
  .route('/addSubcategory')
  .post((req, res) => new CategoryController().addSubcategory(req, res))

export default categoryRouter
