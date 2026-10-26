export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MembershipRole = "owner" | "manager" | "barber";
export type MembershipStatus = "active" | "invited" | "deactivated";
export type PaymentPolicy = "full" | "deposit" | "at_salon";
export type AppointmentStatus =
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "abandoned"
  | "refunded";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          preferred_style: string | null;
          is_platform_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          preferred_style?: string | null;
          is_platform_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          preferred_style?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      salons: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          address_line: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          phone: string | null;
          email: string | null;
          timezone: string;
          currency: string;
          logo_url: string | null;
          cover_url: string | null;
          payment_policy: PaymentPolicy;
          deposit_percent: number;
          booking_buffer_minutes: number;
          cancellation_hours: number;
          is_published: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      salon_memberships: {
        Row: {
          id: string;
          salon_id: string;
          user_id: string;
          role: MembershipRole;
          status: MembershipStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      barbers: {
        Row: {
          id: string;
          salon_id: string;
          membership_id: string;
          display_name: string;
          bio: string | null;
          specialties: string[];
          photo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          salon_id: string;
          name: string;
          description: string | null;
          category: string | null;
          price_kobo: number;
          duration_minutes: number;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          salon_id: string;
          user_id: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      working_hours: {
        Row: {
          id: string;
          salon_id: string;
          barber_id: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_closed: boolean;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      time_off: {
        Row: {
          id: string;
          salon_id: string;
          barber_id: string;
          starts_at: string;
          ends_at: string;
          reason: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          salon_id: string;
          service_id: string | null;
          barber_id: string;
          customer_id: string;
          customer_user_id: string | null;
          starts_at: string;
          ends_at: string;
          status: AppointmentStatus;
          price_kobo: number;
          service_name_snapshot: string;
          duration_minutes_snapshot: number;
          currency: string;
          notes: string | null;
          hold_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          salon_id: string;
          appointment_id: string;
          amount_kobo: number;
          currency: string;
          provider: string;
          reference: string;
          provider_reference: string | null;
          status: PaymentStatus;
          paid_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      appointment_audit: {
        Row: {
          id: string;
          appointment_id: string;
          salon_id: string;
          actor_id: string | null;
          action: string;
          from_status: AppointmentStatus | null;
          to_status: AppointmentStatus | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          salon_id: string;
          appointment_id: string;
          customer_id: string;
          rating: number;
          comment: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      saved_salons: {
        Row: {
          user_id: string;
          salon_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          salon_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      book_appointment: {
        Args: {
          p_salon_id: string;
          p_service_id: string;
          p_barber_id: string | null;
          p_starts_at: string;
          p_notes: string | null;
        };
        Returns: string;
      };
      barber_busy_ranges: {
        Args: {
          p_salon_id: string;
          p_barber_id: string;
          p_from: string;
          p_to: string;
        };
        Returns: { starts_at: string; ends_at: string }[];
      };
    };
    Enums: {
      membership_role: MembershipRole;
      appointment_status: AppointmentStatus;
      payment_status: PaymentStatus;
      payment_policy: PaymentPolicy;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
