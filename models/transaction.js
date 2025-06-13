const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.SchemaTypes.ObjectId },
  exchangerId: { type: mongoose.SchemaTypes.ObjectId },
  userEmail: { type: String, require: true },
  exchangerEmail: { type: String, require: true },
  referenceNo: { type: String, require: true, unique: true },
  transactionType: { type: String, enum: ['Deposit', 'Withdrawal', 'Buy', 'Sell'] },
  token: { type: String, enum: ['CPT', 'GSC'] },
  amount: { type: Number, default: 0 },
  worth: { type: String, require: true },
  status: { type: String, enum: ['Pending', 'Make Payment', 'Get Credited'] },
  timer: { type: Number, default: 0 },
  dispute: { type: String }
}, { timestamps: true });

const transactionModel = mongoose.model('transactions', transactionSchema);

module.exports = transactionModel;