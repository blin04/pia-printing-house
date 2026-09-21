import mongoose, { Schema, Types, InferSchemaType } from 'mongoose'


const commentSchema = new Schema(
  {
    proizvod: { type: Types.ObjectId, ref: 'ProductModel', required: true },
    autorObjekat: { type: Types.ObjectId, ref: 'UserModel', required: true },
    autor: { type: String, required: true },

    narudzbina: { type: Types.ObjectId, ref: 'OrderModel', required: true },

    reakcija: { type: String, enum: ['like', 'dislike'], required: true }, // svidjanje / nesvidjanje
    komentar: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

// Fetch the latest comments for a product quickly.
commentSchema.index({ proizvod: 1, createdAt: -1 })
// One reaction per client per (received) product.
commentSchema.index({ proizvod: 1, autorObjekat: 1, narudzbina: 1 }, { unique: true })

export default mongoose.model('CommentModel', commentSchema, 'komentari')
