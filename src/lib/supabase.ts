import { createClient } from '@supabase/supabase-js';

// Supabase configuration - these will be set via environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbShoot {
  id: string;
  name: string;
  date: string;
  duration: string;
  location: string;
  equipment: any[];
  status: string;
  requestor: any;
  vendor_quote?: any;
  approved?: boolean;
  approved_amount?: number;
  invoice_file?: any;
  paid?: boolean;
  rejection_reason?: string;
  approval_email?: string;
  cancellation_reason?: string;
  activities?: any[];
  email_thread_id?: string;
  created_at?: string;
  shoot_date?: string;
  request_group_id?: string;
  is_multi_shoot?: boolean;
  multi_shoot_index?: number;
  total_shoots_in_request?: number;
}

export interface DbCatalogItem {
  id: string;
  name: string;
  daily_rate: number;
  category: string;
  last_updated?: string;
}

// Database operations for Shoots
export const shootsDb = {
  async getAll(): Promise<DbShoot[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using localStorage');
      return [];
    }
    
    const { data, error } = await supabase
      .from('shoots')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching shoots:', error);
      return [];
    }
    
    return data || [];
  },

  async create(shoot: DbShoot): Promise<DbShoot | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return null;
    }
    
    const { data, error } = await supabase
      .from('shoots')
      .insert([shoot])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating shoot:', error);
      return null;
    }
    
    return data;
  },

  async update(id: string, updates: Partial<DbShoot>): Promise<DbShoot | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return null;
    }
    
    const { data, error } = await supabase
      .from('shoots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating shoot:', error);
      return null;
    }
    
    return data;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return false;
    }
    
    const { error } = await supabase
      .from('shoots')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting shoot:', error);
      return false;
    }
    
    return true;
  }
};

// Database operations for Catalog
export const catalogDb = {
  async getAll(): Promise<DbCatalogItem[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using localStorage');
      return [];
    }
    
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) {
      console.error('Error fetching catalog:', error);
      return [];
    }
    
    return data || [];
  },

  async upsert(items: DbCatalogItem[]): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return false;
    }
    
    const { error } = await supabase
      .from('catalog_items')
      .upsert(items, { onConflict: 'id' });
    
    if (error) {
      console.error('Error upserting catalog:', error);
      return false;
    }
    
    return true;
  },

  async create(item: DbCatalogItem): Promise<DbCatalogItem | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return null;
    }
    
    const { data, error } = await supabase
      .from('catalog_items')
      .insert([item])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating catalog item:', error);
      return null;
    }
    
    return data;
  },

  async update(id: string, updates: Partial<DbCatalogItem>): Promise<DbCatalogItem | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return null;
    }
    
    const { data, error } = await supabase
      .from('catalog_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating catalog item:', error);
      return null;
    }
    
    return data;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return false;
    }
    
    const { error } = await supabase
      .from('catalog_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting catalog item:', error);
      return false;
    }
    
    return true;
  }
};

