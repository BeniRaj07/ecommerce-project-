import Order from '../models/orderModel.js';

// Every status an order passes through after being delivered — these all
// represent a completed sale unless the item actually came back.
export const DELIVERED_FAMILY = ['delivered', 'return_requested', 'return_approved', 'return_rejected', 'returned'];

// Counts toward finalized revenue: the sale happened and, even if a return
// was requested/approved/rejected, the money hasn't actually been given
// back yet. Only 'returned' (the item is physically back) removes it.
export const REVENUE_STATUSES = ['delivered', 'return_requested', 'return_approved', 'return_rejected'];

// Still might become revenue or might get cancelled — shown separately so
// it's never counted as finalized.
export const PENDING_REVENUE_STATUSES = ['pending', 'to_ship', 'shipped', 'to_receive', 'cancel_requested'];

// Single source of truth for every dashboard money/count figure, derived
// live from the order records rather than tracked as separate counters
// that could drift out of sync with reality.
export const calculateRevenueStats = async () => {
  const [totalOrders, deliveredOrders, cancelledAgg, returnedAgg, revenueAgg, pendingAgg, cancelRequestsCount, returnRequestsCount] =
    await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: { $in: DELIVERED_FAMILY } }),
      Order.aggregate([
        { $match: { orderStatus: 'cancelled' } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { orderStatus: 'returned' } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { orderStatus: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, amount: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { orderStatus: { $in: PENDING_REVENUE_STATUSES } } },
        { $group: { _id: null, amount: { $sum: '$totalPrice' } } },
      ]),
      Order.countDocuments({ orderStatus: 'cancel_requested' }),
      Order.countDocuments({ orderStatus: 'return_requested' }),
    ]);

  return {
    totalOrders,
    deliveredOrders,
    cancelledOrders: cancelledAgg[0]?.count || 0,
    returnedOrders: returnedAgg[0]?.count || 0,
    totalRevenue: revenueAgg[0]?.amount || 0,
    pendingRevenue: pendingAgg[0]?.amount || 0,
    cancelledAmount: cancelledAgg[0]?.amount || 0,
    refundedAmount: returnedAgg[0]?.amount || 0,
    cancellationRequestsCount: cancelRequestsCount,
    returnRequestsCount: returnRequestsCount,
  };
};
