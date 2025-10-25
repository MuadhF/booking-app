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
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_price: number;
  status: string;
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
  async create(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Booking> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single();
    
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
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        pitches (
          name,
          location
        )
      `)
      .order('booking_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

export const venueCredentialsApi = {
  async authenticate(username: string, password: string): Promise<{ venue: Pitch; credential: VenueCredential } | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('venue_credentials')
      .select(`
        *,
        pitches (*)
      `)
      .eq('username', username)
      .eq('password_hash', password)
      .eq('is_active', true)
      .single();
    
    if (error || !data) return null;
    
    return {
      venue: data.pitches,
      credential: data
    };
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