// Order lifecycle vocab shared by the customer order pages and the admin
// order list — single source of truth for labels, badge colors and the
// business rules around when cancellation/return are allowed.

export const ORDER_STATUS_META = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600' },
  to_ship: { label: 'To Ship', color: 'bg-amber-50 text-amber-700' },
  shipped: { label: 'Shipped', color: 'bg-blue-50 text-blue-700' },
  to_receive: { label: 'To Receive', color: 'bg-blue-50 text-blue-700' },
  delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700' },
  cancel_requested: { label: 'Cancellation Requested', color: 'bg-amber-50 text-amber-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600' },
  return_requested: { label: 'Return Requested', color: 'bg-amber-50 text-amber-700' },
  return_approved: { label: 'Return Approved', color: 'bg-blue-50 text-blue-700' },
  returned: { label: 'Returned', color: 'bg-slate-100 text-slate-600' },
  return_rejected: { label: 'Return Rejected', color: 'bg-red-50 text-red-600' },
};

// Payment status is tracked separately from orderStatus — a delivered
// order isn't proof a payment happened (COD only becomes "paid" once
// delivery is confirmed), and a cancelled/returned order that was paid
// needs its own "refunded" state.
export const PAYMENT_STATUS_META = {
  pending: { label: 'Payment Pending', color: 'bg-amber-50 text-amber-700' },
  paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700' },
  failed: { label: 'Payment Failed', color: 'bg-red-50 text-red-600' },
  refunded: { label: 'Refunded', color: 'bg-slate-100 text-slate-600' },
  partially_refunded: { label: 'Partially Refunded', color: 'bg-slate-100 text-slate-600' },
};

export const CANCEL_REASONS = [
  'Ordered by mistake',
  'Wrong size',
  'Wrong product',
  'Changed my mind',
  'Delivery taking too long',
  'Other',
];

export const RETURN_REASONS = [
  'Wrong size',
  'Damaged product',
  'Wrong item received',
  'Product different from description',
  'Quality issue',
  'Other',
];

// The straight-line shipping path shown in the timeline + used for the
// admin's one-stage-at-a-time "advance" actions.
export const SHIPPING_STAGES = ['pending', 'to_ship', 'shipped', 'to_receive', 'delivered'];
export const SHIPPING_STAGE_LABELS = {
  pending: 'Order Placed',
  to_ship: 'To Ship',
  shipped: 'Shipped',
  to_receive: 'To Receive',
  delivered: 'Delivered',
};

export const RETURN_FLOW_STATUSES = ['return_requested', 'return_approved', 'returned', 'return_rejected'];
export const CANCEL_FLOW_STATUSES = ['cancel_requested', 'cancelled'];

export const isCancelOrReturnStatus = (status) =>
  CANCEL_FLOW_STATUSES.includes(status) || RETURN_FLOW_STATUSES.includes(status);

export const canRequestCancellation = (status) => ['pending', 'to_ship'].includes(status);
export const canRequestReturn = (status) => status === 'delivered';
