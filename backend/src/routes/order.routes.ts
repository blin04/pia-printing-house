import express from 'express'
import { OrderController } from '../controllers/order.controller'
import order from '../models/order'

const orderRouter = express.Router()

orderRouter.route('/byClient/:id').get((req, res) => new OrderController().getByClient(req, res))
orderRouter.route('/cancel').post((req, res) => new OrderController().cancel(req, res))
orderRouter.route('/archive/:id').get((req, res) => new OrderController().getArchive(req, res))
orderRouter.route('/markReceived').post((req, res) => new OrderController().markReceived(req, res))
orderRouter.route('/byPrinter/:id').get((req, res) => new OrderController().byPrinter(req, res))
orderRouter.route('/advanceStatus').post((req, res) => new OrderController().advanceStatus(req, res))

export default orderRouter
