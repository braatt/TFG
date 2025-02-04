const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  depart: { type: String, required: true }, 
  return: { type: String, required: false }, 
  price: { type: Number, required: true }, 
  notified: { type: Boolean, default: false },
});

const Search = mongoose.model('Search', searchSchema);

module.exports = Search;
