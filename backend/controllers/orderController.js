import crypto from 'crypto';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { ESEWA_CONFIG } from '../config/esewa.js';
import { calculateRevenueStats } from '../utils/revenueStats.js';

// GST rate applied to every order — matches the checkout page's own display
// calculation, kept as the single source of truth here since the backend
// is what actually persists the charged amount.
const TAX_RATE = 0.18;

// @desc   ---> this  Creates new order
// @route   ---> this POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  }

  // Never trust price/name/image/totals sent by the client — look up the
  // real product records and recompute everything server-side.
  const productIds = orderItems.map((item) => item._id || item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productById = new Map(products.map((p) => [p._id.toString(), p]));

  const resolvedItems = [];
  for (const item of orderItems) {
    const productId = item._id || item.product;
    const product = productById.get(String(productId));

    if (!product) {
      res.status(404).json({ message: `Product not found: ${productId}` });
      return;
    }

    const qty = Number(item.qty) || 0;
    if (qty <= 0) {
      res.status(400).json({ message: `Invalid quantity for "${product.name}"` });
      return;
    }
    if (qty > product.countInStock) {
      res.status(400).json({ message: `Only ${product.countInStock} of "${product.name}" left in stock.` });
      return;
    }

    resolvedItems.push({
      name: product.name,
      image: product.image,
      price: product.price,
      qty,
      product: product._id,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
    });
  }

  // Reserve stock atomically per item (conditional on enough being left at
  // write time, not just at the read above) so two concurrent orders can't
  // oversell the same item; roll back whatever was already reserved if a
  // later item runs out or the order itself fails to save.
  const reserved = [];
  const releaseReserved = () =>
    Promise.all(reserved.map((r) => Product.updateOne({ _id: r.product }, { $inc: { countInStock: r.qty } })));

  for (const item of resolvedItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, countInStock: { $gte: item.qty } },
      { $inc: { countInStock: -item.qty } }
    );
    if (!updated) {
      await releaseReserved();
      res.status(400).json({ message: `Not enough stock left for "${item.name}".` });
      return;
    }
    reserved.push(item);
  }

  const itemsPrice = resolvedItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const taxPrice = itemsPrice * TAX_RATE;
  const shippingPrice = 0;
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  const order = new Order({
    orderItems: resolvedItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    itemsPrice: itemsPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
    statusHistory: [{ status: 'pending', changedAt: new Date() }],
  });

  try {
    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (err) {
    await releaseReserved();
    throw err;
  }
};

// @desc  --->   Get order by ID
// @route --->  GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc  --->  Update order to paid
// @route --->  PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'paid';
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc --->  Get logged in user's orders
// @route ---> GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.status(200).json(orders);
};


// --- ADMIN FUNCTIONS ---

// @desc  --->  Get all orders
// @route --->  GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
  res.status(200).json(orders);
};


// @desc  --->  Update order to delivered
// @route --->  PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.orderStatus = 'delivered';
    if (order.paymentMethod === 'COD') {
      order.isPaid = true;
      order.paidAt = order.paidAt || Date.now();
      order.paymentStatus = 'paid';
    }
    order.statusHistory.push({ status: 'delivered', changedAt: new Date() });

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// Admin-driven shipping stages. Each key only ever advances to its one
// listed value — no skipping stages, and nothing here can move an order
// out of a cancel/return status (they simply have no entry below).
const SHIPPING_TRANSITIONS = {
  pending: 'to_ship',
  to_ship: 'shipped',
  shipped: 'to_receive',
  to_receive: 'delivered',
};

// @desc  --->  Advance an order's shipping status by exactly one stage
// @route --->  PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  const nextStatus = SHIPPING_TRANSITIONS[order.orderStatus];
  if (!nextStatus || nextStatus !== status) {
    res.status(400).json({
      message: nextStatus
        ? `Invalid status transition. "${order.orderStatus}" can only move to "${nextStatus}".`
        : `Order is "${order.orderStatus}" and cannot be moved through the shipping workflow.`,
    });
    return;
  }

  order.orderStatus = status;
  if (status === 'shipped') order.shippedAt = Date.now();
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    // COD has no separate payment step — the money only actually changes
    // hands once delivery is confirmed. Online payments are already 'paid'
    // well before this point.
    if (order.paymentMethod === 'COD') {
      order.isPaid = true;
      order.paidAt = order.paidAt || Date.now();
      order.paymentStatus = 'paid';
    }
  }
  order.statusHistory.push({ status, changedAt: new Date() });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// Cancellation is only requestable before the order ships.
const CANCELLABLE_STATUSES = ['pending', 'to_ship'];

// @desc  --->  User requests cancellation of their own not-yet-shipped order
// @route --->  PUT /api/orders/:id/cancel-request
// @access  Private
const requestCancellation = async (req, res) => {
  const { reason, details } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403).json({ message: 'Not authorized to modify this order' });
    return;
  }

  if (order.cancelRequest?.status === 'requested') {
    res.status(400).json({ message: 'A cancellation request is already pending for this order.' });
    return;
  }

  if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
    res.status(400).json({
      message: 'This order can no longer be cancelled because it has already been shipped.',
    });
    return;
  }

  if (!reason) {
    res.status(400).json({ message: 'A cancellation reason is required' });
    return;
  }

  order.cancelRequest = {
    requested: true,
    status: 'requested',
    reason,
    details: details || '',
    requestedAt: Date.now(),
    previousStatus: order.orderStatus,
  };
  order.orderStatus = 'cancel_requested';
  order.statusHistory.push({ status: 'cancel_requested', changedAt: new Date(), note: reason });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// @desc  --->  Admin approves a pending cancellation request
// @route --->  PUT /api/orders/:id/cancel/approve
// @access  Private/Admin
const approveCancellation = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (order.orderStatus !== 'cancel_requested') {
    res.status(400).json({ message: 'This order has no pending cancellation request.' });
    return;
  }

  // The order never shipped, so whatever it reserved goes back on the shelf.
  await Promise.all(
    order.orderItems.map((item) =>
      Product.updateOne({ _id: item.product }, { $inc: { countInStock: item.qty } })
    )
  );

  order.orderStatus = 'cancelled';
  order.cancelledAt = Date.now();
  order.cancelRequest.status = 'approved';
  order.cancelRequest.approvedAt = Date.now();

  // No live payment gateway to call out to here — a paid order's refund is
  // recorded as completed immediately; an unpaid (COD, not yet delivered)
  // order never took money in the first place, so no refund is needed.
  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';
    order.refundStatus = 'completed';
  }

  order.statusHistory.push({ status: 'cancelled', changedAt: new Date() });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// @desc  --->  Admin rejects a pending cancellation request, restoring the
//              order's prior shipping status
// @route --->  PUT /api/orders/:id/cancel/reject
// @access  Private/Admin
const rejectCancellation = async (req, res) => {
  const { adminNote } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (order.orderStatus !== 'cancel_requested') {
    res.status(400).json({ message: 'This order has no pending cancellation request.' });
    return;
  }

  order.orderStatus = order.cancelRequest.previousStatus || 'pending';
  order.cancelRequest.status = 'rejected';
  order.cancelRequest.rejectedAt = Date.now();
  order.cancelRequest.requested = false;
  if (adminNote) order.cancelRequest.adminNote = adminNote;
  order.statusHistory.push({ status: order.orderStatus, changedAt: new Date(), note: 'Cancellation request rejected' });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// @desc  --->  User requests a return on their own delivered order
// @route --->  PUT /api/orders/:id/return-request
// @access  Private
const requestReturn = async (req, res) => {
  const { reason, details } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403).json({ message: 'Not authorized to modify this order' });
    return;
  }

  if (order.returnRequest?.status === 'requested') {
    res.status(400).json({ message: 'A return request is already pending for this order.' });
    return;
  }

  if (order.orderStatus !== 'delivered') {
    res.status(400).json({ message: 'Returns can only be requested for delivered orders.' });
    return;
  }

  if (!reason) {
    res.status(400).json({ message: 'A return reason is required' });
    return;
  }

  order.returnRequest = {
    requested: true,
    status: 'requested',
    reason,
    details: details || '',
    requestedAt: Date.now(),
  };
  order.orderStatus = 'return_requested';
  order.statusHistory.push({ status: 'return_requested', changedAt: new Date(), note: reason });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// @desc  --->  Admin approves a pending return request
// @route --->  PUT /api/orders/:id/return/approve
// @access  Private/Admin
const approveReturn = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (order.orderStatus !== 'return_requested') {
    res.status(400).json({ message: 'This order has no pending return request.' });
    return;
  }

  order.orderStatus = 'return_approved';
  order.returnRequest.status = 'approved';
  order.returnRequest.approvedAt = Date.now();
  order.statusHistory.push({ status: 'return_approved', changedAt: new Date() });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// @desc  --->  Admin rejects a pending return request
// @route --->  PUT /api/orders/:id/return/reject
// @access  Private/Admin
const rejectReturn = async (req, res) => {
  const { adminNote } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (order.orderStatus !== 'return_requested') {
    res.status(400).json({ message: 'This order has no pending return request.' });
    return;
  }

  order.orderStatus = 'return_rejected';
  order.returnRequest.status = 'rejected';
  order.returnRequest.rejectedAt = Date.now();
  order.returnRequest.requested = false;
  if (adminNote) order.returnRequest.adminNote = adminNote;
  order.statusHistory.push({ status: 'return_rejected', changedAt: new Date() });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// @desc  --->  Admin marks an approved return as physically completed
// @route --->  PUT /api/orders/:id/return/complete
// @access  Private/Admin
const markReturned = async (req, res) => {
  const { restock } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (order.orderStatus !== 'return_approved') {
    res.status(400).json({ message: 'This order is not approved for return yet.' });
    return;
  }

  // Restocking is the admin's call, not automatic — a returned item may be
  // damaged and not resellable.
  if (restock) {
    await Promise.all(
      order.orderItems.map((item) =>
        Product.updateOne({ _id: item.product }, { $inc: { countInStock: item.qty } })
      )
    );
  }

  order.orderStatus = 'returned';
  order.returnedAt = Date.now();
  order.returnRequest.status = 'returned';
  order.returnRequest.restocked = Boolean(restock);

  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';
    order.refundStatus = 'completed';
  }

  order.statusHistory.push({ status: 'returned', changedAt: new Date() });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// @desc  --->  Start an eSewa (sandbox) payment: sign the order total and
//              hand back the fields the client form-posts to eSewa
// @route --->  POST /api/orders/:id/esewa/initiate
// @access  Private
const initiateEsewaPayment = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (order.isPaid) {
    res.status(400).json({ message: 'Order is already paid' });
    return;
  }

  const transactionUuid = `${order._id}-${Date.now()}`;
  const amount = Number(order.itemsPrice).toFixed(2);
  const taxAmount = Number(order.taxPrice).toFixed(2);
  const productServiceCharge = '0';
  const productDeliveryCharge = Number(order.shippingPrice).toFixed(2);
  const totalAmount = Number(order.totalPrice).toFixed(2);

  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_CONFIG.productCode}`;
  const signature = crypto
    .createHmac('sha256', ESEWA_CONFIG.secretKey)
    .update(message)
    .digest('base64');

  order.paymentResult = { id: transactionUuid, status: 'PENDING' };
  await order.save();

  res.json({
    paymentUrl: ESEWA_CONFIG.paymentUrl,
    fields: {
      amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_CONFIG.productCode,
      product_service_charge: productServiceCharge,
      product_delivery_charge: productDeliveryCharge,
      // eSewa always appends its own "?data=<base64>" to these URLs, even
      // when they already contain a query string (producing a malformed
      // "?esewa=success?data=..." double query). Keep these path-only so
      // eSewa's own "?data=" stays the sole query string on redirect.
      success_url: `${ESEWA_CONFIG.frontendUrl}/order/${order._id}/esewa/success`,
      failure_url: `${ESEWA_CONFIG.frontendUrl}/order/${order._id}/esewa/failure`,
      signed_field_names: signedFieldNames,
      signature,
    },
  });
};

// @desc  --->  Confirm an eSewa payment with eSewa's status-check API and
//              mark the order paid
// @route --->  POST /api/orders/:id/esewa/verify
// @access  Private
const verifyEsewaPayment = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  const transactionUuid = order.paymentResult?.id;
  if (!transactionUuid) {
    res.status(400).json({ message: 'No eSewa transaction found for this order' });
    return;
  }

  const statusUrl = `${ESEWA_CONFIG.statusCheckUrl}?product_code=${ESEWA_CONFIG.productCode}&total_amount=${Number(order.totalPrice).toFixed(2)}&transaction_uuid=${transactionUuid}`;

  const esewaRes = await fetch(statusUrl);
  const data = await esewaRes.json();

  if (data.status === 'COMPLETE') {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'paid';
    order.paymentResult.id = data.ref_id || transactionUuid;
    order.paymentResult.status = data.status;
    order.paymentResult.update_time = new Date().toISOString();
    order.paymentResult.email_address = req.user?.email || '';

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    order.paymentResult.status = data.status || 'FAILED';
    order.paymentStatus = 'failed';
    await order.save();
    res.status(400).json({ message: `Payment not completed. Status: ${data.status || 'UNKNOWN'}` });
  }
};

// @desc  --->  Admin dashboard stats: top-selling products, monthly sales,
//              and the most frequent customers
// @route --->  GET /api/orders/stats
// @access  Private/Admin
const getOrderStats = async (req, res) => {
  const [topProducts, monthlySales, topCustomers, legacyTotals, revenueStats] = await Promise.all([
    Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          qtySold: { $sum: '$orderItems.qty' },
          revenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
        },
      },
      { $sort: { qtySold: -1 } },
      { $limit: 8 },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
        },
      },
      { $sort: { orderCount: -1, totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: User.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          orderCount: 1,
          totalSpent: 1,
        },
      },
    ]),
    Promise.all([User.countDocuments(), Product.countDocuments()]),
    calculateRevenueStats(),
  ]);

  const [totalUsers, totalProducts] = legacyTotals;

  res.json({
    topProducts,
    monthlySales,
    topCustomers,
    totals: {
      ...revenueStats,
      totalUsers,
      totalProducts,
    },
  });
};

//The export includes all functions
export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  updateOrderStatus,
  requestCancellation,
  approveCancellation,
  rejectCancellation,
  requestReturn,
  approveReturn,
  rejectReturn,
  markReturned,
  initiateEsewaPayment,
  verifyEsewaPayment,
  getOrderStats,
};