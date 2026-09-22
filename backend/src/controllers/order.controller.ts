import express from 'express'
import OrderModel from '../models/order'

export class OrderController {
  // GET /orders/byClient/:id
  getByClient = async (req: express.Request, res: express.Response) => {
    let id: any = req.params.id
    const orders = await OrderModel.find({klijent: id })
    res.json(orders)
  }

  // POST /orders/cancel
  // Cancels an order that is still in status 'naruceno'.
  cancel = async (req: express.Request, res: express.Response) => {
    res.status(501).json({ message: 'Not implemented' })
  }
}
