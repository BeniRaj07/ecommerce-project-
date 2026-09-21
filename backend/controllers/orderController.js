import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

// @desc   ---> this  Creates new order
// @route   ---> this POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  } else {
    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x._id,
        _id: undefined,
      })),
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
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
  const orders = await Order.find({}).populate('user', 'id name');
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

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc  --->  Admin dashboard stats: top-selling products, monthly sales,
//              and the most frequent customers
// @route --->  GET /api/orders/stats
// @access  Private/Admin
const getOrderStats = async (req, res) => {
  const [topProducts, monthlySales, topCustomers, totals] = await Promise.all([
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
    Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, revenue: { $sum: '$totalPrice' } } }]),
      User.countDocuments(),
      Product.countDocuments(),
    ]),
  ]);

  const [totalOrders, revenueAgg, totalUsers, totalProducts] = totals;

  res.json({
    topProducts,
    monthlySales,
    topCustomers,
    totals: {
      totalOrders,
      totalRevenue: revenueAgg[0]?.revenue || 0,
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
  getOrderStats,
};