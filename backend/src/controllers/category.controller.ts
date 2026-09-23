import express from 'express'
import ProductModel from '../models/product'
import CategoryModel from '../models/category'

export class CategoryController {
  // GET /categories/inStock
  // Only categories that currently have at least one product in stock (for the
  // search dropdown).
  getInStock = async (req: express.Request, res: express.Response) => {
    try {
      const ids = await ProductModel.distinct('kategorija', { kolicinaNaLageru: { $gt: 0 } })
      const categories = await CategoryModel.find({ _id: { $in: ids } })
      res.json(categories)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // GET /categories/all — every category (+ subcategories), e.g. for the
  // printer's add-product form.
  getAll = async (req: express.Request, res: express.Response) => {
    try {
      const categories = await CategoryModel.find({})
      res.json(categories)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }
}
