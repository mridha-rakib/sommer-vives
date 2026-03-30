export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      add_ons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          listing_id: string
          name: string
          owner_id: string
          price: number
          price_type: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          listing_id: string
          name: string
          owner_id: string
          price?: number
          price_type?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          listing_id?: string
          name?: string
          owner_id?: string
          price?: number
          price_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "add_ons_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      agreements: {
        Row: {
          accept_marketing: boolean | null
          accept_privacy: boolean | null
          accept_terms: boolean | null
          binding_months: number
          commission_percent: number
          created_at: string
          id: string
          ip_address: string | null
          notice_days: number
          owner_address: string | null
          owner_email: string | null
          owner_id: string
          owner_name: string | null
          owner_phone: string | null
          pdf_url: string | null
          property_address: string | null
          property_id: string | null
          property_region: string | null
          property_title: string | null
          signature_date: string | null
          signature_name: string | null
          signed_at: string | null
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          accept_marketing?: boolean | null
          accept_privacy?: boolean | null
          accept_terms?: boolean | null
          binding_months?: number
          commission_percent?: number
          created_at?: string
          id?: string
          ip_address?: string | null
          notice_days?: number
          owner_address?: string | null
          owner_email?: string | null
          owner_id: string
          owner_name?: string | null
          owner_phone?: string | null
          pdf_url?: string | null
          property_address?: string | null
          property_id?: string | null
          property_region?: string | null
          property_title?: string | null
          signature_date?: string | null
          signature_name?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
          version?: string
        }
        Update: {
          accept_marketing?: boolean | null
          accept_privacy?: boolean | null
          accept_terms?: boolean | null
          binding_months?: number
          commission_percent?: number
          created_at?: string
          id?: string
          ip_address?: string | null
          notice_days?: number
          owner_address?: string | null
          owner_email?: string | null
          owner_id?: string
          owner_name?: string | null
          owner_phone?: string | null
          pdf_url?: string | null
          property_address?: string | null
          property_id?: string | null
          property_region?: string | null
          property_title?: string | null
          signature_date?: string | null
          signature_name?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          entity_case_number: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity_case_number?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity_case_number?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      availability_blocks: {
        Row: {
          block_type: string | null
          created_at: string
          end_date: string
          id: string
          notes: string | null
          property_id: string
          start_date: string
        }
        Insert: {
          block_type?: string | null
          created_at?: string
          end_date: string
          id?: string
          notes?: string | null
          property_id: string
          start_date: string
        }
        Update: {
          block_type?: string | null
          created_at?: string
          end_date?: string
          id?: string
          notes?: string | null
          property_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_holds: {
        Row: {
          booking_id: string | null
          created_at: string
          end_date: string
          expires_at: string
          hold_token: string | null
          id: string
          listing_id: string
          released: boolean | null
          session_id: string
          start_date: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          end_date: string
          expires_at: string
          hold_token?: string | null
          id?: string
          listing_id: string
          released?: boolean | null
          session_id: string
          start_date: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          end_date?: string
          expires_at?: string
          hold_token?: string | null
          id?: string
          listing_id?: string
          released?: boolean | null
          session_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_holds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_holds_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_line_items: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          item_type: string
          label: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          item_type?: string
          label: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          item_type?: string
          label?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_line_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_paid: number | null
          amount_remaining: number | null
          base_price: number
          case_number: string | null
          check_in: string
          check_out: string
          cleaning_fee: number | null
          created_at: string | null
          currency: string | null
          guest_email: string | null
          guest_id: string | null
          guest_name: string | null
          guest_phone: string | null
          guests_count: number | null
          id: string
          internal_notes: string | null
          nights: number | null
          notes: string | null
          owner_id: string
          owner_payout: number | null
          payment_status: string | null
          platform_earnings: number | null
          platform_fee_percent: number | null
          property_id: string
          service_fee: number | null
          source_channel: Database["public"]["Enums"]["source_channel"] | null
          status: Database["public"]["Enums"]["booking_status"] | null
          stripe_session_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          amount_remaining?: number | null
          base_price: number
          case_number?: string | null
          check_in: string
          check_out: string
          cleaning_fee?: number | null
          created_at?: string | null
          currency?: string | null
          guest_email?: string | null
          guest_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests_count?: number | null
          id?: string
          internal_notes?: string | null
          nights?: number | null
          notes?: string | null
          owner_id: string
          owner_payout?: number | null
          payment_status?: string | null
          platform_earnings?: number | null
          platform_fee_percent?: number | null
          property_id: string
          service_fee?: number | null
          source_channel?: Database["public"]["Enums"]["source_channel"] | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          amount_remaining?: number | null
          base_price?: number
          case_number?: string | null
          check_in?: string
          check_out?: string
          cleaning_fee?: number | null
          created_at?: string | null
          currency?: string | null
          guest_email?: string | null
          guest_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests_count?: number | null
          id?: string
          internal_notes?: string | null
          nights?: number | null
          notes?: string | null
          owner_id?: string
          owner_payout?: number | null
          payment_status?: string | null
          platform_earnings?: number | null
          platform_fee_percent?: number | null
          property_id?: string
          service_fee?: number | null
          source_channel?: Database["public"]["Enums"]["source_channel"] | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          sender_id: string | null
          sender_name: string | null
          sender_type: string
          thread_type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type: string
          thread_type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type?: string
          thread_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_splits: {
        Row: {
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at: string | null
          ek_percentage: number
          erik_percentage: number
          id: string
          notes: string | null
          property_id: string
          updated_at: string | null
        }
        Insert: {
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at?: string | null
          ek_percentage: number
          erik_percentage: number
          id?: string
          notes?: string | null
          property_id: string
          updated_at?: string | null
        }
        Update: {
          commission_type?: Database["public"]["Enums"]["commission_type"]
          created_at?: string | null
          ek_percentage?: number
          erik_percentage?: number
          id?: string
          notes?: string | null
          property_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_splits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_price_overrides: {
        Row: {
          created_at: string
          date: string
          id: string
          listing_id: string
          note: string | null
          owner_id: string
          price: number
          price_percentage: number | null
          price_type: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          listing_id: string
          note?: string | null
          owner_id: string
          price: number
          price_percentage?: number | null
          price_type?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          listing_id?: string
          note?: string | null
          owner_id?: string
          price?: number
          price_percentage?: number | null
          price_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_price_overrides_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_pool: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          description: string | null
          id: string
          percentage: number | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          percentage?: number | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "damage_pool_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_rules: {
        Row: {
          combinable_with_codes: boolean
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          listing_id: string | null
          max_nights: number | null
          min_nights: number
          name: string
          owner_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          combinable_with_codes?: boolean
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          listing_id?: string | null
          max_nights?: number | null
          min_nights?: number
          name: string
          owner_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          combinable_with_codes?: boolean
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          listing_id?: string | null
          max_nights?: number | null
          min_nights?: number
          name?: string
          owner_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_rules_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_text: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          email_type: string
          heading: string
          id: string
          is_active: boolean
          listing_id: string | null
          owner_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_text?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          email_type?: string
          heading?: string
          id?: string
          is_active?: boolean
          listing_id?: string | null
          owner_id: string
          subject?: string
          updated_at?: string
        }
        Update: {
          body_text?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          email_type?: string
          heading?: string
          id?: string
          is_active?: boolean
          listing_id?: string | null
          owner_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_rules: {
        Row: {
          amount: number
          condition_max_nights: number | null
          condition_min_nights: number | null
          created_at: string
          description: string | null
          fee_type: string
          id: string
          is_active: boolean
          is_mandatory: boolean
          listing_id: string
          name: string
          owner_id: string
          sort_order: number
        }
        Insert: {
          amount?: number
          condition_max_nights?: number | null
          condition_min_nights?: number | null
          created_at?: string
          description?: string | null
          fee_type?: string
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          listing_id: string
          name: string
          owner_id: string
          sort_order?: number
        }
        Update: {
          amount?: number
          condition_max_nights?: number | null
          condition_min_nights?: number | null
          created_at?: string
          description?: string | null
          fee_type?: string
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          listing_id?: string
          name?: string
          owner_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "fee_rules_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          case_number: string | null
          created_at: string | null
          email: string
          gdpr_consent: boolean | null
          gdpr_consent_date: string | null
          id: string
          name: string
          notes: string | null
          password_hash: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          case_number?: string | null
          created_at?: string | null
          email: string
          gdpr_consent?: boolean | null
          gdpr_consent_date?: string | null
          id?: string
          name: string
          notes?: string | null
          password_hash?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          case_number?: string | null
          created_at?: string | null
          email?: string
          gdpr_consent?: boolean | null
          gdpr_consent_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          password_hash?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          guest_email: string
          guest_name: string
          guest_phone: string | null
          guests: number
          id: string
          message: string | null
          property_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          guests?: number
          id?: string
          message?: string | null
          property_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          guests?: number
          id?: string
          message?: string | null
          property_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_blocks: {
        Row: {
          created_at: string
          end_date: string
          external_uid: string | null
          id: string
          listing_id: string
          owner_id: string
          reason: string | null
          source: string
          start_date: string
          summary: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          external_uid?: string | null
          id?: string
          listing_id: string
          owner_id: string
          reason?: string | null
          source?: string
          start_date: string
          summary?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          external_uid?: string | null
          id?: string
          listing_id?: string
          owner_id?: string
          reason?: string | null
          source?: string
          start_date?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_blocks_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_relationships: {
        Row: {
          combo_discount_percent: number | null
          created_at: string
          id: string
          listing_a_id: string
          listing_b_id: string
          relationship_type: string
        }
        Insert: {
          combo_discount_percent?: number | null
          created_at?: string
          id?: string
          listing_a_id: string
          listing_b_id: string
          relationship_type?: string
        }
        Update: {
          combo_discount_percent?: number | null
          created_at?: string
          id?: string
          listing_a_id?: string
          listing_b_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_relationships_listing_a_id_fkey"
            columns: ["listing_a_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_relationships_listing_b_id_fkey"
            columns: ["listing_b_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_seo: {
        Row: {
          canonical_url: string | null
          created_at: string
          id: string
          listing_id: string
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          listing_id: string
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_seo_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_videos: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_active: boolean
          listing_id: string
          owner_id: string
          sort_order: number
          thumbnail_url: string | null
          title: string
          youtube_id: string | null
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          listing_id: string
          owner_id: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          youtube_id?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          listing_id?: string
          owner_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          amenities: string[] | null
          base_price_per_night: number
          bathrooms: number | null
          bedroom_images: Json
          bedrooms: number | null
          check_in_time: string | null
          check_out_time: string | null
          cleaning_fee: number | null
          created_at: string
          currency: string
          description: string | null
          extra_sections: Json
          facilities: Json
          floor_plan_images: string[] | null
          hero_image: string | null
          house_rules: string | null
          id: string
          image_labels: Json | null
          images: string[] | null
          is_active: boolean
          location_map_image: string | null
          location_mood_image: string | null
          max_guests: number
          name: string
          owner_id: string
          practical_info: string | null
          region: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          base_price_per_night?: number
          bathrooms?: number | null
          bedroom_images?: Json
          bedrooms?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          cleaning_fee?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          extra_sections?: Json
          facilities?: Json
          floor_plan_images?: string[] | null
          hero_image?: string | null
          house_rules?: string | null
          id?: string
          image_labels?: Json | null
          images?: string[] | null
          is_active?: boolean
          location_map_image?: string | null
          location_mood_image?: string | null
          max_guests?: number
          name: string
          owner_id: string
          practical_info?: string | null
          region?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          base_price_per_night?: number
          bathrooms?: number | null
          bedroom_images?: Json
          bedrooms?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          cleaning_fee?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          extra_sections?: Json
          facilities?: Json
          floor_plan_images?: string[] | null
          hero_image?: string | null
          house_rules?: string | null
          id?: string
          image_labels?: Json | null
          images?: string[] | null
          is_active?: boolean
          location_map_image?: string | null
          location_mood_image?: string | null
          max_guests?: number
          name?: string
          owner_id?: string
          practical_info?: string | null
          region?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      package_purchases: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          owner_id: string
          package_id: string
          payment_status: string | null
          property_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          package_id: string
          payment_status?: string | null
          property_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          package_id?: string
          payment_status?: string | null
          property_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_purchases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          note: string | null
          owner_id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          owner_id: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          owner_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          description: string | null
          id: string
          owner_id: string
          payout_date: string | null
          property_id: string | null
          status: string | null
          stripe_payout_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          owner_id: string
          payout_date?: string | null
          property_id?: string | null
          status?: string | null
          stripe_payout_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          owner_id?: string
          payout_date?: string | null
          property_id?: string | null
          status?: string | null
          stripe_payout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      portal_listings: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          is_active: boolean | null
          portal_name: string
          property_id: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          portal_name: string
          property_id: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          portal_name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          case_number: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          case_number?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          case_number?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          capacity: number
          case_number: string | null
          cleaning_fee: number | null
          created_at: string
          description: string | null
          house_rules: string | null
          id: string
          images: string[] | null
          owner_id: string
          price_per_night: number | null
          price_per_week: number | null
          region: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          capacity?: number
          case_number?: string | null
          cleaning_fee?: number | null
          created_at?: string
          description?: string | null
          house_rules?: string | null
          id?: string
          images?: string[] | null
          owner_id: string
          price_per_night?: number | null
          price_per_week?: number | null
          region: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          capacity?: number
          case_number?: string | null
          cleaning_fee?: number | null
          created_at?: string
          description?: string | null
          house_rules?: string | null
          id?: string
          images?: string[] | null
          owner_id?: string
          price_per_night?: number | null
          price_per_week?: number | null
          region?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_pricing: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          min_nights: number | null
          notes: string | null
          price_per_night: number
          property_id: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          min_nights?: number | null
          notes?: string | null
          price_per_night: number
          property_id: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          min_nights?: number | null
          notes?: string | null
          price_per_night?: number
          property_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_pricing_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      season_rules: {
        Row: {
          check_in_days: number[] | null
          check_out_days: number[] | null
          created_at: string
          end_day: number
          end_month: number
          id: string
          listing_id: string
          min_nights: number | null
          name: string
          owner_id: string
          price_per_night: number
          price_percentage: number | null
          price_type: string
          priority: number | null
          start_day: number
          start_month: number
          status: string
        }
        Insert: {
          check_in_days?: number[] | null
          check_out_days?: number[] | null
          created_at?: string
          end_day: number
          end_month: number
          id?: string
          listing_id: string
          min_nights?: number | null
          name: string
          owner_id: string
          price_per_night: number
          price_percentage?: number | null
          price_type?: string
          priority?: number | null
          start_day: number
          start_month: number
          status?: string
        }
        Update: {
          check_in_days?: number[] | null
          check_out_days?: number[] | null
          created_at?: string
          end_day?: number
          end_month?: number
          id?: string
          listing_id?: string
          min_nights?: number | null
          name?: string
          owner_id?: string
          price_per_night?: number
          price_percentage?: number | null
          price_type?: string
          priority?: number | null
          start_day?: number
          start_month?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_rules_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          sort_order: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
        }
        Relationships: []
      }
      sync_settings: {
        Row: {
          config: Json | null
          created_at: string
          direction: string
          feed_url: string | null
          id: string
          is_active: boolean
          last_synced_at: string | null
          listing_id: string
          owner_id: string
          provider: string
          sync_interval_minutes: number | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          direction?: string
          feed_url?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          listing_id: string
          owner_id: string
          provider: string
          sync_interval_minutes?: number | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          direction?: string
          feed_url?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          listing_id?: string
          owner_id?: string
          provider?: string
          sync_interval_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_settings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          notes: string | null
          property_id: string
          scheduled_date: string
          status: string | null
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id: string
          scheduled_date: string
          status?: string | null
          task_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string
          scheduled_date?: string
          status?: string | null
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_case_number: { Args: { prefix: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "completed"
        | "cancelled"
      commission_type: "platform" | "sales_meeting"
      source_channel: "direct" | "airbnb" | "booking_com" | "vrbo" | "other"
      user_role: "owner" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
      ],
      commission_type: ["platform", "sales_meeting"],
      source_channel: ["direct", "airbnb", "booking_com", "vrbo", "other"],
      user_role: ["owner", "admin"],
    },
  },
} as const
