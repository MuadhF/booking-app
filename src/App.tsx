import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle, ArrowLeft, AlertCircle, Star } from 'lucide-react';
import { supabase, pitchesApi, bookingsApi, playerAuthApi, reviewsApi, type Pitch, type Booking } from './lib/supabase';
import Header from './components/Header';
import Footer from './components/Footer';
import ContactPage from './components/ContactPage';
import VenuesPage from './components/VenuesPage';
import VenueLogin from './components/VenueLogin';
import VenueDashboard from './components/VenueDashboard';
import PlayerLogin from './components/PlayerLogin';
import PlayerProfile from './components/PlayerProfile';
import PasswordReset from './components/PasswordReset';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import FAQs from './components/FAQs';
import CancellationPolicy from './components/CancellationPolicy';
import UpcomingBookings from './components/UpcomingBookings';
import PitchFilters from './components/PitchFilters';
import type { FilterOptions } from './components/PitchFilters';
import { useAuth } from './hooks/useAuth';
import { SubscriptionStatus } from './components/stripe/SubscriptionStatus';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingForm {
  pitchId: string;
  pitchName: string;
  date: string;
  time: string;
  duration: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
}

const timeSlots: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '10:00', available: true },
  { time: '11:00', available: true },
  { time: '12:00', available: true },
  { time: '13:00', available: true },
  { time: '14:00', available: true },
  { time: '15:00', available: true },
  { time: '16:00', available: true },
  { time: '17:00', available: true },
  { time: '18:00', available: true },
  { time: '19:00', available: true },
  { time: '20:00', available: true }
];

export default function App() {
  const [currentStep, setCurrentStep] = useState<'pitches' | 'booking' | 'confirmation'>('pitches');
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [venueSession, setVenueSession] = useState<{venueId: string, venueName: string} | null>(null);
  const [user, setUser] = useState<any>(null);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [filteredPitches, setFilteredPitches] = useState<Pitch[]>([]);
  const [pitchRatings, setPitchRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [booking, setBooking] = useState<Booking | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(timeSlots);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [filters, setFilters] = useState<FilterOptions>({
    locations: [],
    minCapacity: 0,
    maxCapacity: 22,
    minPrice: 0,
    maxPrice: 5000,
    hasToilets: false,
    hasChangingRooms: false,
    sortBy: 'none'
  });

  const { user: authUser, loading: authLoading } = useAuth();

  // Update customer details when user or player profile changes
  useEffect(() => {
    if (user && playerProfile) {
      setCustomerDetails(prev => ({
        name: prev.name || playerProfile.full_name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || playerProfile.phone || ''
      }));
    } else if (user && !playerProfile) {
      setCustomerDetails(prev => ({
        name: prev.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || ''
      }));
    }
  }, [user, playerProfile]);

  // Load pitches on component mount
  useEffect(() => {
    loadPitches();
    checkAuthState();
    checkResetPasswordLink();
  }, []);

  const checkResetPasswordLink = () => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setCurrentPage('reset-password');
    }
  };

  // Apply filters and sorting when pitches or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [pitches, filters]);

  // Check authentication state
  const checkAuthState = async () => {
    try {
      const currentUser = await playerAuthApi.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser?.id) {
        try {
          const profile = await playerAuthApi.getProfile(currentUser.id);
          setPlayerProfile(profile);
        } catch (err) {
          console.error('Error fetching player profile:', err);
          setPlayerProfile(null);
        }
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
    }
  };

  // Check availability when date or pitch changes
  useEffect(() => {
    if (selectedDate && selectedPitch) {
      checkAvailability();
    }
  }, [selectedDate, selectedPitch]);

  const loadPitches = async () => {
    try {
      setLoading(true);
      
      // If Supabase is not configured, use mock data
      if (!supabase) {
        const mockPitches = [
          {
            id: '1',
            name: 'Premier League Stadium',
            location: 'Manchester City Centre',
            capacity: 22,
            price_per_hour: 85,
            amenities: ['Floodlights', 'Changing Rooms', 'Parking', 'Refreshments', 'Equipment Storage'],
            image_url: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Championship Ground',
            location: 'Birmingham Sports Complex',
            capacity: 18,
            price_per_hour: 65,
            amenities: ['Floodlights', 'Changing Rooms', 'Parking', 'First Aid'],
            image_url: 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Community Sports Field',
            location: 'Leeds Recreation Park',
            capacity: 14,
            price_per_hour: 45,
            amenities: ['Changing Rooms', 'Parking', 'Water Fountain'],
            image_url: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setPitches(mockPitches);
      } else {
        const data = await pitchesApi.getAll();
        setPitches(data);

        try {
          const ratingsPromises = data.map(pitch =>
            reviewsApi.getAverageRating(pitch.id)
          );
          const ratings = await Promise.all(ratingsPromises);
          const ratingsMap: Record<string, { average: number; count: number }> = {};
          data.forEach((pitch, index) => {
            ratingsMap[pitch.id] = ratings[index];
          });
          setPitchRatings(ratingsMap);
        } catch (ratingsErr) {
          console.log('Could not load ratings, continuing without them:', ratingsErr);
        }
      }
    } catch (err) {
      setError('Failed to load pitches. Please try again.');
      console.error('Error loading pitches:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!selectedDate || !selectedPitch) return;

    try {
      const existingBookings = await bookingsApi.getByDateAndPitch(selectedDate, selectedPitch.id);
      
      const updatedSlots = timeSlots.map(slot => {
        const isBooked = existingBookings.some(booking => {
          const bookingStart = booking.start_time;
          const bookingEnd = addHours(bookingStart, booking.duration_hours);
          const slotTime = slot.time;
          
          return slotTime >= bookingStart && slotTime < bookingEnd;
        });
        
        return {
          ...slot,
          available: !isBooked
        };
      });
      
      setAvailableSlots(updatedSlots);
    } catch (err) {
      console.error('Error checking availability:', err);
    }
  };

  const addHours = (time: string, hours: number): string => {
    const [hour, minute] = time.split(':').map(Number);
    const newHour = (hour + hours) % 24;
    return `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const applyFiltersAndSort = () => {
    let filtered = [...pitches];

    // Apply location filter
    if (filters.locations.length > 0) {
      filtered = filtered.filter(pitch =>
        filters.locations.includes(pitch.location)
      );
    }

    // Apply capacity filter
    filtered = filtered.filter(pitch =>
      pitch.capacity >= filters.minCapacity && pitch.capacity <= filters.maxCapacity
    );

    // Apply price filter
    filtered = filtered.filter(pitch =>
      pitch.price_per_hour >= filters.minPrice && pitch.price_per_hour <= filters.maxPrice
    );

    // Apply amenities filter
    if (filters.hasToilets) {
      filtered = filtered.filter(pitch =>
        pitch.amenities.some(a => a.toLowerCase().includes('toilet'))
      );
    }

    if (filters.hasChangingRooms) {
      filtered = filtered.filter(pitch =>
        pitch.amenities.some(a => a.toLowerCase().includes('changing'))
      );
    }

    // Apply sorting
    if (filters.sortBy === 'price-low') {
      filtered.sort((a, b) => a.price_per_hour - b.price_per_hour);
    } else if (filters.sortBy === 'price-high') {
      filtered.sort((a, b) => b.price_per_hour - a.price_per_hour);
    } else if (filters.sortBy === 'capacity-low') {
      filtered.sort((a, b) => a.capacity - b.capacity);
    } else if (filters.sortBy === 'capacity-high') {
      filtered.sort((a, b) => b.capacity - a.capacity);
    }

    setFilteredPitches(filtered);
  };

  const handlePitchSelect = (pitch: Pitch) => {
    setSelectedPitch(pitch);
    setCurrentStep('booking');
    setSelectedTime('');
    setSelectedDate('');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPitch || !selectedDate || !selectedTime) return;

    try {
      setLoading(true);
      setError(null);

      // Debug: Log the current form state
      console.log('=== BOOKING FORM DEBUG ===');
      console.log('Customer Details State:', customerDetails);
      console.log('User Profile:', playerProfile);
      console.log('Selected Pitch:', selectedPitch);
      console.log('Form Values:', {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone
      });

      const bookingData = {
        pitch_id: selectedPitch.id,
        booking_date: selectedDate,
        start_time: selectedTime,
        duration_hours: duration,
        total_price: selectedPitch.price_per_hour * duration,
        player_id: user?.id || undefined,
        guest_name: !user ? customerDetails.name : undefined,
        guest_email: !user ? customerDetails.email : undefined,
        guest_phone: !user ? customerDetails.phone : undefined,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cash' ? 'completed' : 'pending',
        status: paymentMethod === 'cash' ? 'confirmed' : 'pending'
      };

      if (paymentMethod === 'online') {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pitch-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            bookingData,
            pitchName: selectedPitch.name,
            venueName: selectedPitch.venue_name || 'Football Venue'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }

        const { url } = await response.json();
        window.location.href = url;
      } else {
        const newBooking = await bookingsApi.create(bookingData);
        setBooking(newBooking);
        setCurrentStep('confirmation');
      }
    } catch (err) {
      setError('Failed to create booking. Please try again.');
      console.error('=== BOOKING CREATION ERROR ===');
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const resetForm = () => {
    setCurrentStep('pitches');
    setSelectedPitch(null);
    setSelectedDate('');
    setSelectedTime('');
    setDuration(1);
    setCustomerDetails({ name: '', email: '', phone: '' });
    setBooking(null);
    setError(null);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
    if (page === 'home' || page === 'venues') {
      // Reset to pitches view when going to home or venues
      setCurrentStep('pitches');
      setVenueSession(null);
    } else if (page === 'venue-portal') {
      setVenueSession(null);
    }
  };

  const handlePlayerLogin = (loggedInUser: any) => {
    setUser(loggedInUser.user);
    
    // Fetch player profile after login
    if (loggedInUser.user?.id) {
      playerAuthApi.getProfile(loggedInUser.user.id)
        .then(profile => setPlayerProfile(profile))
        .catch(err => {
          console.error('Error fetching player profile after login:', err);
          setPlayerProfile(null);
        });
    }
    
    setCurrentPage('home');
  };

  const handlePlayerSignOut = () => {
    playerAuthApi.signOut().then(() => {
      setUser(null);
      setPlayerProfile(null);
      // Reset booking state when signing out
      setCurrentStep('pitches');
      setSelectedPitch(null);
      setSelectedDate('');
      setSelectedTime('');
      setDuration(1);
      setCustomerDetails({ name: '', email: '', phone: '' });
      setBooking(null);
      setError(null);
      setCurrentPage('home');
    }).catch((error) => {
      console.error('Sign out error:', error);
      // Force clear user state even if signOut fails
      setUser(null);
      setPlayerProfile(null);
      // Reset booking state when signing out
      setCurrentStep('pitches');
      setSelectedPitch(null);
      setSelectedDate('');
      setSelectedTime('');
      setDuration(1);
      setCustomerDetails({ name: '', email: '', phone: '' });
      setBooking(null);
      setError(null);
      setCurrentPage('home');
    });
  };

  const handleVenueLogin = (venueId: string, venueName: string) => {
    setVenueSession({ venueId, venueName });
  };

  const handleVenueLogout = () => {
    setVenueSession(null);
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render contact page
  if (currentPage === 'contact') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <ContactPage />
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  // Render terms and conditions page
  if (currentPage === 'terms') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <TermsAndConditions />
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  // Render privacy policy page
  if (currentPage === 'privacy') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <PrivacyPolicy />
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  // Render FAQs page
  if (currentPage === 'faqs') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <FAQs />
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  // Render cancellation policy page
  if (currentPage === 'cancellation') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <CancellationPolicy />
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  // Render player login page
  if (currentPage === 'login') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <PlayerLogin onLogin={handlePlayerLogin} />
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  // Render password reset page
  if (currentPage === 'reset-password') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <PasswordReset />
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  // Render player profile page
  if (currentPage === 'profile' && user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <PlayerProfile user={user} />
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  // Render venue portal
  if (currentPage === 'venue-portal') {
    if (!venueSession) {
      return (
        <div className="flex flex-col min-h-screen">
          <Header
            currentPage={currentPage}
            onPageChange={handlePageChange}
            user={user}
            onSignOut={handlePlayerSignOut}
          />
          <VenueLogin onLogin={handleVenueLogin} />
          <Footer onPageChange={handlePageChange} />
        </div>
      );
    } else {
      return (
        <VenueDashboard
          venueId={venueSession.venueId}
          venueName={venueSession.venueName}
          onLogout={handleVenueLogout}
          onPageChange={handlePageChange}
        />
      );
    }
  }

  // Render venues page
  if (currentPage === 'venues') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <VenuesPage />
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  if (loading && pitches.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <div className="flex-1 bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pitches...</p>
          </div>
        </div>
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  if (currentStep === 'confirmation' && booking) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <div className="flex-1 bg-gradient-to-br from-primary-50 to-secondary-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-white" />
                    <h1 className="text-2xl font-bold text-white">Booking Confirmed!</h1>
                  </div>
                </div>
              
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Booking Reference</p>
                          <p className="font-semibold text-gray-900">#{booking.id.slice(-8).toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Pitch</p>
                          <p className="font-semibold text-gray-900">{selectedPitch?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-semibold text-gray-900">{formatDate(booking.booking_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Time</p>
                          <p className="font-semibold text-gray-900">{booking.start_time} ({booking.duration_hours}h)</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="font-semibold text-gray-900">
                            {(booking as any).guests?.name || (booking as any).player_profiles?.full_name || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Price</p>
                          <p className="font-semibold text-primary-600 text-lg">LKR {booking.total_price}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-secondary-900 mb-2">Important Information</h3>
                    <ul className="text-sm text-secondary-800 space-y-1">
                      <li>• Please arrive 15 minutes before your booking time</li>
                      <li>• Bring appropriate sports equipment and footwear</li>
                      <li>• Cancellations must be made 24 hours in advance</li>
                      <li>• A confirmation email has been sent to {(booking as any).guests?.email || (booking as any).player_profiles?.email || customerDetails.email}</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={resetForm}
                      className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Book Another Pitch
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Print Confirmation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  if (currentStep === 'booking' && selectedPitch) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          onPageChange={handlePageChange}
          user={user}
          onSignOut={handlePlayerSignOut}
        />
        <div className="flex-1 bg-gradient-to-br from-primary-50 to-secondary-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setCurrentStep('pitches')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Pitches</span>
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-600 px-8 py-6">
                  <h1 className="text-2xl font-bold text-white">Book Your Pitch</h1>
                  <p className="text-primary-100 mt-1">{selectedPitch.name}</p>
                </div>

                <form onSubmit={handleBookingSubmit} className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={getTomorrowDate()}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Available Time Slots
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`p-3 rounded-lg text-sm font-medium transition-all ${
                                selectedTime === slot.time
                                  ? 'bg-primary-600 text-white shadow-lg'
                                  : slot.available
                                  ? 'bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700'
                                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Duration (hours)
                        </label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value={1}>1 hour</option>
                          <option value={2}>2 hours</option>
                          <option value={3}>3 hours</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                        {user ? (
                          <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4">
                            <p className="text-secondary-800 text-sm mb-2">
                              <strong>Signed in as:</strong> {user.email}
                            </p>
                            {playerProfile && (
                              <p className="text-secondary-800 text-sm mb-2">
                                <strong>Name:</strong> {playerProfile.full_name}
                              </p>
                            )}
                            {playerProfile?.phone && (
                              <p className="text-secondary-800 text-sm mb-2">
                                <strong>Phone:</strong> {playerProfile.phone}
                              </p>
                            )}
                            <p className="text-secondary-700 text-xs mt-3">
                              Your booking will be automatically linked to your account
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={customerDetails.name}
                                onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                              </label>
                              <input
                                type="email"
                                value={customerDetails.email}
                                onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                value={customerDetails.phone}
                                onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Payment Method</h4>
                        <div className="space-y-3">
                          <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50"
                                 style={{borderColor: paymentMethod === 'cash' ? '#10b981' : '#e5e7eb'}}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cash"
                              checked={paymentMethod === 'cash'}
                              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'online')}
                              className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">Pay with Cash</div>
                              <div className="text-sm text-gray-600">Pay at the venue when you arrive</div>
                            </div>
                          </label>

                          <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50"
                                 style={{borderColor: paymentMethod === 'online' ? '#10b981' : '#e5e7eb'}}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="online"
                              checked={paymentMethod === 'online'}
                              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'online')}
                              className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">Pay Online</div>
                              <div className="text-sm text-gray-600">Pay securely with credit/debit card via Stripe</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Booking Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pitch:</span>
                            <span className="font-medium">{selectedPitch.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{selectedDate ? formatDate(selectedDate) : 'Not selected'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time:</span>
                            <span className="font-medium">{selectedTime || 'Not selected'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{duration} hour{duration > 1 ? 's' : ''}</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 mt-3">
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-900">Total:</span>
                              <span className="font-bold text-primary-600 text-lg">LKR {selectedPitch.price_per_hour * duration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('pitches')}
                      className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedDate || !selectedTime || loading}
                      className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {paymentMethod === 'online' ? 'Redirecting to payment...' : 'Creating Booking...'}
                        </>
                      ) : (
                        paymentMethod === 'online' ? 'Proceed to Payment' : 'Confirm Booking'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <Footer onPageChange={handlePageChange} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {user && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <SubscriptionStatus />
          </div>
        </div>
      )}
      <Header
        currentPage={currentPage}
        onPageChange={handlePageChange}
        user={user}
        onSignOut={handlePlayerSignOut}
      />
            <div className="flex-1 bg-gradient-to-br from-green-50 to-blue-50">
              <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {currentPage === 'venues' ? 'Our Football Venues' : 'Book Your Football Pitch'}
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Choose from our premium football facilities and secure your perfect match time
                  </p>
                  {!user && (
                    <div className="mt-4 p-4 bg-secondary-50 border border-secondary-200 rounded-xl max-w-md mx-auto">
                      <p className="text-secondary-800 text-sm">
                        <strong>Tip:</strong> <button
                          onClick={() => setCurrentPage('login')}
                          className="text-secondary-600 hover:text-secondary-700 underline"
                        >
                          Sign in
                        </button> to track your bookings and enjoy faster checkout!
                      </p>
                    </div>
                  )}
                </div>

                {user && (
                  <div className="max-w-4xl mx-auto mb-8">
                    <UpcomingBookings userId={user.id} showPastBookings={false} />
                  </div>
                )}

                {error && (
                  <div className="max-w-4xl mx-auto mb-8">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <div className="max-w-7xl mx-auto">
                  <PitchFilters
                    allLocations={Array.from(new Set(pitches.map(p => p.location)))}
                    maxCapacityInData={Math.max(...pitches.map(p => p.capacity), 22)}
                    maxPriceInData={Math.max(...pitches.map(p => p.price_per_hour), 5000)}
                    onFiltersChange={setFilters}
                  />
                </div>

                {filteredPitches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No pitches match your filters. Try adjusting your search criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPitches.map((pitch) => {
                      const rating = pitchRatings[pitch.id];
                      return (
                        <div key={pitch.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                          <div className="relative">
                            <img
                              src={pitch.image_url}
                              alt={pitch.name}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold border-4 border-white shadow-lg">
                              LKR {pitch.price_per_hour}/hour
                            </div>
                          </div>

                          <div className="p-6 flex flex-col flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{pitch.name}</h3>

                            {rating && rating.count > 0 && (
                              <div className="flex items-center space-x-1 mb-2">
                                <div className="flex space-x-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= Math.round(rating.average)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {rating.average.toFixed(1)} ({rating.count})
                                </span>
                              </div>
                            )}
                    
                            <div className="flex items-center text-gray-600 mb-2">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="text-sm">{pitch.location}</span>
                            </div>
                    
                            <div className="flex items-center text-gray-600 mb-4">
                              <Users className="w-4 h-4 mr-2" />
                              <span className="text-sm">Up to {pitch.capacity} players</span>
                            </div>
                    
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Amenities:</h4>
                              <div className="flex flex-wrap gap-1">
                                {pitch.amenities.map((amenity, index) => (
                                  <span
                                    key={index}
                                    className="bg-secondary-100 text-secondary-800 text-xs px-2 py-1 rounded-full"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </div>
                    
                            <button
                              onClick={() => handlePitchSelect(pitch)}
                              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 flex items-center justify-center space-x-2 mt-auto"
                            >
                              <Clock className="w-5 h-5" />
                              <span>Book Now</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
      <Footer onPageChange={handlePageChange} />
    </div>
  );
}