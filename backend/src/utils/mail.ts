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
