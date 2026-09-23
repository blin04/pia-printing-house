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

  // GET /orders/byPrinter/:id
  byPrinter = async (req: express.Request, res: express.Response) => {
    const printerId = req.params.id
    const orders = await OrderModel.find({stampar: printerId, status: {$in: ['naruceno', 'u stampi', 'isporuceno']}})
    res.json(orders)
  }

  // POST /orders/advanceStatus
  advanceStatus = async (req: express.Request, res: express.Response) => {
    const orderId = req.body.orderId

    const order = await OrderModel.findOne({_id : orderId})
    if (!order) return res.status(404).json({ message: "nepostojeća narudžbina" })

    if (order.status === 'naruceno') {
      await OrderModel.updateOne({_id : orderId}, {status: 'u stampi'})
    }
    else if (order.status === 'u stampi') {
      await OrderModel.updateOne({_id : orderId}, {status: 'isporuceno'})
    }
    res.sendStatus(200)
  }

}
