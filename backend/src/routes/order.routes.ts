import express from 'express'
import { OrderController } from '../controllers/order.controller'

const orderRouter = express.Router()

orderRouter.route('/byClient/:id').get((req, res) => new OrderController().getByClient(req, res))
orderRouter.route('/cancel').post((req, res) => new OrderController().cancel(req, res))

export default orderRouter
