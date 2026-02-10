import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getProductByPriceId } from '../../stripe-config';
import { Crown, AlertCircle, CheckCircle } from 'lucide-react';

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
}

export function SubscriptionStatus() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return null;
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return null;
  }

  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null;
  const isActive = subscription.subscription_status === 'active';
  const isPastDue = subscription.subscription_status === 'past_due';
  const isCanceled = subscription.subscription_status === 'canceled';

  const getStatusIcon = () => {
    if (isActive) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (isPastDue) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    if (isCanceled) return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <Crown className="w-5 h-5 text-blue-500" />;
  };

  const getStatusColor = () => {
    if (isActive) return 'bg-green-50 border-green-200 text-green-800';
    if (isPastDue) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    if (isCanceled) return 'bg-red-50 border-red-200 text-red-800';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {product ? product.name : 'Active Subscription'}
            </h3>
            <span className="text-sm font-medium capitalize">
              {subscription.subscription_status.replace('_', ' ')}
            </span>
          </div>
          
          {subscription.current_period_end && (
            <p className="text-sm mt-1">
              {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
              {formatDate(subscription.current_period_end)}
            </p>
          )}
          
          {subscription.cancel_at_period_end && (
            <p className="text-sm mt-1 font-medium">
              Subscription will not renew
            </p>
          )}
        </div>
      </div>
    </div>
  );
}