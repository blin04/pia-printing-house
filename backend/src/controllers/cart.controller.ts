import express from 'express'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { imageSize } from 'image-size'
import UserModel from '../models/user'
import ProductModel from '../models/product'
import { UPLOADS_DIR } from '../config/upload'

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
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.korpa.pull(itemId)
    await user.save()
    res.sendStatus(200)
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
    // TODO: implement — form one invoice (order) per printer, then clear the korpa.
    res.status(501).json({ message: 'Not implemented' })
  }
}
