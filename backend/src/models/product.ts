import mongoose, { Schema, Types, InferSchemaType } from 'mongoose'

const printServiceSchema = new Schema(
  {
    idUsluge: { type: String, required: true },
    tipStampe: { type: String, required: true },
    dodatnaCenaPoKomadu: { type: Number, required: true, min: 0 },
    maxSirinaMm: { type: Number, required: true, min: 0 },
    maxVisinaMm: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const productSchema = new Schema(
  {
    stampar: { type: Types.ObjectId, ref: 'UserModel', required: true },
    sifra: { type: String, required: true },
    naziv: { type: String, required: true, trim: true },
    opis: { type: String, default: '' },

    kategorija: { type: Types.ObjectId, ref: 'CategoryModel', required: true },
    potkategorija: { type: String, required: true },

    jedinicnaCena: { type: Number, required: true, min: 0 },
    kolicinaNaLageru: { type: Number, required: true, min: 0, default: 0 },

    dostupneBoje: { type: [String], default: [] },
    slikaUrl: { type: String },
    dodatneSlike: { type: [String], default: [] },

    uslugeStampe: { type: [printServiceSchema], default: [] },

    likes: { type: Number, default: 0, min: 0 },
    dislikes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

productSchema.index({ stampar: 1, sifra: 1 }, { unique: true })
// Text-ish search by name + category filtering, and TOP-5 by likes.
productSchema.index({ naziv: 1 })
productSchema.index({ kategorija: 1 })
productSchema.index({ likes: -1 })

export type Product = InferSchemaType<typeof productSchema>
export default mongoose.model('ProductModel', productSchema, 'proizvodi')
