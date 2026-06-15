import mongoose from 'mongoose'

const { Schema } = mongoose

// Singleton workspace settings document (key: 'app').
const settingSchema = new Schema({
  key: { type: String, unique: true, default: 'app' },
  counselor: { type: String, default: 'Counselor' },
  org: { type: String, default: 'Hyderabad Team' },
})

settingSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.key
    return ret
  },
})

export default mongoose.model('Setting', settingSchema)
