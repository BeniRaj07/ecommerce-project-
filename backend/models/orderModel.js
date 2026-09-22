import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // This creates a relationship to the User model
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product', // This creates a relationship to the Product model
        },
        selectedSize: { type: mongoose.Schema.Types.Mixed },
        selectedColor: { type: String },
        reviewed: { type: Boolean, default: false },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      location: { type: String, required: true },
      country: { type: String, required: true, default: 'Nepal' },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: { // This is for GST
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: { 
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },

    // Separate from orderStatus/isPaid: whether money has actually moved.
    // COD orders sit at 'pending' until the delivery itself is confirmed;
    // online payments flip to 'paid' as soon as the gateway confirms.
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
    },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'completed', 'failed'],
      default: 'none',
    },

    // Fulfillment lifecycle. isPaid/isDelivered above stay in sync with this
    // (kept as-is since existing code — stats, review gating, order page —
    // already reads them) rather than being replaced by it.
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'to_ship',
        'shipped',
        'to_receive',
        'delivered',
        'cancel_requested',
        'cancelled',
        'return_requested',
        'return_approved',
        'returned',
        'return_rejected',
      ],
      default: 'pending',
    },
    shippedAt: { type: Date },
    cancelledAt: { type: Date },
    returnedAt: { type: Date },

    cancelRequest: {
      requested: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected'],
        default: 'none',
      },
      reason: { type: String },
      details: { type: String },
      requestedAt: { type: Date },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      // Admin's optional note explaining a rejection.
      adminNote: { type: String },
      // Shipping status to restore if the admin rejects the request —
      // cancellation is only requestable from 'pending' or 'to_ship'.
      previousStatus: { type: String },
    },

    returnRequest: {
      requested: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected', 'returned'],
        default: 'none',
      },
      reason: { type: String },
      details: { type: String },
      requestedAt: { type: Date },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      // Admin's optional note explaining a rejection.
      adminNote: { type: String },
      // Whether the returned item was put back into sellable stock —
      // set when the admin marks the return complete.
      restocked: { type: Boolean },
    },

    // Audit trail of every fulfillment/lifecycle transition, so the order
    // detail page can show a real history instead of re-deriving one from
    // whatever the current status happens to be.
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;