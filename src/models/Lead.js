import mongoose from 'mongoose'

const { Schema } = mongoose

const leadSchema = new Schema(
  {
    seq: { type: Number, index: true },
    source: { type: String, default: '', index: true },
    dateOfCalling: { type: String, default: '' },
    counselor: { type: String, default: '' },
    college: { type: String, default: '', index: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    email: { type: String, default: '' },
    city: { type: String, default: '', index: true },
    countryCode: { type: String, default: '' },
    phone: { type: String, default: '' },
    program: { type: String, default: '' },
    callStatus: { type: String, default: '' },
    callDisposition: { type: String, default: '' },
    orientationStatus: { type: String, default: '' },
    remark: { type: String, default: '' },
    status: { type: String, default: 'New', index: true },
  },
  { timestamps: true },
)

// Substring search across the common fields.
leadSchema.index({ firstName: 'text', lastName: 'text', email: 'text', phone: 'text', college: 'text', city: 'text' })

leadSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
})

export default mongoose.model('Lead', leadSchema)
