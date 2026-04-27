// =============================================
//  TechSummit 2026 — Node.js Backend
//  server.js
//  Run: node server.js
//  Server starts at http://localhost:3000
// =============================================
 
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const cors    = require('cors');
 
const app        = express();
const PORT       = 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');
 
// ── Middleware ────────────────────────────────
app.use(cors());                  // allow cross-origin requests from frontend
app.use(express.json());          // parse JSON request bodies
app.use(express.static(__dirname)); // serve all HTML/CSS/JS files in this folder
 
// ── File helpers ──────────────────────────────
function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
    }
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading orders.json:', e.message);
    return [];
  }
}
 
function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing orders.json:', e.message);
  }
}
 
// ── REST Endpoints ────────────────────────────
 
// POST /api/orders
// Called by finalize.html — saves a new registration with status = "pending"
app.post('/api/orders', (req, res) => {
  const orders   = readOrders();
  const newOrder = {
    ...req.body,
    status:      'pending',
    submittedAt: new Date().toISOString()
  };
  orders.push(newOrder);
  writeOrders(orders);
  console.log('New order saved:', newOrder.confirmationId);
  res.status(201).json({ success: true, order: newOrder });
});
 
// GET /api/orders
// Called by history.html — returns ALL registrations
app.get('/api/orders', (req, res) => {
  const orders = readOrders();
  res.json(orders);
});
 
// GET /api/orders/pending
// Called by approval.html — returns only PENDING registrations
app.get('/api/orders/pending', (req, res) => {
  const orders = readOrders();
  res.json(orders.filter(function(o) { return o.status === 'pending'; }));
});
 
// PUT /api/orders/:id
// Called by approval.html — updates status to "approved" or "declined"
app.put('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const id     = req.params.id;
  const status = req.body.status;
 
  if (!['approved', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or declined' });
  }
 
  const index = orders.findIndex(function(o) { return o.confirmationId === id; });
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
 
  orders[index].status    = status;
  orders[index].updatedAt = new Date().toISOString();
  writeOrders(orders);
  console.log('Order updated:', id, '->', status);
  res.json({ success: true, order: orders[index] });
});
 
// DELETE /api/orders/:id
// Called by history.html — permanently removes an approved or declined order
app.delete('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const id     = req.params.id;
 
  const index = orders.findIndex(function(o) { return o.confirmationId === id; });
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
 
  // Only allow deleting approved or declined — not pending
  if (orders[index].status === 'pending') {
    return res.status(400).json({ error: 'Cannot delete a pending order. Approve or decline it first.' });
  }
 
  orders.splice(index, 1);
  writeOrders(orders);
  console.log('Order deleted:', id);
  res.json({ success: true });
});
 
// ── Start server ──────────────────────────────
app.listen(PORT, function() {
  console.log('');
  console.log('  TechSummit 2026 Backend');
  console.log('  Running at: http://localhost:' + PORT);
  console.log('  Orders file: ' + ORDERS_FILE);
  console.log('');
  console.log('  Endpoints:');
  console.log('    POST   /api/orders         - submit new registration');
  console.log('    GET    /api/orders         - get all registrations');
  console.log('    GET    /api/orders/pending - get pending registrations');
  console.log('    PUT    /api/orders/:id     - approve or decline');
  console.log('    DELETE /api/orders/:id     - delete approved/declined order');
  console.log('');
});