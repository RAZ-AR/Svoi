// Svoi — Supabase database types (hand-maintained)

export interface SvoiUser {
  id:                string;
  auth_id:           string | null;
  telegram_id:       number | null;
  telegram_username: string | null;
  first_name:        string;
  last_name:         string;
  email:             string | null;
  phone:             string | null;
  avatar_url:        string | null;
  location:          string | null;
  location_lat:      number | null;
  location_lng:      number | null;
  birthday:          string | null; // ISO date "YYYY-MM-DD"
  completed_profile: boolean;
  created_at:        string;
  updated_at:        string;
}

export interface Category {
  id:        number;
  parent_id: number | null;
  name:      string;
  slug:      string;
  emoji:     string | null;
  sort_order: number;
}

export type ListingStatus = "active" | "sold" | "archived" | "deleted";

export interface Listing {
  id:          string;
  user_id:     string;
  category_id: number;
  title:       string;
  description: string | null;
  price:       number | null;
  currency:    string;
  address:     string | null;
  lat:         number | null;
  lng:         number | null;
  images:      unknown; // parsed via parseImages()
  status:      ListingStatus;
  views:       number;
  event_date:  string | null;
  created_at:  string;
  updated_at:  string;
}

export interface Database {
  public: {
    Tables: {
      users:      { Row: SvoiUser };
      categories: { Row: Category };
      listings:   { Row: Listing };
    };
  };
}
