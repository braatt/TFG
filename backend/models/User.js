const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  searches: [
    {
      from: { type: String, required: true },
      to: { type: String, required: true },
      depart: { type: Date, required: true },
      return: { type: Date, required: true },
      price: { type: String, required: true },
    },
  ],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
