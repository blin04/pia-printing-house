import mongoose, { Schema, Types, InferSchemaType } from 'mongoose'

export const ORDER_STATUSES = [
  'naruceno',
  'placeno',
  'u_stampi',
  'isporuceno',
  'primljeno',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

const orderItemSchema = new Schema(
  {
    proizvod: { type: Types.ObjectId, ref: 'ProductModel', required: true },
    naziv: { type: String, required: true },
    kolicina: { type: Number, required: true, min: 1 },
    boja: { type: String, default: 'Bela' },

    idUsluge: { type: String },
    tipStampe: { type: String },

    // Product-preparation output.
    tekst: { type: String },
    slika: { type: String },

    jedinicnaCena: { type: Number, required: true, min: 0 },
    ukupnaCena: { type: Number, required: true, min: 0 }, 
  },
  { _id: true }
)

const orderSchema = new Schema(
  {
    klijent: { type: Types.ObjectId, ref: 'UserModel', required: true },
    stampar: { type: Types.ObjectId, ref: 'UserModel', required: true },
    stamparija: { type: String, required: true },
    grad: { type: String, required: true },

    proizvodi: { type: [orderItemSchema], required: true },
    cena: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ORDER_STATUSES, default: 'naruceno', required: true },

    izvor: { type: String, enum: ['direct', 'auction'], default: 'direct' },
    licitacija: { type: Types.ObjectId, ref: 'AuctionModel' },
  },
  { timestamps: true }
)

orderSchema.index({ klijent: 1, createdAt: -1 })
orderSchema.index({ stampar: 1, status: 1 })

export type Order = InferSchemaType<typeof orderSchema>
export default mongoose.model('OrderModel', orderSchema, 'narudzbine')
