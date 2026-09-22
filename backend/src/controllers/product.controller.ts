import express from "express";
import ProductModel from '../models/product'

export class ProductController {
  // GET /products/search?naziv=&kategorija=
  // Both filters optional: partial name match + optional category id.
  search = async (req: express.Request, res: express.Response) => {
    try {
      const naziv = (req.query.naziv as string) || ''
      const kategorija = (req.query.kategorija as string) || ''

      const filter: any = {}
      if (naziv) filter.naziv = { $regex: naziv, $options: 'i' } // case-insensitive contains
      if (kategorija) filter.kategorija = kategorija

      const products = await ProductModel.find(filter).populate('kategorija', 'naziv')
      res.json(products)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }
}