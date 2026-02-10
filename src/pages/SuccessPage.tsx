import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, Calendar, Clock, MapPin } from 'lucide-react';
import { getProductByPriceId } from '../stripe-config';
import { supabase } from '../lib/supabase';

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const priceId = searchParams.get('price_id');
  const bookingId = searchParams.get('booking_id');
  const [product, setProduct] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (priceId) {
      const foundProduct = getProductByPriceId(priceId);
      setProduct(foundProduct);
      setLoading(false);
    } else if (bookingId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
  }, [priceId, bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          pitches (
            name,
            venue_name,
            location
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {booking ? 'Booking Confirmed!' : 'Payment Successful!'}
            </h1>
            <p className="text-gray-600 mb-6">
              {booking
                ? 'Your booking has been confirmed. We look forward to seeing you!'
                : 'Thank you for your purchase. Your payment has been processed successfully.'}
            </p>

            {booking && (
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">Booking Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{booking.pitches?.name}</p>
                      <p className="text-sm text-gray-600">{booking.pitches?.venue_name}</p>
                      <p className="text-sm text-gray-600">{booking.pitches?.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" />
                    <p className="text-gray-900">{new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" />
                    <p className="text-gray-900">{booking.start_time} ({booking.duration_hours} hour{booking.duration_hours > 1 ? 's' : ''})</p>
                  </div>
                  <div className="border-t border-primary-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Paid:</span>
                      <span className="font-bold text-primary-600 text-lg">LKR {booking.total_price}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {product && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Purchase Details</h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{product.name}</p>
                  <p>{product.description}</p>
                  <p className="font-semibold text-green-600 mt-2">
                    {product.currency} {product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Link
                to="/"
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}