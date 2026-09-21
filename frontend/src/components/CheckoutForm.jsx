import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useSelector } from 'react-redux';
import API from '../api';
import { toast } from 'react-toastify';

const CheckoutForm = ({ order, refetchOrder }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { userInfo } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const paymentResult = {
        id: paymentMethod.id,
        status: 'COMPLETED',
        update_time: new Date().toISOString(),
        email_address: userInfo.email,
      };


      await API.put(`/api/orders/${order._id}/pay`, paymentResult);

      toast.success('Payment Successful!');
      refetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3 p-3 border border-slate-200 rounded-lg">
        <CardElement />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-slate-300 transition-colors"
      >
        {loading ? 'Processing...' : `Pay Rs ${order.totalPrice}/-`}
      </button>
    </form>
  );
};

export default CheckoutForm;
