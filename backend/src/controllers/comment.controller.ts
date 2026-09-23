import express from 'express'
import CommentModel from '../models/comment'
import OrderModel from '../models/order'
import ProductModel from '../models/product'
import UserModel from '../models/user'

export class CommentController {
  // POST /comments/add
  add = async (req: express.Request, res: express.Response) => {
    try {
      const { proizvod, autorObjekat, narudzbina, reakcija, komentar } = req.body

      if (!proizvod || !autorObjekat || !narudzbina || !reakcija || !komentar)
        return res.status(400).json({ message: 'Missing comment data' })
      if (reakcija !== 'like' && reakcija !== 'dislike')
        return res.status(400).json({ message: 'Invalid reaction' })

      // only clients who received the order may comment
      const order = await OrderModel.findOne({
        _id: narudzbina,
        klijent: autorObjekat,
        status: 'primljeno',
        'proizvodi.proizvod': proizvod,
      })
      if (!order)
        return res.status(403).json({ message: 'Ocenu možete ostaviti samo na proizvod koji ste primili' })

      const user = await UserModel.findById(autorObjekat)
      if (!user) return res.status(404).json({ message: 'User not found' })

      const comment = await CommentModel.create({
        proizvod,
        autorObjekat,
        autor: user.username,
        narudzbina,
        reakcija,
        komentar,
      })

      const inc = reakcija === 'like' ? { likes: 1 } : { dislikes: 1 }
      await ProductModel.updateOne({ _id: proizvod }, { $inc: inc })

      res.status(201).json(comment)
    } catch (err: any) {
      if (err?.code === 11000)
        return res.status(400).json({ message: 'Već ste ostavili ocenu na ovaj komentar' })
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // GET /comments/byProduct/:id
  getByProduct = async (req: express.Request, res: express.Response) => {
    try {
      const comments = await CommentModel.find({ proizvod: req.params.id })
        .sort({ createdAt: -1 })
        .limit(5)
      res.json(comments)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }
}
