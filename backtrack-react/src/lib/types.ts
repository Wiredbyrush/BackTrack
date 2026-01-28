// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      items: {
        Row: Item;
        Insert: Omit<Item, 'id' | 'created_at'>;
        Update: Partial<Omit<Item, 'id'>>;
      };
      claims: {
        Row: Claim;
        Insert: Omit<Claim, 'id' | 'created_at'>;
        Update: Partial<Omit<Claim, 'id'>>;
      };
      admins: {
        Row: Admin;
        Insert: Omit<Admin, 'id'>;
        Update: Partial<Omit<Admin, 'id'>>;
      };
    };
  };
}

// Item (lost/found item)
export interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  location: string;
  date_lost?: string;
  image_url?: string;
  status: 'pending' | 'found' | 'claimed' | 'returned';
  user_id?: string;
  tags?: string[];
  created_at: string;
}

// Claim request
export interface Claim {
  id: string;
  item_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  proof: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  items?: Item;
}

// Admin user
export interface Admin {
  id: string;
  user_id?: string;
  email: string;
}

// Filter options for items
export interface ItemFilters {
  status?: string | string[];
  category?: string[];
  location?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// User from Supabase Auth
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}
