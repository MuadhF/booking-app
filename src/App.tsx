import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase, pitchesApi, bookingsApi, type Pitch, type Booking } from './lib/supabase';
import Header from './components/Header';
import ContactPage from './components/ContactPage';
import VenuesPage from './components/VenuesPage';
import VenueLogin from './components/VenueLogin';
import VenueDashboard from './components/VenueDashboard';

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

function App() {
  const [currentStep, setCurrentStep] = useState<'pitches' | 'booking' | 'confirmation'>('pitches');
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [venueSession, setVenueSession] = useState<{venueId: string, venueName: string} | null>(null);
  const [pitches, setPitches] = useState<Pitch[]>([]);
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

  // Load pitches on component mount
  useEffect(() => {
    loadPitches();
  }, []);

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

      const bookingData = {
        pitch_id: selectedPitch.id,
        booking_date: selectedDate,
        start_time: selectedTime,
        duration_hours: duration,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
        total_price: selectedPitch.price_per_hour * duration
      };

      const newBooking = await bookingsApi.create(bookingData);
      setBooking(newBooking);
      setCurrentStep('confirmation');
    } catch (err) {
      setError('Failed to create booking. Please try again.');
      console.error('Error creating booking:', err);
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
    if (page === 'home' || page === 'venues') {
      // Reset to pitches view when going to home or venues
      setCurrentStep('pitches');
      setVenueSession(null);
    } else if (page === 'venue-portal') {
      setVenueSession(null);
    }
  };

  const handleVenueLogin = (venueId: string, venueName: string) => {
    setVenueSession({ venueId, venueName });
  };

  const handleVenueLogout = () => {
    setVenueSession(null);
    setCurrentPage('home');
  };

  // Render contact page
  if (currentPage === 'contact') {
    return (
      <div>
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
        <ContactPage />
      </div>
    );
  }

  // Render venue portal
  if (currentPage === 'venue-portal') {
    if (!venueSession) {
      return (
        <div>
          <Header currentPage={currentPage} onPageChange={handlePageChange} />
          <VenueLogin onLogin={handleVenueLogin} />
        </div>
      );
    } else {
      return (
        <VenueDashboard 
          venueId={venueSession.venueId}
          venueName={venueSession.venueName}
          onLogout={handleVenueLogout}
        />
      );
    }
  }

  // Render venues page
  if (currentPage === 'venues') {
    return (
      <div>
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
        <VenuesPage />
      </div>
    );
  }

  if (loading && pitches.length === 0) {
    return (
      <div>
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pitches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'confirmation' && booking) {
    return (
      <div>
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
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
                          <p className="font-semibold text-gray-900">{booking.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Price</p>
                          <p className="font-semibold text-green-600 text-lg">£{booking.total_price}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Please arrive 15 minutes before your booking time</li>
                      <li>• Bring appropriate sports equipment and footwear</li>
                      <li>• Cancellations must be made 24 hours in advance</li>
                      <li>• A confirmation email has been sent to {booking.customer_email}</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={resetForm}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
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
      </div>
    );
  }

  if (currentStep === 'booking' && selectedPitch) {
    return (
      <div>
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
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
                <div className="bg-gradient-to-r from-green-500 to-blue-600 px-8 py-6">
                  <h1 className="text-2xl font-bold text-white">Book Your Pitch</h1>
                  <p className="text-green-100 mt-1">{selectedPitch.name}</p>
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
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                  ? 'bg-green-600 text-white shadow-lg'
                                  : slot.available
                                  ? 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={customerDetails.name}
                              onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              required
                            />
                          </div>
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
                              <span className="font-bold text-green-600 text-lg">£{selectedPitch.price_per_hour * duration}</span>
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
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creating Booking...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header currentPage={currentPage} onPageChange={handlePageChange} />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {currentPage === 'venues' ? 'Our Football Venues' : 'Book Your Football Pitch'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our premium football facilities and secure your perfect match time
            </p>
          </div>

          {error && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pitches.map((pitch) => (
              <div key={pitch.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                <div className="relative">
                  <img
                    src={pitch.image_url}
                    alt={pitch.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold border-4 border-white shadow-lg">
                    £{pitch.price_per_hour}/hour
                  </div>
                </div>
              
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pitch.name}</h3>
                
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
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                
                  <button
                    onClick={() => handlePitchSelect(pitch)}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 mt-auto"
                  >
                    <Clock className="w-5 h-5" />
                    <span>Book Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;