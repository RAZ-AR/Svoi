// Svoi — Supabase database types (auto-generated, manually maintained for now)
// Regenerate with: npm run db:types

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ListingStatus = "active" | "paused" | "sold" | "deleted";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string | null;
          telegram_id: number | null;
          telegram_username: string | null;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          location: string | null;
          location_lat: number | null;
          location_lng: number | null;
          completed_profile: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id?: string | null;
          telegram_id?: number | null;
          telegram_username?: string | null;
          first_name: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          completed_profile?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string | null;
          telegram_id?: number | null;
          telegram_username?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          completed_profile?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          emoji: string | null;
          parent_id: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          emoji?: string | null;
          parent_id?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          emoji?: string | null;
          parent_id?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          category_id: number;
          title: string;
          description: string | null;
          price: number | null;
          currency: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          images: Json;
          status: ListingStatus;
          views: number;
          event_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: number;
          title: string;
          description?: string | null;
          price?: number | null;
          currency?: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          images?: Json;
          status?: ListingStatus;
          views?: number;
          event_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: number;
          title?: string;
          description?: string | null;
          price?: number | null;
          currency?: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          images?: Json;
          status?: ListingStatus;
          views?: number;
          event_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      chats: {
        Row: {
          id: string;
          listing_id: string;
          user1_id: string;
          user2_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          user1_id: string;
          user2_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          user1_id?: string;
          user2_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chats_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          text: string | null;
          image_url: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          text?: string | null;
          image_url?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          text?: string | null;
          image_url?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey";
            columns: ["chat_id"];
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          listing_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          listing_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      boosts: {
        Row: {
          id: number;
          listing_id: string;
          until_date: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          listing_id: string;
          until_date: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          listing_id?: string;
          until_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      upsert_telegram_user: {
        Args: {
          p_telegram_id: number;
          p_first_name: string;
          p_last_name?: string;
          p_username?: string;
          p_avatar_url?: string;
        };
        Returns: {
          id: string;
          telegram_id: number;
          first_name: string;
          last_name: string;
          telegram_username: string | null;
          avatar_url: string | null;
          completed_profile: boolean;
          is_new_user: boolean;
        };
      };
      get_nearby_listings: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_radius_km?: number;
          p_category?: string | null;
          p_limit?: number;
        };
        Returns: {
          id: string;
          user_id: string;
          category_id: number;
          title: string;
          description: string | null;
          price: number | null;
          currency: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          images: Json;
          status: ListingStatus;
          views: number;
          event_date: string | null;
          created_at: string;
          updated_at: string;
        }[];
      };
      increment_listing_views: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience type aliases
export type SvoiUser    = Database["public"]["Tables"]["users"]["Row"];
export type Category    = Database["public"]["Tables"]["categories"]["Row"];
export type Listing     = Database["public"]["Tables"]["listings"]["Row"];
export type Chat        = Database["public"]["Tables"]["chats"]["Row"];
export type Message     = Database["public"]["Tables"]["messages"]["Row"];
export type Favorite    = Database["public"]["Tables"]["favorites"]["Row"];
