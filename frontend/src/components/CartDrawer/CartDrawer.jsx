import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../../store/cartStore';
import useSuitStore from '../../store/suitStore';

function CartDrawer() {
  const { items, isOpen, closeDrawer, removeItem, updateQuantity } = useCartStore();
  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  function handleEditConfig(item) {
    useSuitStore.getState().loadConfig(item.suitConfig);
    closeDrawer();
    navigate('/builder');
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        className="fixed right-0 top-0 h-full w-96 bg-white z-50 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Shopping Cart ({items.length})
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Your cart is empty.</p>
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-4 text-brand-600 underline text-sm"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.cartItemId}
                  item={item}
                  onRemove={removeItem}
                  onQuantityChange={updateQuantity}
                  onEdit={handleEditConfig}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 space-y-3">
            <div className="flex justify-between text-base font-semibold text-gray-900">
              <span>Subtotal</span>
              <span>£{subtotal.toLocaleString()}</span>
            </div>
            <Link
              to="/cart"
              onClick={closeDrawer}
              className="block w-full py-3 bg-brand-600 text-white rounded-lg font-medium text-center hover:bg-brand-700 transition-colors"
            >
              View Cart
            </Link>
            <button
              type="button"
              onClick={closeDrawer}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function CartItem({ item, onRemove, onQuantityChange, onEdit }) {
  const summary = [
    item.suitConfig?.style?.breasting && `${item.suitConfig.style.breasting}-breasted`,
    item.suitConfig?.lapel?.style,
    item.suitConfig?.lining?.color,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex gap-4">
        {/* Fabric swatch */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {item.fabricSwatchUrl ? (
            <img
              src={item.fabricSwatchUrl}
              alt={item.fabricName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              🧵
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{item.fabricName || 'Custom Suit'}</h3>
          {summary && (
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{summary}</p>
          )}
          <p className="text-sm font-semibold text-gray-900 mt-1">
            £{(item.unitPrice * item.quantity).toLocaleString()}
          </p>

          {/* Quantity controls + actions */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center border border-gray-200 rounded text-sm">
              <button
                type="button"
                onClick={() => onQuantityChange(item.cartItemId, item.quantity - 1)}
                aria-label="Decrease quantity"
                className="px-2 py-1 text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <span className="px-3">{item.quantity}</span>
              <button
                type="button"
                onClick={() => onQuantityChange(item.cartItemId, item.quantity + 1)}
                aria-label="Increase quantity"
                className="px-2 py-1 text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => onEdit(item)}
              className="text-xs text-brand-600 hover:underline"
            >
              View/Edit Configuration
            </button>

            <button
              type="button"
              onClick={() => onRemove(item.cartItemId)}
              className="text-xs text-red-500 hover:underline ml-auto"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default CartDrawer;
