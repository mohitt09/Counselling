const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
 name: {
    type: String,
    required: true,
 },
 email: {
    type: String,
    required: true,
 },
 phoneNo: {
    type: String,
    required: true,
 },
 date: {
    type: Date,
    required: true,
 },
 time: {
    type: String,
    required: true,
 },
 department: {
    type: String,
    required: true,
 },
 amount: {
    type: Number,
    required: true,
 },
 currency: {
    type: String,
    required: true,
 },
 receiptId: {
    type: String,
    required: true,
 },
 paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
 },
 paymentResponse: {
    type: Object,
 },
 createdAt: {
    type: Date,
    default: Date.now,
 },
});

module.exports = mongoose.model('Payment', PaymentSchema);