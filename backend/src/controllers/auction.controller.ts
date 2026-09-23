import express from 'express'
import AuctionModel from '../models/auction'
import UserModel from '../models/user'
import ProductModel from '../models/product'
import OrderModel from '../models/order'
import { sendProcurementEmail } from '../utils/mail'
import { generateAuctionReport } from '../utils/pdf'

async function resolveAuction(auction: any) {
  let winner: any = null

  for (const bid of auction.ponude) {
    let eligible = bid.proizvodi.length === auction.potrebniProizvodi.length
    if (eligible) {
      for (const bi of bid.proizvodi) {
        const reqItem = auction.potrebniProizvodi.find(
          (r: any) => r._id.toString() === bi.potrebanProizvod.toString()
        )
        const product = bi.proizvod ? await ProductModel.findById(bi.proizvod) : null
        if (!reqItem || !product || product.kolicinaNaLageru < reqItem.kolicina) {
          eligible = false
          break
        }
      }
    }
    if (eligible && (!winner || bid.ukupnacena < winner.ukupnacena)) winner = bid
  }

  if (winner) {
    const printer = await UserModel.findById(winner.stampar)

    const proizvodi = auction.potrebniProizvodi.map((r: any) => {
      const bi = winner.proizvodi.find(
        (x: any) => x.potrebanProizvod.toString() === r._id.toString()
      )
      return {
        proizvod: bi.proizvod,
        naziv: r.naziv,
        kolicina: r.kolicina,
        boja: r.boja,
        tipStampe: r.tipStampe,
        jedinicnaCena: bi.jedinicnaCena,
        ukupnaCena: bi.ukupnaCena,
      }
    })

    const order = await OrderModel.create({
      klijent: auction.klijent,
      stampar: winner.stampar,
      stamparija: printer?.institucija?.naziv ?? winner.stamparija,
      grad: printer?.institucija?.grad ?? '',
      proizvodi,
      cena: winner.ukupnacena,
      status: 'u stampi',
      izvor: 'auction',
      licitacija: auction._id,
    })

    // Decrement the winning printer's stock for each supplied product.
    for (const r of auction.potrebniProizvodi) {
      const bi = winner.proizvodi.find(
        (x: any) => x.potrebanProizvod.toString() === r._id.toString()
      )
      if (bi?.proizvod)
        await ProductModel.updateOne({ _id: bi.proizvod }, { $inc: { kolicinaNaLageru: -r.kolicina } })
    }

    auction.pobednik = winner._id
    auction.narudzbina = order._id
  }

  auction.status = 'closed'
  auction.zavrseno = new Date()
  await auction.save()
}

export class AuctionController {
  // POST /auctions/create  { id }  — legal client opens a procurement from cart.
  create = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.body
      const user = await UserModel.findById(id).populate({
        path: 'korpa.proizvod',
        populate: { path: 'kategorija', select: 'naziv' },
      })
      if (!user) return res.status(404).json({ message: 'User not found' })
      if (user.lice !== 'pravno')
        return res.status(403).json({ message: 'Samo pravna lica mogu otvarati javne nabavke' })
      if (!user.korpa.length) return res.status(400).json({ message: 'Korpa je prazna' })

      const potrebniProizvodi = (user.korpa as any[]).map((item) => {
        const product: any = item.proizvod
        const usluga = product.uslugeStampe?.find((u: any) => u.idUsluge === item.idUsluge)
        return {
          naziv: product.naziv,
          kategorija: product.kategorija?.naziv,
          potkategorija: product.potkategorija,
          kolicina: item.kolicina,
          boja: item.boja,
          tipStampe: usluga ? usluga.tipStampe : undefined,
        }
      })

      const auction = await AuctionModel.create({
        klijent: user._id,
        nazivKlijenta: user.institucija?.naziv ?? `${user.ime} ${user.prezime}`,
        potrebniProizvodi,
        ponude: [],
        zavrsetak: new Date(Date.now() + 10 * 60 * 1000),
        status: 'open',
      })

      user.set('korpa', [])
      await user.save()

      // Notify all approved printers (best-effort).
      const printers = await UserModel.find({ tip: 'stampar', status: 'odobren' }).select('email')
      for (const p of printers) {
        try {
          await sendProcurementEmail(p.email, auction)
        } catch (mailErr) {
          console.log('Procurement email failed:', mailErr)
        }
      }

      res.status(201).json(auction)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // GET /auctions/byClient/:id — first lazily resolve any expired auctions.
  getByClient = async (req: express.Request, res: express.Response) => {
    try {
      const id = req.params.id
      const expired = await AuctionModel.find({
        klijent: id,
        status: 'open',
        zavrsetak: { $lte: new Date() },
      })
      for (const auction of expired) await resolveAuction(auction)

      const auctions = await AuctionModel.find({ klijent: id }).sort({ createdAt: -1 })
      res.json(auctions)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // GET /auctions/open — open auctions still within their window (for bidding).
  getOpen = async (req: express.Request, res: express.Response) => {
    try {
      const auctions = await AuctionModel.find({ status: 'open', zavrsetak: { $gt: new Date() } })
      res.json(auctions)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /auctions/bid  { auctionId, stampar, proizvodi } — one bid per printer.
  bid = async (req: express.Request, res: express.Response) => {
    try {
      const { auctionId, stampar, proizvodi } = req.body
      if (!auctionId || !stampar || !Array.isArray(proizvodi) || !proizvodi.length)
        return res.status(400).json({ message: 'Nepotpuni podaci za ponudu' })

      const auction = await AuctionModel.findById(auctionId)
      if (!auction) return res.status(404).json({ message: 'Nabavka ne postoji' })
      if (auction.status !== 'open' || auction.zavrsetak.getTime() <= Date.now())
        return res.status(400).json({ message: 'Nabavka je zatvorena' })

      const printerUser = await UserModel.findById(stampar)
      if (!printerUser) return res.status(404).json({ message: 'Štampar ne postoji' })

      // Total + whether this printer can currently fulfill every required item.
      let ukupnacena = 0
      let naStanju = true
      for (const bi of proizvodi) {
        ukupnacena += bi.ukupnaCena || 0
        const reqItem = auction.potrebniProizvodi.find(
          (r: any) => r._id.toString() === String(bi.potrebanProizvod)
        )
        const product = bi.proizvod ? await ProductModel.findById(bi.proizvod) : null
        if (!reqItem || !product || product.kolicinaNaLageru < reqItem.kolicina) naStanju = false
      }

      const newBid: any = {
        stampar,
        stamparija: printerUser.institucija?.naziv ?? `${printerUser.ime} ${printerUser.prezime}`,
        proizvodi,
        ukupnacena,
        naStanju,
      }

      // Replace this printer's existing bid, if any.
      const idx = auction.ponude.findIndex((b: any) => b.stampar.toString() === String(stampar))
      if (idx >= 0) auction.ponude.splice(idx, 1)
      auction.ponude.push(newBid)

      await auction.save()
      res.status(201).json(auction)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }

  // GET /auctions/report/:id — PDF report of all bids + the winner.
  report = async (req: express.Request, res: express.Response) => {
    try {
      const auction = await AuctionModel.findById(req.params.id)
      if (!auction) return res.status(404).json({ message: 'Nabavka ne postoji' })

      const pdf = await generateAuctionReport(auction)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename=izvestaj-${auction._id}.pdf`)
      res.send(pdf)
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' })
    }
  }
}
