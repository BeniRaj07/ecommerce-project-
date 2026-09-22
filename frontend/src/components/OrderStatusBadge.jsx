import React from 'react';
import { ORDER_STATUS_META } from '../data/orderStatus';

const OrderStatusBadge = ({ status }) => {
  const meta = ORDER_STATUS_META[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${meta.color}`}>
      {meta.label}
    </span>
  );
};

export default OrderStatusBadge;
