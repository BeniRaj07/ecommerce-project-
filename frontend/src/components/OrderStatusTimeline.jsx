import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { SHIPPING_STAGES, SHIPPING_STAGE_LABELS, RETURN_FLOW_STATUSES } from '../data/orderStatus';

// A simple 5-stage progress display: Order Placed -> To Ship -> Shipped ->
// To Receive -> Delivered. Cancelled orders short-circuit to a plain
// "Order Cancelled" line instead of continuing through the normal stages.
const OrderStatusTimeline = ({ status, cancelPreviousStatus }) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-red-600 font-semibold text-sm py-1">
        <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">✕</span>
        Order Cancelled
      </div>
    );
  }

  // Cancellation requests branch off before shipping; return requests only
  // ever happen after delivery. Neither is one of the 5 straight-line
  // stages, so show the timeline as it stood at the point they branched.
  let effectiveStatus = status;
  if (status === 'cancel_requested') effectiveStatus = cancelPreviousStatus || 'pending';
  if (RETURN_FLOW_STATUSES.includes(status)) effectiveStatus = 'delivered';

  const currentIndex = SHIPPING_STAGES.indexOf(effectiveStatus);

  return (
    <div className="flex items-start">
      {SHIPPING_STAGES.map((stage, index) => {
        const done = index <= currentIndex;
        const isLast = index === SHIPPING_STAGES.length - 1;
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center flex-shrink-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  done ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {done && <FaCheck size={11} />}
              </span>
              <span className={`mt-1.5 text-[11px] font-semibold text-center w-20 ${done ? 'text-slate-800' : 'text-slate-400'}`}>
                {SHIPPING_STAGE_LABELS[stage]}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mt-3.5 ${index < currentIndex ? 'bg-brand-600' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default OrderStatusTimeline;
