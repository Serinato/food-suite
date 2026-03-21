import React from 'react';
import { useOutletContext } from 'react-router-dom';
import OrdersView from '../OrdersView';
// Removed unused RestaurantProfile import

interface OrdersContext {
  restaurantId: string;
  newOrderIds: Set<string>;
  setNewOrderIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const OrdersPage: React.FC = () => {
  const { restaurantId, newOrderIds, setNewOrderIds } = useOutletContext<OrdersContext>();

  return (
    <div className="orders-page-container slide-up">
      <OrdersView
        restaurantId={restaurantId}
        newOrderIds={newOrderIds}
        onClearNewOrder={(id) => setNewOrderIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        })}
      />
    </div>
  );
};

export default OrdersPage;
