import PDFDocument from 'pdfkit'
import path from 'path'

const FONT_PATH = path.resolve(__dirname, '..', '..', 'assets', 'DejaVuSans.ttf')

// Renders a single invoice (order) to a PDF and resolves with its bytes.
export function generateInvoicePdf(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.font(FONT_PATH)

    doc.fontSize(20).text('Faktura', { align: 'center' })
    doc.moveDown()

    doc.fontSize(11)
    doc.text(`ID fakture: ${order._id}`)
    doc.text(`Štamparija: ${order.stamparija}`)
    doc.text(`Grad: ${order.grad}`)
    doc.text(`Status: ${order.status}`)
    if (order.createdAt) doc.text(`Datum: ${new Date(order.createdAt).toLocaleString('sr-RS')}`)
    doc.moveDown()

    doc.fontSize(12).text('Proizvodi:')
    doc.fontSize(11)
    order.proizvodi.forEach((p: any, i: number) => {
      const st = p.tipStampe ? ` [${p.tipStampe}]` : ''
      doc.text(`${i + 1}. ${p.naziv} — ${p.kolicina} x ${p.jedinicnaCena} = ${p.ukupnaCena} RSD${st}`)
    })
    doc.moveDown()

    doc.fontSize(14).text(`Ukupno: ${order.cena} RSD`, { align: 'right' })
    doc.end()
  })
}

// Renders a procurement (auction) report: required products, all bids, winner.
export function generateAuctionReport(auction: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.font(FONT_PATH)

    doc.fontSize(18).text('Izveštaj o javnoj nabavci', { align: 'center' })
    doc.moveDown()

    doc.fontSize(11)
    doc.text(`ID nabavke: ${auction._id}`)
    doc.text(`Naručilac: ${auction.nazivKlijenta}`)
    doc.text(`Status: ${auction.status}`)
    doc.moveDown()

    doc.fontSize(12).text('Traženi proizvodi:')
    doc.fontSize(11)
    auction.potrebniProizvodi.forEach((p: any, i: number) => {
      doc.text(`${i + 1}. ${p.naziv} — ${p.kolicina} kom${p.tipStampe ? ` [${p.tipStampe}]` : ''}`)
    })
    doc.moveDown()

    doc.fontSize(12).text('Pristigle ponude:')
    doc.fontSize(11)
    if (!auction.ponude.length) doc.text('Nema pristiglih ponuda.')
    const pobednikId = auction.pobednik ? auction.pobednik.toString() : ''
    auction.ponude.forEach((b: any) => {
      const isWin = pobednikId && b._id.toString() === pobednikId
      const flags = `${b.naStanju ? '' : ' (nedovoljne zalihe)'}${isWin ? '  <-- POBEDNIK' : ''}`
      doc.text(`${b.stamparija}: ${b.ukupnacena} RSD${flags}`)
    })
    doc.moveDown()

    const winner = auction.ponude.find(
      (b: any) => pobednikId && b._id.toString() === pobednikId
    )
    if (winner)
      doc
        .fontSize(13)
        .text(`Pobednik: ${winner.stamparija} — ${winner.ukupnacena} RSD`, { align: 'right' })
    else doc.fontSize(12).text('Nije izabran pobednik.', { align: 'right' })

    doc.end()
  })
}
