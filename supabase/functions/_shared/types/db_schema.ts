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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      exercise_evaluation_details: {
        Row: {
          created_at: string
          evaluation_id: string
          id: string
          perspective: string | null
          perspective_name: string | null
          perspective_satisfy_rate: number | null
          reason: string | null
          rubric: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          evaluation_id: string
          id?: string
          perspective?: string | null
          perspective_name?: string | null
          perspective_satisfy_rate?: number | null
          reason?: string | null
          rubric?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          evaluation_id?: string
          id?: string
          perspective?: string | null
          perspective_name?: string | null
          perspective_satisfy_rate?: number | null
          reason?: string | null
          rubric?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_evaluation_details_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "exercise_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_evaluation_rubrics: {
        Row: {
          created_at: string
          detail: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          is_active: boolean
          perspective: string
          perspective_name: string | null
          updated_at: string
          version: number
          weight: number
        }
        Insert: {
          created_at?: string
          detail?: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          is_active?: boolean
          perspective: string
          perspective_name?: string | null
          updated_at?: string
          version: number
          weight?: number
        }
        Update: {
          created_at?: string
          detail?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          is_active?: boolean
          perspective?: string
          perspective_name?: string | null
          updated_at?: string
          version?: number
          weight?: number
        }
        Relationships: []
      }
      exercise_evaluations: {
        Row: {
          created_at: string
          evaluated_model: string | null
          evaluated_vendor: Database["public"]["Enums"]["llm_vendor"] | null
          feedback: Json | null
          id: string
          rubrics_version: number | null
          score: number | null
          status: Database["public"]["Enums"]["exercise_evaluation_status"]
          submission_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evaluated_model?: string | null
          evaluated_vendor?: Database["public"]["Enums"]["llm_vendor"] | null
          feedback?: Json | null
          id?: string
          rubrics_version?: number | null
          score?: number | null
          status?: Database["public"]["Enums"]["exercise_evaluation_status"]
          submission_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evaluated_model?: string | null
          evaluated_vendor?: Database["public"]["Enums"]["llm_vendor"] | null
          feedback?: Json | null
          id?: string
          rubrics_version?: number | null
          score?: number | null
          status?: Database["public"]["Enums"]["exercise_evaluation_status"]
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_evaluations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "exercise_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_generator_output_configs: {
        Row: {
          created_at: string
          data_type: Database["public"]["Enums"]["exercise_output_data_type"]
          description: string | null
          difficulty: Database["public"]["Enums"]["exercise_output_difficulty"]
          exercise_type: Database["public"]["Enums"]["exercise_output_exercise_type"]
          id: string
          llm_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_type: Database["public"]["Enums"]["exercise_output_data_type"]
          description?: string | null
          difficulty: Database["public"]["Enums"]["exercise_output_difficulty"]
          exercise_type: Database["public"]["Enums"]["exercise_output_exercise_type"]
          id?: string
          llm_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_type?: Database["public"]["Enums"]["exercise_output_data_type"]
          description?: string | null
          difficulty?: Database["public"]["Enums"]["exercise_output_difficulty"]
          exercise_type?: Database["public"]["Enums"]["exercise_output_exercise_type"]
          id?: string
          llm_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ex_out_cfg_llm"
            columns: ["llm_id"]
            isOneToOne: false
            referencedRelation: "llms"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_generator_output_configs_schemas: {
        Row: {
          created_at: string
          data_type: Database["public"]["Enums"]["exercise_output_data_type"]
          difficulty: Database["public"]["Enums"]["exercise_output_difficulty"]
          exercise_type: Database["public"]["Enums"]["exercise_output_exercise_type"]
          llm_id: string
          schema: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_type: Database["public"]["Enums"]["exercise_output_data_type"]
          difficulty: Database["public"]["Enums"]["exercise_output_difficulty"]
          exercise_type: Database["public"]["Enums"]["exercise_output_exercise_type"]
          llm_id: string
          schema: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_type?: Database["public"]["Enums"]["exercise_output_data_type"]
          difficulty?: Database["public"]["Enums"]["exercise_output_difficulty"]
          exercise_type?: Database["public"]["Enums"]["exercise_output_exercise_type"]
          llm_id?: string
          schema?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ex_out_cfg_schema_llm"
            columns: ["llm_id"]
            isOneToOne: false
            referencedRelation: "llms"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_generator_profile_source_patterns: {
        Row: {
          delete_flg: boolean
          first_used_at: string
          id: string
          last_used_at: string
          pattern_size: number
          profile_id: string
          source_ids: string[]
          source_set_key: string | null
          usage_count: number
        }
        Insert: {
          delete_flg?: boolean
          first_used_at?: string
          id?: string
          last_used_at?: string
          pattern_size: number
          profile_id: string
          source_ids: string[]
          source_set_key?: string | null
          usage_count?: number
        }
        Update: {
          delete_flg?: boolean
          first_used_at?: string
          id?: string
          last_used_at?: string
          pattern_size?: number
          profile_id?: string
          source_ids?: string[]
          source_set_key?: string | null
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_generator_profile_source_patterns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "exercise_generator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_generator_profile_sources: {
        Row: {
          profile_id: string
          source_id: string
        }
        Insert: {
          profile_id: string
          source_id: string
        }
        Update: {
          profile_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_generator_profile_sources_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "exercise_generator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_generator_profile_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "exercise_generator_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_generator_profiles: {
        Row: {
          allow_repeat_when_exhausted: boolean
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          output_config_id: string
          source_combo_max: number
          source_combo_min: number
          updated_at: string
        }
        Insert: {
          allow_repeat_when_exhausted?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          output_config_id: string
          source_combo_max?: number
          source_combo_min?: number
          updated_at?: string
        }
        Update: {
          allow_repeat_when_exhausted?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          output_config_id?: string
          source_combo_max?: number
          source_combo_min?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ex_gen_profiles_output_config"
            columns: ["output_config_id"]
            isOneToOne: false
            referencedRelation: "exercise_generator_output_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_generator_seeds: {
        Row: {
          created_at: string
          fingerprint_sha256: string | null
          generator_profile_id: string
          id: string
          idempotency_key: string | null
          llm_id: string | null
          locale: string | null
          meta: Json
          raw_text: string | null
          raw_text_trgm_generated: string | null
          status: Database["public"]["Enums"]["seed_status"]
          summary: string | null
          theme_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fingerprint_sha256?: string | null
          generator_profile_id: string
          id?: string
          idempotency_key?: string | null
          llm_id?: string | null
          locale?: string | null
          meta?: Json
          raw_text?: string | null
          raw_text_trgm_generated?: string | null
          status?: Database["public"]["Enums"]["seed_status"]
          summary?: string | null
          theme_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fingerprint_sha256?: string | null
          generator_profile_id?: string
          id?: string
          idempotency_key?: string | null
          llm_id?: string | null
          locale?: string | null
          meta?: Json
          raw_text?: string | null
          raw_text_trgm_generated?: string | null
          status?: Database["public"]["Enums"]["seed_status"]
          summary?: string | null
          theme_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_generator_seeds_generator_profile_id_fkey"
            columns: ["generator_profile_id"]
            isOneToOne: false
            referencedRelation: "seed_generator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_generator_seeds_llm_id_fkey"
            columns: ["llm_id"]
            isOneToOne: false
            referencedRelation: "llms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_generator_seeds_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "seed_generator_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_generator_source_seeds: {
        Row: {
          seed_id: string
          source_id: string
        }
        Insert: {
          seed_id: string
          source_id: string
        }
        Update: {
          seed_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_generator_source_seeds_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "exercise_generator_seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_generator_source_seeds_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "exercise_generator_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_generator_sources: {
        Row: {
          aggregate_type: Database["public"]["Enums"]["source_aggregate_type"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          theme_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          aggregate_type?: Database["public"]["Enums"]["source_aggregate_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          theme_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          aggregate_type?: Database["public"]["Enums"]["source_aggregate_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          theme_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_generator_sources_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "seed_generator_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_submissions: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          payload: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          payload: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          payload?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          create_type: Database["public"]["Enums"]["create_type"]
          created_at: string
          created_by: string | null
          delete_flg: boolean
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          generate_profile_id: string
          id: string
          status: Database["public"]["Enums"]["exercise_status"]
          storage_path: string
          title: string
          updated_at: string
        }
        Insert: {
          create_type: Database["public"]["Enums"]["create_type"]
          created_at?: string
          created_by?: string | null
          delete_flg?: boolean
          description?: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          generate_profile_id: string
          id?: string
          status?: Database["public"]["Enums"]["exercise_status"]
          storage_path: string
          title: string
          updated_at?: string
        }
        Update: {
          create_type?: Database["public"]["Enums"]["create_type"]
          created_at?: string
          created_by?: string | null
          delete_flg?: boolean
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          generate_profile_id?: string
          id?: string
          status?: Database["public"]["Enums"]["exercise_status"]
          storage_path?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_generate_profile_id_fkey"
            columns: ["generate_profile_id"]
            isOneToOne: false
            referencedRelation: "exercise_generator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      idp_links: {
        Row: {
          auth_user_id: string
          created_at: string
          email_at_link_time: string | null
          external_user_id: string
          id: number
          last_seen_at: string | null
          metadata: Json
          provider: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email_at_link_time?: string | null
          external_user_id: string
          id?: number
          last_seen_at?: string | null
          metadata?: Json
          provider: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email_at_link_time?: string | null
          external_user_id?: string
          id?: number
          last_seen_at?: string | null
          metadata?: Json
          provider?: string
        }
        Relationships: []
      }
      job_runs: {
        Row: {
          attempt: number
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_detail: string | null
          error_summary: string | null
          finished_at: string | null
          id: string
          job_key: string
          metrics: Json
          request_id: string | null
          run_mode: Database["public"]["Enums"]["job_run_mode"]
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_detail?: string | null
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          job_key: string
          metrics?: Json
          request_id?: string | null
          run_mode: Database["public"]["Enums"]["job_run_mode"]
          started_at?: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          attempt?: number
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_detail?: string | null
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          job_key?: string
          metrics?: Json
          request_id?: string | null
          run_mode?: Database["public"]["Enums"]["job_run_mode"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: []
      }
      llms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_tokens: number | null
          meta: Json
          model: string
          updated_at: string
          vendor: Database["public"]["Enums"]["llm_vendor"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_tokens?: number | null
          meta?: Json
          model: string
          updated_at?: string
          vendor: Database["public"]["Enums"]["llm_vendor"]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_tokens?: number | null
          meta?: Json
          model?: string
          updated_at?: string
          vendor?: Database["public"]["Enums"]["llm_vendor"]
        }
        Relationships: []
      }
      seed_generator_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seed_generator_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "seed_generator_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_generator_profiles: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          meta: Json
          name: string
          profile_type: Database["public"]["Enums"]["seed_profile_type"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          meta?: Json
          name: string
          profile_type: Database["public"]["Enums"]["seed_profile_type"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          meta?: Json
          name?: string
          profile_type?: Database["public"]["Enums"]["seed_profile_type"]
          updated_at?: string
        }
        Relationships: []
      }
      seed_generator_theme_categories: {
        Row: {
          category_id: string
          theme_id: string
        }
        Insert: {
          category_id: string
          theme_id: string
        }
        Update: {
          category_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seed_generator_theme_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "seed_generator_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seed_generator_theme_categories_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "seed_generator_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_generator_themes: {
        Row: {
          canonical_key: string
          created_at: string
          created_by:
            | Database["public"]["Enums"]["seed_generator_theme_created_type"]
            | null
          description: string | null
          id: string
          is_active: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          canonical_key?: string
          created_at?: string
          created_by?:
            | Database["public"]["Enums"]["seed_generator_theme_created_type"]
            | null
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_key?: string
          created_at?: string
          created_by?:
            | Database["public"]["Enums"]["seed_generator_theme_created_type"]
            | null
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_name: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          user_name?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _trgm_normalize: { Args: { s: string }; Returns: string }
      find_similar_seeds_by_raw_text: {
        Args: { lim?: number; min_sim?: number; q: string }
        Returns: {
          id: string
          sim: number
          snippet: string
          title: string
        }[]
      }
      find_similar_seeds_by_title: {
        Args: { lim?: number; min_sim?: number; q: string }
        Returns: {
          id: string
          sim: number
          snippet: string
          title: string
        }[]
      }
      find_similar_themes: {
        Args: { lim?: number; min_sim?: number; q: string }
        Returns: {
          id: string
          sim: number
          title: string
        }[]
      }
      pick_random_unused_source_pattern:
        | {
            Args: {
              p_kmax?: number
              p_kmin?: number
              p_max_attempts?: number
              p_profile_id: string
            }
            Returns: {
              pattern_id: string
              pattern_size: number
              source_ids: string[]
              source_set_key: string
            }[]
          }
        | {
            Args: {
              p_allow_duplicates?: boolean
              p_kmax?: number
              p_kmin?: number
              p_max_attempts?: number
              p_profile_id: string
            }
            Returns: {
              pattern_id: string
              source_ids: string[]
            }[]
          }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      uuid_array_sorted_key: { Args: { arr: string[] }; Returns: string }
    }
    Enums: {
      create_type: "system" | "user" | "admin" | "import"
      difficulty_level: "easy" | "medium" | "hard"
      exercise_evaluation_status:
        | "queued"
        | "processing"
        | "succeeded"
        | "failed"
      exercise_output_data_type: "text" | "audio" | "text/audio"
      exercise_output_difficulty: "easy" | "medium" | "hard"
      exercise_output_exercise_type: "summary" | "rewrite"
      exercise_status: "draft" | "ready" | "hidden"
      exercise_type: "summary" | "explain" | "rewrite"
      job_run_mode: "scheduled" | "manual" | "retry" | "test"
      job_status: "running" | "success" | "failed" | "warn"
      llm_vendor: "openai" | "google" | "anthropic"
      seed_generator_theme_created_type: "system" | "admin"
      seed_profile_type: "ai_theme" | "youtube_channels" | "web" | "storage"
      seed_status: "active" | "paused" | "archived"
      source_aggregate_type: "theme" | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
      create_type: ["system", "user", "admin", "import"],
      difficulty_level: ["easy", "medium", "hard"],
      exercise_evaluation_status: [
        "queued",
        "processing",
        "succeeded",
        "failed",
      ],
      exercise_output_data_type: ["text", "audio", "text/audio"],
      exercise_output_difficulty: ["easy", "medium", "hard"],
      exercise_output_exercise_type: ["summary", "rewrite"],
      exercise_status: ["draft", "ready", "hidden"],
      exercise_type: ["summary", "explain", "rewrite"],
      job_run_mode: ["scheduled", "manual", "retry", "test"],
      job_status: ["running", "success", "failed", "warn"],
      llm_vendor: ["openai", "google", "anthropic"],
      seed_generator_theme_created_type: ["system", "admin"],
      seed_profile_type: ["ai_theme", "youtube_channels", "web", "storage"],
      seed_status: ["active", "paused", "archived"],
      source_aggregate_type: ["theme", "custom"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
