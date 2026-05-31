const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: String, required: true },
  description: String,
  image: String,
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    image: String,
    quantity: Number,
  }],
  total: Number,
  shippingAddress: {
    name: String, phone: String, address: String, city: String, zip: String,
  },
  paymentMethod: { type: String, default: 'card' },
  status: { type: String, enum: ['pending','processing','shipped','delivered'], default: 'pending' },
}, { timestamps: true });

module.exports = {
  User: mongoose.models.User || mongoose.model('User', userSchema),
  Product: mongoose.models.Product || mongoose.model('Product', productSchema),
  Order: mongoose.models.Order || mongoose.model('Order', orderSchema),
};
