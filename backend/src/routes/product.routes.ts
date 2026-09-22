import express from 'express'
import { ProductController } from '../controllers/product.controller'

const productRouter = express.Router()

productRouter.route('/search').get((req, res) => new ProductController().search(req, res))

export default productRouter