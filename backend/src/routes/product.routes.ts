import express from 'express'
import { ProductController } from '../controllers/product.controller'

const productRouter = express.Router()

productRouter.route('/search').get((req, res) => new ProductController().search(req, res))
productRouter.route('/details/:id').get((req, res) => new ProductController().details(req, res))
productRouter.route('/byPrinter/:id').get((req, res) => new ProductController().getByPrinter(req, res))
productRouter.route('/add').post((req, res) => new ProductController().add(req, res))
productRouter.route('/updateStock').post((req, res) => new ProductController().updateStock(req, res))
productRouter.route('/addService').post((req, res) => new ProductController().addService(req, res))
productRouter.route('/top5').get((req, res) => new ProductController().top5(req, res))

export default productRouter