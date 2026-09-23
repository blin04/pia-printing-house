import express from "express";
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { imageSize } from 'image-size'
import ProductModel from '../models/product'
import { UPLOADS_DIR } from '../config/upload'

export class ProductController {
  // GET /products/search?naziv=&kategorija=
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

  // GET /products/details/:id
  details = async (req: express.Request, res: express.Response) => {
    try {
      const product = await ProductModel.findById(req.params.id)
        .populate('kategorija', 'naziv')
        .populate('stampar', 'institucija')
      if (!product) return res.status(404).json({ message: 'Product not found' })
      res.json(product)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // GET /products/byPrinter/:id — a printer's own products.
  getByPrinter = async (req: express.Request, res: express.Response) => {
    try {
      const products = await ProductModel.find({ stampar: req.params.id }).populate(
        'kategorija',
        'naziv'
      )
      res.json(products)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /products/add — printer adds a new product (services optional).
  add = async (req: express.Request, res: express.Response) => {
    try {
      const {
        stampar,
        sifra,
        naziv,
        opis,
        kategorija,
        potkategorija,
        jedinicnaCena,
        kolicinaNaLageru,
        dostupneBoje,
        uslugeStampe,
      } = req.body

      if (!stampar || !sifra || !naziv || !kategorija || !potkategorija || jedinicnaCena == null)
        return res.status(400).json({ message: 'Missing product data' })

      const product = await ProductModel.create({
        stampar,
        sifra,
        naziv,
        opis: opis || '',
        kategorija,
        potkategorija,
        jedinicnaCena,
        kolicinaNaLageru: kolicinaNaLageru || 0,
        dostupneBoje: dostupneBoje || [],
        uslugeStampe: uslugeStampe || [],
      })
      res.status(201).json(product)
    } catch (err: any) {
      if (err?.code === 11000)
        return res.status(400).json({ message: 'Proizvod sa tom šifrom već postoji' })
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /products/updateStock — change a product's stock quantity.
  updateStock = async (req: express.Request, res: express.Response) => {
    try {
      const { id, kolicinaNaLageru } = req.body
      if (!id || kolicinaNaLageru == null || kolicinaNaLageru < 0)
        return res.status(400).json({ message: 'Invalid stock data' })

      const product = await ProductModel.findByIdAndUpdate(id, { kolicinaNaLageru }, { new: true })
      if (!product) return res.status(404).json({ message: 'Product not found' })
      res.json(product)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /products/addService — add a print service to an existing product.
  addService = async (req: express.Request, res: express.Response) => {
    try {
      const { id, usluga } = req.body
      if (!id || !usluga || !usluga.idUsluge || !usluga.tipStampe)
        return res.status(400).json({ message: 'Invalid service data' })

      const product = await ProductModel.findById(id)
      if (!product) return res.status(404).json({ message: 'Product not found' })

      product.uslugeStampe.push({
        idUsluge: usluga.idUsluge,
        tipStampe: usluga.tipStampe,
        dodatnaCenaPoKomadu: usluga.dodatnaCenaPoKomadu || 0,
        maxSirinaMm: usluga.maxSirinaMm || 0,
        maxVisinaMm: usluga.maxVisinaMm || 0,
      } as any)
      await product.save()
      res.status(201).json(product)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // GET /products/top5
  top5 = async (req: express.Request, res: express.Response) => {
    try {
      const products = await ProductModel.find({})
        .sort({likes : -1})
        .limit(5)
        .select('naziv likes')
      res.status(200).json(products)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }
}