import PDFDocument from 'pdfkit'
import path from 'path'

// Bundled Unicode font (backend/assets) so Serbian diacritics (č, ć, đ, š, ž)
// render correctly on any machine. Resolved relative to the compiled location
// (dist/utils -> backend).
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
