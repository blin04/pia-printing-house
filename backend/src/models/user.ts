import mongoose, { Schema, model, Types, InferSchemaType } from 'mongoose'

const institutionSchema = new Schema(
  {
    naziv: { type: String, required: true, trim: true },
    adresaSedista: { type: String, required: true, trim: true },
    grad: { type: String, required: true, trim: true },
    maticniBroj: { type: String, required: true, match: /^\d{8}$/ },
    pib: { type: String, required: true, match: /^[1-9]\d{8}$/ },
    lokacija: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
)

const cartItemSchema = new Schema(
  {
    proizvod: { type: Types.ObjectId, ref: 'ProductModel', required: true },
    stamparija: { type: Types.ObjectId, ref: 'UserModel', required: true }, // denormalized for grouping
    kolicina: { type: Number, required: true, min: 1 },
    boja: { type: String, default: 'Bela' },
    idUsluge: { type: String },
    tekst: { type: String },
    slika: { type: String },
  },
  { _id: true }
)

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    ime: { type: String, required: true, trim: true },
    prezime: { type: String, required: true, trim: true },
    telefon: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    profilna: { type: String, default: 'default_profile_image.jpg' },

    tip: { type: String, enum: ['admin', 'klijent', 'stampar'], required: true },
    lice: { type: String, enum: ['pravno', 'fizicko'] },

    institucija: { type: institutionSchema },

    status: {
      type: String,
      enum: ['neodobren', 'odobren', 'odbijen'],
      default: 'neodobren',
      required: true,
    },

    resetToken: { type: String },
    resetTokenExpires: { type: Date },

    korpa: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
)

userSchema.index({ 'institucija.maticniBroj': 1 }, { unique: true, sparse: true })
userSchema.index({ 'institucija.pib': 1 }, { unique: true, sparse: true })

export default mongoose.model('UserModel', userSchema, 'korisnici')

