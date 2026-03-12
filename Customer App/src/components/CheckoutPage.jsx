import { useState } from 'react';
import {
  MapPin, ArrowLeft, ChevronRight, CheckCircle2,
  CreditCard as CardIcon, Smartphone, Plus, Banknote
} from 'lucide-react';

const CheckoutPage = ({ cart, onBack, onPlaceOrder, userProfile, onChangeAddress }) => {
  const [selectedPayment, setSelectedPayment] = useState('UPI');
  const subtotal = cart.reduce((total, item) => total + item.price, 0);
  const deliveryFee = 45;
  const total = subtotal + deliveryFee;

  const groupedItems = cart.reduce((acc, item) => {
    if (!acc[item.id]) {
      acc[item.id] = { ...item, count: 0 };
    }
    acc[item.id].count += 1;
    return acc;
  }, {});

  const defaultAddress = userProfile?.addresses?.[userProfile?.defaultAddressIndex];

  return (
    <div className="checkout-page fade-in">
      <div className="checkout-header">
        <div className="checkout-back" onClick={onBack}>
          <ArrowLeft size={20} />
        </div>
        <h2 className="checkout-title">Checkout</h2>
      </div>

      <div className="checkout-section">
        <div className="checkout-section-title">
          <span>Delivery Address</span>
          <span className="change-link" onClick={onChangeAddress}>Change</span>
        </div>
        {defaultAddress ? (
          <div className="selection-card">
            <div className="icon-wrapper-yellow">
              <MapPin size={20} />
            </div>
            <div className="card-text-group">
              <h4 className="card-main-text">{defaultAddress.label}</h4>
              <p className="card-sub-text">
                {defaultAddress.flatNo && `${defaultAddress.flatNo}, `}
                {defaultAddress.tower && `${defaultAddress.tower}, `}
                {defaultAddress.floor && `Floor ${defaultAddress.floor}, `}
                {defaultAddress.googleAddress}
              </p>
            </div>
          </div>
        ) : (
          <div className="selection-card" onClick={onChangeAddress} style={{ cursor: 'pointer' }}>
            <div className="icon-wrapper-yellow">
              <Plus size={20} />
            </div>
            <div className="card-text-group">
              <h4 className="card-main-text">Add Delivery Address</h4>
              <p className="card-sub-text">Please add an address to continue</p>
            </div>
          </div>
        )}
      </div>

      <div className="checkout-section">
        <div className="checkout-section-title">
          <span>Order Summary</span>
        </div>
        <div className="summary-card">
          {Object.values(groupedItems).map(item => (
            <div key={item.id} className="summary-item-row">
              <div className="item-qty-name">
                <span className="qty-highlight">{item.count}x</span>
                <span>{item.name}</span>
              </div>
              <span style={{ fontWeight: 700 }}>₹{(item.price * item.count).toFixed(2)}</span>
            </div>
          ))}

          <div className="bill-details">
            <div className="bill-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="bill-row">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="bill-row total">
              <span>Total</span>
              <span className="total-amount-large">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="checkout-section">
        <div className="checkout-section-title">
          <span>Payment Method</span>
        </div>
        <div className="payment-list">
          <div
            className={`selection-card ${selectedPayment === 'UPI' ? 'selected' : ''}`}
            onClick={() => setSelectedPayment('UPI')}
          >
            <div className="icon-wrapper-yellow">
              <Smartphone size={20} />
            </div>
            <div className="card-text-group">
              <h4 className="card-main-text">UPI / Google Pay</h4>
              <p className="card-sub-text">Pay directly from your bank</p>
            </div>
            {selectedPayment === 'UPI' && <CheckCircle2 className="check-circle" size={20} />}
          </div>

          <div
            className={`selection-card ${selectedPayment === 'CARD' ? 'selected' : ''}`}
            onClick={() => setSelectedPayment('CARD')}
          >
            <div className="icon-wrapper-yellow">
              <CardIcon size={20} />
            </div>
            <div className="card-text-group">
              <h4 className="card-main-text">Credit / Debit Card</h4>
              <p className="card-sub-text">Visa, Mastercard, RuPay</p>
            </div>
            {selectedPayment === 'CARD' && <CheckCircle2 className="check-circle" size={20} />}
          </div>

          <div
            className={`selection-card ${selectedPayment === 'COD' ? 'selected' : ''}`}
            onClick={() => setSelectedPayment('COD')}
          >
            <div className="icon-wrapper-yellow">
              <Banknote size={20} />
            </div>
            <div className="card-text-group">
              <h4 className="card-main-text">Cash on Delivery</h4>
              <p className="card-sub-text">Pay when you receive the order</p>
            </div>
            {selectedPayment === 'COD' && <CheckCircle2 className="check-circle" size={20} />}
          </div>
        </div>
      </div>

      <div className="place-order-wrapper">
        <button
          className="place-order-btn"
          onClick={onPlaceOrder}
          disabled={!defaultAddress}
          style={!defaultAddress ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          {!defaultAddress ? 'Add Address to Continue' : `Place Order • ₹${total.toFixed(2)}`}
          <ChevronRight size={18} />
        </button>
        <p className="terms-text">By placing order you agree to our Terms & Conditions</p>
      </div>
    </div>
  );
};

export default CheckoutPage;
