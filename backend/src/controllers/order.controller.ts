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
    let id = req.body.id
    const order = await OrderModel.findOneAndDelete({_id: id})
    if (!order) return res.status(404).json({message: "nepostojeća ponuda"})
    else return res.sendStatus(200)
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
