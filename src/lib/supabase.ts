import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using mock data.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export interface Pitch {
  id: string;
  name: string;
  location: string;
  capacity: number;
  price_per_hour: number;
  amenities: string[];
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  pitch_id: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  total_price: number;
  status: string;
  player_id?: string;
  guest_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface VenueCredential {
  id: string;
  venue_id: string;
  username: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayerProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// API functions
export const pitchesApi = {
  async getAll(): Promise<Pitch[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('pitches')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Pitch | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('pitches')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const bookingsApi = {
  async create(bookingData: {
    pitch_id: string;
    booking_date: string;
    start_time: string;
    duration_hours: number;
    total_price: number;
    player_id?: string;
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
  }): Promise<Booking> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    console.log('=== SUPABASE API CREATE BOOKING ===');
    console.log('Input data:', JSON.stringify(bookingData, null, 2));
    
    let finalBookingData: any = {
      pitch_id: bookingData.pitch_id,
      booking_date: bookingData.booking_date,
      start_time: bookingData.start_time,
      duration_hours: bookingData.duration_hours,
      total_price: bookingData.total_price,
      status: 'confirmed'
    };

    // Handle player booking
    if (bookingData.player_id) {
      finalBookingData.player_id = bookingData.player_id;
      console.log('Creating player booking for player_id:', bookingData.player_id);
    } 
    // Handle guest booking
    else if (bookingData.guest_name && bookingData.guest_email) {
      console.log('Creating guest booking, checking for existing guest...');
      
      // Check if guest already exists
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('email', bookingData.guest_email)
        .maybeSingle();
      
      let guestId: string;
      
      if (existingGuest) {
        guestId = existingGuest.id;
        console.log('Using existing guest:', guestId);
      } else {
        // Create new guest
        console.log('Creating new guest...');
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert([{
            name: bookingData.guest_name,
            email: bookingData.guest_email,
            phone: bookingData.guest_phone
          }])
          .select()
          .single();
        
        if (guestError) {
          console.error('Error creating guest:', guestError);
          throw guestError;
        }
        
        guestId = newGuest.id;
        console.log('Created new guest:', guestId);
      }
      
      finalBookingData.guest_id = guestId;
    } else {
      throw new Error('Either player_id or guest information (name and email) is required');
    }
    
    console.log('=== SUPABASE INSERT ATTEMPT ===');
    console.log('About to insert:', finalBookingData);
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([finalBookingData])
      .select(`
        *,
        guests (
          name,
          email,
          phone
        ),
        player_profiles (
          full_name,
          email
        )
      `)
      .single();
    
    console.log('=== SUPABASE INSERT RESPONSE ===');
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Error:', error);
    
    if (error) throw error;
    return data;
  },

  async getByDateAndPitch(date: string, pitchId: string): Promise<Booking[]> {
    if (!supabase) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', date)
      .eq('pitch_id', pitchId)
      .eq('status', 'confirmed');
    
    if (error) throw error;
    return data || [];
  },

  async getAll(): Promise<Booking[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    console.log('Fetching all bookings with joins...');

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        guests (
          id,
          name,
          email,
          phone
        ),
        player_profiles (
          id,
          full_name,
          email,
          phone
        )
      `)
      .order('booking_date', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }

    console.log('Bookings fetched:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('First booking structure:', JSON.stringify(data[0], null, 2));
    }

    return data || [];
  },

  async getByPlayerId(playerId: string): Promise<Booking[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        pitches!inner (
          name,
          location
        ),
        guests (
          name,
          email,
          phone
        ),
        player_profiles (
          full_name,
          email
        )
      `)
      .eq('player_id', playerId)
      .order('booking_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByPlayerEmail(email: string): Promise<Booking[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    // Get bookings for this email from both player_profiles and guests
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        pitches!inner (
          name,
          location
        ),
        guests (
          name,
          email,
          phone
        ),
        player_profiles (
          full_name,
          email
        )
      `)
      .or(`player_profiles.email.eq.${email},guests.email.eq.${email}`)
      .order('booking_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// Guest API functions
export const guestsApi = {
  async create(guest: Omit<Guest, 'id' | 'created_at' | 'updated_at'>): Promise<Guest> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('guests')
      .insert([guest])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByEmail(email: string): Promise<Guest | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
};

export const venueCredentialsApi = {
  async authenticate(username: string, password: string): Promise<{ venue: Pitch; credential: VenueCredential } | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    try {
      console.log('Attempting Supabase authentication for username:', username);
      
      const { data, error } = await supabase
        .from('venue_credentials')
        .select(`
          *,
          pitches (*)
        `)
        .eq('username', username)
        .eq('password_hash', password)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
    
      if (!data) {
        console.log('No matching credentials found in Supabase database');
        throw new Error('Invalid credentials');
      }
      
      console.log('Supabase authentication successful for:', data.pitches.name);
    
      return {
        venue: data.pitches,
        credential: data
      };
    } catch (err) {
      console.error('Supabase authentication error:', err);
      throw err;
    }
  },

  async getByVenueId(venueId: string): Promise<VenueCredential | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('venue_credentials')
      .select('*')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .single();
    
    if (error) return null;
    return data;
  }
};

// Player authentication API
export const playerAuthApi = {
  async signUp(email: string, password: string, fullName: string, phone?: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone
        }
      }
    });

    if (error) throw error;
    return authData;
  },

  async signIn(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return authData;
  },

  async signOut() {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Clear any cached user state first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // User is already signed out, no need to call signOut
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    if (!supabase) {
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Check if the error indicates an invalid or stale session
      if (error.message?.includes('Auth session missing') || 
          error.message?.includes('User from sub claim in JWT does not exist')) {
        console.log('Invalid session detected, clearing auth state');
        // Clear the invalid session
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          // Ignore sign out errors as the session is already invalid
          console.log('Session already cleared');
        }
      } else {
        console.error('Error getting current user:', error);
      }
      return null;
    }
    return user;
  },

  async getProfile(userId: string): Promise<PlayerProfile | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) return null;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<PlayerProfile>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('player_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async resetPassword(email: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }
};