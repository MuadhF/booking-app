import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { stripeProducts, type StripeProduct } from '../../stripe-config';
import { CreditCard, Loader2 } from 'lucide-react';

interface StripeCheckoutProps {
  product?: StripeProduct;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function StripeCheckout({ product, onSuccess, onError }: StripeCheckoutProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StripeProduct | null>(product || null);

  const handleCheckout = async (productToCheckout: StripeProduct) => {
    if (!user) {
      onError?.('Please login to make a purchase');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        onError?.('Authentication required');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: productToCheckout.priceId,
          mode: productToCheckout.mode,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}&price_id=${productToCheckout.priceId}`,
          cancel_url: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      onError?.(error.message || 'Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  if (product) {
    return (
      <button
        onClick={() => handleCheckout(product)}
        disabled={loading || !user}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4 mr-2" />
        )}
        {loading ? 'Processing...' : `Purchase for ${product.currency} ${product.price.toLocaleString()}`}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Available Products</h3>
      
      {stripeProducts.map((prod) => (
        <div key={prod.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium text-gray-900">{prod.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{prod.description}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600">
                {prod.currency} {prod.price.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 capitalize">{prod.mode}</p>
            </div>
          </div>
          
          <button
            onClick={() => handleCheckout(prod)}
            disabled={loading || !user}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Processing...' : 'Purchase Now'}
          </button>
        </div>
      ))}

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            Please login to make a purchase.
          </p>
        </div>
      )}
    </div>
  );
}