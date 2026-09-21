import mongoose, { Schema, Types, InferSchemaType } from 'mongoose'

const requiredItemSchema = new Schema(
  {
    naziv: { type: String, required: true },
    kategorija: { type: String },
    potkategorija: { type: String },
    kolicina: { type: Number, required: true, min: 1 },
    boja: { type: String, default: 'Bela' },
    tipStampe: { type: String },
  },
  { _id: true }
)

const bidItemSchema = new Schema(
  {
    potrebanProizvod: { type: Types.ObjectId, required: true },
    proizvod: { type: Types.ObjectId, ref: 'ProductModel' },
    jedinicnaCena: { type: Number, required: true, min: 0 },
    ukupnaCena: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const bidSchema = new Schema(
  {
    stampar: { type: Types.ObjectId, ref: 'UserModel', required: true },
    stamparija: { type: String, required: true },
    proizvodi: { type: [bidItemSchema], required: true },
    ukupnacena: { type: Number, required: true, min: 0 },
    naStanju: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true }
)

const auctionSchema = new Schema(
  {
    klijent: { type: Types.ObjectId, ref: 'UserModel', required: true },
    nazivKlijenta: { type: String, required: true },

    potrebniProizvodi: { type: [requiredItemSchema], required: true },
    ponude: { type: [bidSchema], default: [] },

    zavrsetak: { type: Date, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open', required: true },

    // Set on resolution.
    pobednik: { type: Types.ObjectId },
    narudzbina: { type: Types.ObjectId, ref: 'OrderModel' },
    zavrseno: { type: Date },
  },
  { timestamps: true }
)

auctionSchema.index({ status: 1, zavrsetak: 1 })
auctionSchema.index({ klijent: 1, createdAt: -1 })

export type Auction = InferSchemaType<typeof auctionSchema>
export default mongoose.model('AuctionModel', auctionSchema, 'javneNabavke')
