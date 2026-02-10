import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Clock, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { StripeCheckout } from '../components/stripe/StripeCheckout';
import { stripeProducts } from '../stripe-config';

interface Pitch {
  id: string;
  name: string;
  location: string;
  price_per_hour: number;
  capacity: number;
  rating: number;
  image_url: string;
  description: string;
}

export function HomePage() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;
      setPitches(data || []);
    } catch (error) {
      console.error('Error fetching pitches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {checkoutError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{checkoutError}</p>
            <button
              onClick={() => setCheckoutError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Book Your Perfect Pitch
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find and book premium football pitches in your area. Play with friends, train with your team, or organize tournaments.
          </p>
        </div>

        {/* Stripe Products Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Bookings</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <StripeCheckout 
              onError={setCheckoutError}
              onSuccess={() => setCheckoutError(null)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pitches...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pitches.map((pitch) => (
              <Link
                key={pitch.id}
                to={`/pitch/${pitch.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={pitch.image_url}
                  alt={pitch.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {pitch.name}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{pitch.location}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm text-gray-600">Up to {pitch.capacity} players</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{pitch.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm text-gray-600">Per hour</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      £{pitch.price_per_hour}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}