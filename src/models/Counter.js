import mongoose from 'mongoose'

const { Schema } = mongoose

// Simple named counters (used for the human-friendly lead sequence number).
const counterSchema = new Schema({
  _id: String,
  value: { type: Number, default: 0 },
})

const Counter = mongoose.model('Counter', counterSchema)

export async function nextSeq(name = 'leadSeq') {
  const c = await Counter.findByIdAndUpdate(
    name,
    { $inc: { value: 1 } },
    { new: true, upsert: true },
  )
  return c.value
}

export default Counter
