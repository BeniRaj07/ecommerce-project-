import React, { useState } from 'react';
import API from '../api';
import { toast } from 'react-toastify';

// Builds and submits a hidden form to eSewa's sandbox payment page, exactly
// as eSewa's ePay v2 API expects (redirect-based checkout, not embedded).
const redirectToEsewa = (paymentUrl, fields) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentUrl;

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

const EsewaCheckout = ({ order }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data } = await API.post(`/api/orders/${order._id}/esewa/initiate`);
      redirectToEsewa(data.paymentUrl, data.fields);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-slate-300 transition-colors"
    >
      {loading ? 'Redirecting to eSewa...' : `Pay Rs ${order.totalPrice}/- with eSewa`}
    </button>
  );
};

export default EsewaCheckout;
