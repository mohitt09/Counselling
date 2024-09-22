const mongoose = require('mongoose');

const CredentialsSchema = new mongoose.Schema({
 username: {
    type: String,
    required: true,
    unique: true,
 },
 password: {
    type: String,
    required: true,
    unique: true,
 },
 type: {
    type: Number,
    required: true,
 },
 profileId: { // New field
    type: String, // Assuming profileId is a string, adjust the type as necessary
    required: true, // This field is required
 },
});

module.exports = mongoose.model('Credentials', CredentialsSchema);