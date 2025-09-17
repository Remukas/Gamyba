import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Inventorizacijos ciklų funkcijos
export const inventoryCyclesAPI = {
  // Gauti vartotojo nustatymus
  async getSettings() {
    const { data, error } = await supabase
      .from('inventory_cycle_settings')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data || {
      default_cycle_months: 3,
      start_date: new Date().toISOString().split('T')[0]
    };
  },

  // Išsaugoti nustatymus
  async saveSettings(settings) {
    const { data, error } = await supabase
      .from('inventory_cycle_settings')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        default_cycle_months: settings.defaultCycleMonths,
        start_date: settings.startDate,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Gauti inventorizacijos įrašus
  async getRecords() {
    const { data, error } = await supabase
      .from('inventory_records')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Pridėti inventorizacijos įrašą
  async addRecord(record) {
    const { data, error } = await supabase
      .from('inventory_records')
      .insert({
        component_id: record.componentId,
        expected_stock: record.expectedStock,
        actual_stock: record.actualStock,
        notes: record.notes || '',
        inspector: record.inspector,
        check_date: record.date,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Gauti komponentų ciklų perrašymus
  async getComponentOverrides() {
    const { data, error } = await supabase
      .from('component_cycle_overrides')
      .select('*');
    
    if (error) throw error;
    return data || [];
  },

  // Išsaugoti komponento ciklą
  async saveComponentCycle(componentId, cycleMonths, isCritical = false) {
    const { data, error } = await supabase
      .from('component_cycle_overrides')
      .upsert({
        component_id: componentId,
        cycle_months: cycleMonths,
        is_critical: isCritical,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Pašalinti komponento ciklą (grįžti prie numatytojo)
  async removeComponentCycle(componentId) {
    const { error } = await supabase
      .from('component_cycle_overrides')
      .delete()
      .eq('component_id', componentId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
    
    if (error) throw error;
  }
};