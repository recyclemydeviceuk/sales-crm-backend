import mongoose from 'mongoose'

const { Schema } = mongoose

// One row per option in a managed dropdown list (stages / sources / colleges / cities).
const listItemSchema = new Schema(
  {
    type: { type: String, enum: ['stage', 'source', 'college', 'city'], required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '' }, // used by stages only
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

// No duplicate names within a type.
listItemSchema.index({ type: 1, name: 1 }, { unique: true })

listItemSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
})

export default mongoose.model('ListItem', listItemSchema)
