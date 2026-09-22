import express from 'express'
import { CartController } from '../controllers/cart.controller'
import { upload } from '../config/upload'

const cartRouter = express.Router()

cartRouter
  .route('/add')
  .post(upload.single('slika'), (req, res) => new CartController().add(req, res))
cartRouter.route('/remove').post((req, res) => new CartController().remove(req, res))
cartRouter.route('/clear').post((req, res) => new CartController().clear(req, res))
cartRouter.route('/checkout').post((req, res) => new CartController().checkout(req, res))
cartRouter.route('/:id').get((req, res) => new CartController().getCart(req, res))

export default cartRouter
