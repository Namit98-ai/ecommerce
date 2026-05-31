require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const connectDB = require('./lib/db');
const { User, Product, Order } = require('./lib/models');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ecom_secret';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CATEGORIES = ['Electronics','Fashion','Home','Sports','Books'];

async function seedData() {
  await connectDB();
  const exists = await User.findOne({ role: 'admin' });
  if (!exists) {
    await User.create({ name: 'Admin', email: 'admin@shop.com', password: bcrypt.hashSync('admin123', 10), role: 'admin' });
    await Product.insertMany([
      { name: 'Wireless Headphones', price: 79.99, originalPrice: 129.99, category: 'Electronics', description: 'Premium wireless headphones with 30hr battery, ANC and deep bass.', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', stock: 50, rating: 4.5, reviews: 128, featured: true },
      { name: 'Running Sneakers', price: 59.99, originalPrice: 89.99, category: 'Fashion', description: 'Lightweight and breathable running shoes with cushioned sole.', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', stock: 30, rating: 4.3, reviews: 95, featured: true },
      { name: 'Mechanical Keyboard', price: 109.99, originalPrice: 149.99, category: 'Electronics', description: 'RGB backlit mechanical keyboard with tactile switches.', image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&q=80', stock: 20, rating: 4.7, reviews: 64, featured: true },
      { name: 'Leather Wallet', price: 29.99, originalPrice: 49.99, category: 'Fashion', description: 'Slim genuine leather bifold wallet with RFID blocking.', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80', stock: 100, rating: 4.2, reviews: 210, featured: false },
      { name: 'Coffee Maker', price: 49.99, originalPrice: 79.99, category: 'Home', description: '12-cup programmable coffee maker with thermal carafe.', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', stock: 15, rating: 4.6, reviews: 87, featured: true },
      { name: 'Yoga Mat', price: 24.99, originalPrice: 39.99, category: 'Sports', description: 'Extra thick non-slip yoga mat with alignment lines.', image: 'https://images.unsplash.com/photo-1601925228870-e3b1c4f7e97a?w=400&q=80', stock: 60, rating: 4.4, reviews: 152, featured: false },
      { name: 'Smart Watch', price: 149.99, originalPrice: 199.99, category: 'Electronics', description: 'Fitness smartwatch with heart rate monitor, GPS, 7-day battery.', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', stock: 25, rating: 4.8, reviews: 301, featured: true },
      { name: 'Desk Lamp', price: 34.99, originalPrice: 54.99, category: 'Home', description: 'LED desk lamp with 5 color modes and USB charging port.', image: 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?w=400&q=80', stock: 45, rating: 4.1, reviews: 73, featured: false },
    ]);
    console.log('✅ Ecommerce seeded');
  }
}
seedData().catch(console.error);

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}
function adminAuth(req, res, next) {
  auth(req, res, () => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' }));
}

// AUTH
app.post('/api/auth/register', async (req, res) => {
  try {
    await connectDB();
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (await User.findOne({ email })) return res.status(409).json({ error: 'Email already exists' });
    const user = await User.create({ name, email, password: bcrypt.hashSync(password, 10) });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.user.id).select('-password');
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    await connectDB();
    const { category, search, sort, featured, page = 1, limit = 8 } = req.query;
    const q = {};
    if (category) q.category = category;
    if (search) q.name = new RegExp(search, 'i');
    if (featured === 'true') q.featured = true;
    let query = Product.find(q);
    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else if (sort === 'rating') query = query.sort({ rating: -1 });
    const total = await Product.countDocuments(q);
    const products = await query.skip((page - 1) * limit).limit(Number(limit));
    res.json({ products, total, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    await connectDB();
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/categories', (req, res) => res.json(CATEGORIES));

// ORDERS
app.post('/api/orders', auth, async (req, res) => {
  try {
    await connectDB();
    const { items, shippingAddress, paymentMethod } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });
    const orderItems = await Promise.all(items.map(async i => {
      const p = await Product.findById(i.productId);
      if (!p) throw new Error('Product not found');
      return { productId: p._id, name: p.name, price: p.price, image: p.image, quantity: i.quantity };
    }));
    const total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = await Order.create({ userId: req.user.id, userName: req.user.name, items: orderItems, total: parseFloat(total.toFixed(2)), shippingAddress, paymentMethod: paymentMethod || 'card' });
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders/my', auth, async (req, res) => {
  try {
    await connectDB();
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ADMIN
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    await connectDB();
    const [totalProducts, totalOrders, totalUsers] = await Promise.all([Product.countDocuments(), Order.countDocuments(), User.countDocuments()]);
    const revenueAgg = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const revenue = revenueAgg[0]?.total || 0;
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    res.json({ totalProducts, totalOrders, totalUsers, revenue: revenue.toFixed(2), pendingOrders, recentOrders });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/products', adminAuth, async (req, res) => {
  try { await connectDB(); res.json(await Product.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/products', adminAuth, async (req, res) => {
  try {
    await connectDB();
    const p = await Product.create(req.body);
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    await connectDB();
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
  try { await connectDB(); await Product.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/orders', adminAuth, async (req, res) => {
  try { await connectDB(); res.json(await Order.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/orders/:id', adminAuth, async (req, res) => {
  try {
    await connectDB();
    const o = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(o);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try { await connectDB(); res.json(await User.find().select('-password').sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/admin*', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

app.listen(PORT, () => console.log(`🛒 Ecommerce running at http://localhost:${PORT}`));
module.exports = app;
