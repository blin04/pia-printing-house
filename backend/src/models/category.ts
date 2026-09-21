import mongoose, { Schema, InferSchemaType } from 'mongoose'

const subcategorySchema = new Schema(
  {
    naziv: { type: String, required: true, trim: true },
  },
  { _id: true }
)

const categorySchema = new Schema(
  {
    naziv: { type: String, required: true, unique: true, trim: true },
    podkategorije: { type: [subcategorySchema], default: [] },
  },
  { timestamps: true }
)

export type Category = InferSchemaType<typeof categorySchema>
export default mongoose.model('CategoryModel', categorySchema, 'kategorije')
