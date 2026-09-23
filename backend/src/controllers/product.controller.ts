import express from "express";
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { imageSize } from 'image-size'
import ProductModel from '../models/product'
import { UPLOADS_DIR } from '../config/upload'

function saveImage(file: Express.Multer.File): string {
  let dim
  try {
    dim = imageSize(file.buffer)
  } catch {
    throw 'Invalid image file'
  }
  if (!dim.type || !['jpg', 'png', 'gif'].includes(dim.type))
    throw 'Product images must be JPG, PNG or GIF'
  const filename = `${randomUUID()}.${dim.type}`
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), file.buffer)
  return filename
}

function deleteImage(filename: string): void {
  try {
    fs.unlinkSync(path.join(UPLOADS_DIR, filename))
  } catch {}
}

function parseStringArray(value: any): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return value.split(',').map((s) => s.trim()).filter((s) => s)
    }
  }
  return []
}

function parseServices(value: any): any[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // fall through
    }
  }
  return []
}

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
  // Multipart: text fields + 'slika' (main image) + up to 3 'dodatneSlike'.
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
      } = req.body

      if (!stampar || !sifra || !naziv || !kategorija || !potkategorija || jedinicnaCena == null)
        return res.status(400).json({ message: 'Missing product data' })

      let slikaUrl = ''
      const dodatneSlike: string[] = []
      try {
        const files = req.files as { [field: string]: Express.Multer.File[] } | undefined
        if (files?.slika?.[0]) slikaUrl = saveImage(files.slika[0])
        for (const f of (files?.dodatneSlike ?? []).slice(0, 3))
          dodatneSlike.push(saveImage(f))
      } catch (message) {
        // Don't leave orphan files behind on a failed validation.
        if (slikaUrl) deleteImage(slikaUrl)
        for (const f of dodatneSlike) deleteImage(f)
        return res.status(400).json({ message })
      }

      try {
        const product = await ProductModel.create({
          stampar,
          sifra,
          naziv,
          opis: opis || '',
          kategorija,
          potkategorija,
          jedinicnaCena,
          kolicinaNaLageru: kolicinaNaLageru || 0,
          dostupneBoje: parseStringArray(req.body.dostupneBoje),
          slikaUrl,
          dodatneSlike,
          uslugeStampe: parseServices(req.body.uslugeStampe),
        })
        res.status(201).json(product)
      } catch (err) {
        if (slikaUrl) deleteImage(slikaUrl)
        for (const f of dodatneSlike) deleteImage(f)
        throw err
      }
    } catch (err: any) {
      if (err?.code === 11000)
        return res.status(400).json({ message: 'Proizvod sa tom šifrom već postoji' })
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /products/updateImages — attach/replace a product's images
  updateImages = async (req: express.Request, res: express.Response) => {
    try {
      const product = await ProductModel.findById(req.body.id)
      if (!product) return res.status(404).json({ message: 'Product not found' })

      const files = req.files as { [field: string]: Express.Multer.File[] } | undefined
      const main = files?.slika?.[0]
      const thumbs = (files?.dodatneSlike ?? []).slice(0, 3)
      if (!main && thumbs.length === 0)
        return res.status(400).json({ message: 'No images provided' })

      let newMain = ''
      const newThumbs: string[] = []
      try {
        if (main) newMain = saveImage(main)
        for (const f of thumbs) newThumbs.push(saveImage(f))
      } catch (message) {
        if (newMain) deleteImage(newMain)
        for (const f of newThumbs) deleteImage(f)
        return res.status(400).json({ message })
      }

      // Replace only what was sent; remove the old files from disk.
      if (newMain) {
        if (product.slikaUrl) deleteImage(product.slikaUrl)
        product.slikaUrl = newMain
      }
      if (newThumbs.length) {
        for (const f of product.dodatneSlike) deleteImage(f)
        product.dodatneSlike = newThumbs
      }
      await product.save()
      res.json(product)
    } catch (err) {
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