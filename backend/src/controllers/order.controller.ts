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
  cancel = async (req: express.Request, res: express.Response) => {
    res.status(501).json({ message: 'Not implemented' })
  }

  // GET /orders/archive/:id
  getArchive = async (req: express.Request, res: express.Response) => {
    const userId = req.params.id

    const orders = await OrderModel.find({
      klijent: userId, 
      status: {$in: ['naruceno', 'primljeno']}
    })

    res.json(orders)
  }

  // POST /orders/markReceived
  markReceived = async (req: express.Request, res: express.Response) => {
    const orderId = req.body.orderId
    OrderModel.updateOne({_id: orderId}, {status: "primljeno"})
    res.sendStatus(200)
  }
}
