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

  // POST /categories/add
  add = async (req: express.Request, res: express.Response) => {
    try {
      const { naziv } = req.body
      if (!naziv) return res.status(400).json({ message: 'Nedostaje ime kategorije' })
      const category = await CategoryModel.create({ naziv, podkategorije: [] })
      res.status(201).json(category)
    } catch (err: any) {
      if (err?.code === 11000)
        return res.status(400).json({ message: 'Kategorija sa tim nazivom već postoji' })
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /categories/addSubcategory
  addSubcategory = async (req: express.Request, res: express.Response) => {
    try {
      const { id, naziv } = req.body
      if (!id || !naziv) return res.status(400).json({ message: 'Nedostaju podaci' })
      const category = await CategoryModel.findById(id)
      if (!category) return res.status(404).json({ message: 'Nepostojeća kategorija' })
      category.podkategorije.push({ naziv } as any)
      await category.save()
      res.status(201).json(category)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }
}
