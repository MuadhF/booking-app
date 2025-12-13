import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, MapPin, Users, Clock, Star } from 'lucide-react';
import { pitchesApi, type Pitch } from '../lib/supabase';

interface GroupedPitches {
  [location: string]: Pitch[];
}

export default function VenuesPage() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [groupedPitches, setGroupedPitches] = useState<GroupedPitches>({});
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPitches();
  }, []);

  const loadPitches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load from Supabase, fallback to mock data
      let pitchData: Pitch[];
      
      try {
        pitchData = await pitchesApi.getAll();
      } catch (err) {
        // Fallback to mock data if Supabase is not configured
        pitchData = [
          {
            id: '1',
            name: 'Premier Football Arena',
            location: 'Mount Lavinia',
            capacity: 14,
            price_per_hour: 3500,
            amenities: ['Toilets', 'Audience seats', 'Shaded Pitch'],
            image_url: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Elite Sports Complex',
            location: 'Kalubowila',
            capacity: 18,
            price_per_hour: 3700,
            amenities: ['Toilets', 'Changing Rooms', 'Parking', 'Shaded Pitch'],
            image_url: 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Championship Futsal Ground',
            location: 'Colombo 07',
            capacity: 22,
            price_per_hour: 4500,
            amenities: ['Toilets', 'Changing Rooms', 'Water Station', 'Restaurant', 'Shaded Pitch'],
            image_url: 'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            name: 'Community Sports Field',
            location: 'Mount Lavinia',
            capacity: 16,
            price_per_hour: 2800,
            amenities: ['Toilets', 'Parking', 'Water Station'],
            image_url: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '5',
            name: 'Urban Football Hub',
            location: 'Colombo 07',
            capacity: 20,
            price_per_hour: 4200,
            amenities: ['Toilets', 'Changing Rooms', 'Parking', 'Restaurant', 'Equipment Storage'],
            image_url: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      }
      
      setPitches(pitchData);
      
      // Group pitches by location
      const grouped = pitchData.reduce((acc: GroupedPitches, pitch) => {
        if (!acc[pitch.location]) {
          acc[pitch.location] = [];
        }
        acc[pitch.location].push(pitch);
        return acc;
      }, {});
      
      setGroupedPitches(grouped);
      
      // Expand first location by default
      const firstLocation = Object.keys(grouped)[0];
      if (firstLocation) {
        setExpandedLocations(new Set()); // Start with all sections collapsed
      }
      
    } catch (err) {
      setError('Failed to load venues. Please try again.');
      console.error('Error loading pitches:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (location: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(location)) {
      newExpanded.delete(location);
    } else {
      newExpanded.add(location);
    }
    setExpandedLocations(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPitches}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Football Venues
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our premium football facilities across different locations
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {Object.entries(groupedPitches).map(([location, locationPitches]) => (
            <div key={location} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Location Header */}
              <button
                onClick={() => toggleLocation(location)}
                className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white flex items-center justify-between hover:from-green-700 hover:to-blue-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <MapPin className="w-6 h-6" />
                  <div className="text-left">
                    <h2 className="text-xl font-bold">{location}</h2>
                    <p className="text-green-100">
                      {locationPitches.length} venue{locationPitches.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                {expandedLocations.has(location) ? (
                  <ChevronDown className="w-6 h-6" />
                ) : (
                  <ChevronRight className="w-6 h-6" />
                )}
              </button>

              {/* Venues List */}
              {expandedLocations.has(location) && (
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {locationPitches.map((pitch) => (
                      <div key={pitch.id} className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200">
                        <div className="relative">
                          <img
                            src={pitch.image_url}
                            alt={pitch.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Rs. {pitch.price_per_hour.toLocaleString()}/hour
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-3">{pitch.name}</h3>
                          
                          {/* Venue Properties */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center text-gray-600">
                              <Users className="w-5 h-5 mr-3 text-blue-600" />
                              <span className="font-medium">Capacity:</span>
                              <span className="ml-2">Up to {pitch.capacity} players</span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-5 h-5 mr-3 text-green-600" />
                              <span className="font-medium">Rate:</span>
                              <span className="ml-2">Rs. {pitch.price_per_hour.toLocaleString()} per hour</span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-5 h-5 mr-3 text-purple-600" />
                              <span className="font-medium">Location:</span>
                              <span className="ml-2">{pitch.location}</span>
                            </div>
                          </div>

                          {/* Amenities */}
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                              <Star className="w-4 h-4 mr-2 text-yellow-600" />
                              Amenities:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {pitch.amenities.map((amenity, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Book Button */}
                          <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <span>Book This Venue</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Object.keys(groupedPitches).length}
              </div>
              <div className="text-gray-600">Locations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {pitches.length}
              </div>
              <div className="text-gray-600">Total Venues</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.min(...pitches.map(p => p.price_per_hour)).toLocaleString()} - {Math.max(...pitches.map(p => p.price_per_hour)).toLocaleString()}
              </div>
              <div className="text-gray-600">Price Range (Rs/hour)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}