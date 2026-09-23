import express from 'express'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { imageSize } from 'image-size'
import UserModel from '../models/user'
import ProductModel from '../models/product'
import OrderModel from '../models/order'
import { UPLOADS_DIR } from '../config/upload'
import { generateInvoicePdf } from '../utils/pdf'
import { sendInvoiceEmail } from '../utils/mail'

export class CartController {
  // GET /cart/:id
  getCart = async (req: express.Request, res: express.Response) => {
    let userId = req.params.id
    const user = await UserModel.findOne({_id: userId})
      .populate('korpa.proizvod')
      .populate('korpa.stamparija', 'institucija')
    if (!user) res.status(404).json({ message: 'user not found'})
    else res.json(user.korpa)
  }

  // POST /cart/add  (multipart: optional `slika` file)
  add = async (req: express.Request, res: express.Response) => {
    try {
      const { id, proizvod, stamparija, boja, idUsluge, tekst } = req.body
      const kolicina = Number(req.body.kolicina)

      if (!id || !proizvod || !stamparija || !kolicina || kolicina < 1)
        return res.status(400).json({ message: 'Missing or invalid cart item data' })

      const user = await UserModel.findOne({_id: id})
      if (!user) return res.status(404).json({ message: 'User not found' })

      const product = await ProductModel.findById(proizvod)
      if (!product) return res.status(404).json({ message: 'Product not found' })
      if (kolicina > product.kolicinaNaLageru)
        return res.status(400).json({ message: 'not enough product units' })

      let slika: string | undefined = undefined
      const file: any = req.file
      if (file) {
        let dim
        try {
          dim = imageSize(file.buffer)
        } catch {
          return res.status(400).json({ message: 'Invalid image file' })
        }
        if (!dim.type || !['jpg', 'png', 'gif'].includes(dim.type))
          return res.status(400).json({ message: 'Image must be JPG, PNG or GIF' })
        slika = `${randomUUID()}.${dim.type}`
        fs.writeFileSync(path.join(UPLOADS_DIR, slika), file.buffer)
      }

      user.korpa.push({
        proizvod,
        stamparija,
        kolicina,
        boja: boja || 'Bela',
        idUsluge: idUsluge || undefined,
        tekst: tekst || undefined,
        slika,
      } as any)

      await user.save()
      res.status(201).json({ message: 'Added to cart' })
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /cart/remove
  remove = async (req: express.Request, res: express.Response) => {
    const { id, itemId } = req.body
    const user = await UserModel.findOne({ _id: id })
    if (!user) {
      console.log('kurac')
      return res.status(404).json({ message: 'User not found' })
    }

    user.korpa.pull(itemId)
    await user.save()
    res.sendStatus(200)
    console.log("everything ok on back")
  }

  // POST /cart/clear
  clear = async (req: express.Request, res: express.Response) => {
    const user = await UserModel.findOne({ _id: req.body.id })
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.set('korpa', [])
    await user.save()
    res.sendStatus(200)
  }

  // POST /cart/checkout
  checkout = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.body
      const user = await UserModel.findOne({ _id: id })
        .populate('korpa.proizvod')
        .populate('korpa.stamparija', 'institucija')
      if (!user) return res.status(404).json({ message: 'User not found' })
      if (!user.korpa.length) return res.status(400).json({ message: 'Cart is empty' })

      // Group cart items by printer.
      const groups = new Map<string, any[]>()
      for (const item of user.korpa as any[]) {
        const printerId = item.stamparija._id.toString()
        if (!groups.has(printerId)) groups.set(printerId, [])
        groups.get(printerId)!.push(item)
      }

      // generate orders
      const orders = []
      for (const items of groups.values()) {
        const printer = items[0].stamparija
        const proizvodi = items.map((item: any) => {
          const product = item.proizvod
          const usluga = product.uslugeStampe?.find((u: any) => u.idUsluge === item.idUsluge)
          const jedinicnaCena = product.jedinicnaCena + (usluga ? usluga.dodatnaCenaPoKomadu : 0)
          return {
            proizvod: product._id,
            naziv: product.naziv,
            kolicina: item.kolicina,
            boja: item.boja,
            idUsluge: item.idUsluge,
            tipStampe: usluga ? usluga.tipStampe : undefined,
            tekst: item.tekst,
            slika: item.slika,
            jedinicnaCena,
            ukupnaCena: jedinicnaCena * item.kolicina,
          }
        })
        const cena = proizvodi.reduce((sum: number, p: any) => sum + p.ukupnaCena, 0)

        const order = await OrderModel.create({
          klijent: user._id,
          stampar: printer._id,
          stamparija: printer.institucija?.naziv,
          grad: printer.institucija?.grad,
          proizvodi,
          cena,
          status: 'naruceno',
          izvor: 'direct',
        })
        orders.push(order)
      }

      user.set('korpa', [])
      await user.save()

      // generate a PDF per invoice and email it to the client
      for (const order of orders) {
        try {
          const pdf = await generateInvoicePdf(order)
          await sendInvoiceEmail(user.email, order, pdf)
        } catch (mailErr) {
          console.log('Invoice PDF/email failed:', mailErr)
        }
      }

      res.status(201).json({ message: 'Narudžbine kreirane', count: orders.length })
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }
}
