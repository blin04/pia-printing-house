import nodemailer, { Transporter } from 'nodemailer'
import { env } from '../config/env'

let transporterPromise: Promise<Transporter> | null = null

function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (env.smtp.host) {
        return nodemailer.createTransport({
          host: env.smtp.host,
          port: env.smtp.port,
          auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
        })
      }
      const test = await nodemailer.createTestAccount()
      console.log('Nodemailer: using Ethereal test account', test.user)
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: test.user, pass: test.pass },
      })
    })()
  }
  return transporterPromise
}

export async function sendInvoiceEmail(to: string, order: any, pdf: Buffer) {
  const transporter = await getTransporter()
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: `Faktura ${order._id} (${order.stamparija})`,
    text: `U prilogu je faktura za narudžbinu kod štamparije ${order.stamparija}. Ukupan iznos: ${order.cena} RSD.`,
    attachments: [{ filename: `faktura-${order._id}.pdf`, content: pdf }],
  })
  const preview = nodemailer.getTestMessageUrl(info)
  if (preview) console.log('Invoice email preview URL:', preview)
  return info
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const transporter = await getTransporter()
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: 'Poništavanje lozinke — Printing House',
    text:
      `Zatražili ste poništavanje lozinke. Otvorite sledeći link kako ` +
      `biste postavili novu lozinku:\n\n${link}\n\n` +
      `Ovaj link važi 5 minuta.`
  })
  const preview = nodemailer.getTestMessageUrl(info)
  if (preview) console.log('Password reset email preview URL:', preview)
  return info
}

export async function sendProcurementEmail(to: string, auction: any) {
  const transporter = await getTransporter()
  const stavke = auction.potrebniProizvodi
    .map((p: any, i: number) => `${i + 1}. ${p.naziv} — ${p.kolicina} kom`)
    .join('\n')
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: `Otvorena javna nabavka ${auction._id}`,
    text:
      `Otvorena je javna nabavka (ID: ${auction._id}).\n` +
      `Rok za ponude: ${new Date(auction.zavrsetak).toLocaleString('sr-RS')}.\n\n` +
      `Traženi proizvodi:\n${stavke}\n\n` +
      `Prijavite se i pošaljite ponudu na stranici „Licitacije“.`,
  })
  const preview = nodemailer.getTestMessageUrl(info)
  if (preview) console.log('Procurement email preview URL:', preview)
  return info
}

