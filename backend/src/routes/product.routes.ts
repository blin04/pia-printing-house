import express from 'express'
import { ProductController } from '../controllers/product.controller'

const productRouter = express.Router()

productRouter.route('/search').get((req, res) => new ProductController().search(req, res))
productRouter.route('/details/:id').get((req, res) => new ProductController().details(req, res))

export default productRouter