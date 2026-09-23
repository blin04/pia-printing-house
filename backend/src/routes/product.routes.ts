import express from 'express'
import { ProductController } from '../controllers/product.controller'
import { upload } from '../config/upload'

const productRouter = express.Router()

// Main image + up to 3 additional images (thumbnails).
const productImages = upload.fields([
  { name: 'slika', maxCount: 1 },
  { name: 'dodatneSlike', maxCount: 3 },
])

productRouter.route('/search').get((req, res) => new ProductController().search(req, res))
productRouter.route('/details/:id').get((req, res) => new ProductController().details(req, res))
productRouter.route('/byPrinter/:id').get((req, res) => new ProductController().getByPrinter(req, res))
productRouter.route('/add').post(productImages, (req, res) => new ProductController().add(req, res))
productRouter.route('/updateImages').post(productImages, (req, res) => new ProductController().updateImages(req, res))
productRouter.route('/updateStock').post((req, res) => new ProductController().updateStock(req, res))
productRouter.route('/addService').post((req, res) => new ProductController().addService(req, res))
productRouter.route('/top5').get((req, res) => new ProductController().top5(req, res))

export default productRouter