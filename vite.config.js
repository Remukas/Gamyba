import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Vartotojų valdymas
export const usersAPI = {
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Kategorijų valdymas
export const categoriesAPI = {
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async createCategory(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Komponentų valdymas
export const componentsAPI = {
  async getComponents() {
    const { data, error } = await supabase
      .from('components')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async createComponent(componentData) {
    const { data, error } = await supabase
      .from('components')
      .insert(componentData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Įrašyti į istoriją
    await productionHistoryAPI.logAction('component', data.id, data.name, 'created', null, componentData);
    
    return data;
  },

  async updateComponent(componentId, updates) {
    // Gauti seną reikšmę
    const { data: oldData } = await supabase
      .from('components')
      .select('*')
      .eq('id', componentId)
      .single();

    const { data, error } = await supabase
      .from('components')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', componentId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Įrašyti į istoriją
    if (oldData) {
      await productionHistoryAPI.logAction('component', componentId, data.name, 'updated', oldData, updates);
    }
    
    return data;
  },

  async deleteComponent(componentId) {
    const { data: componentData } = await supabase
      .from('components')
      .select('*')
      .eq('id', componentId)
      .single();

    const { error } = await supabase
      .from('components')
      .delete()
      .eq('id', componentId);
    
    if (error) throw error;
    
    // Įrašyti į istoriją
    if (componentData) {
      await productionHistoryAPI.logAction('component', componentId, componentData.name, 'deleted', componentData, null);
    }
  }
};

// Subasemblių valdymas
export const subassembliesAPI = {
  async getSubassemblies() {
    const { data, error } = await supabase
      .from('subassemblies')
      .select(`
        *,
        category:categories(name, color),
        components:subassembly_components(
          required_quantity,
          component:components(id, name, stock)
        ),
        comments:subassembly_comments(
          id, comment, created_at,
          author:users(name)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createSubassembly(subassemblyData) {
    const { data, error } = await supabase
      .from('subassemblies')
      .insert(subassemblyData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Įrašyti į istoriją
    await productionHistoryAPI.logAction('subassembly', data.id, data.name, 'created', null, subassemblyData);
    
    return data;
  },

  async updateSubassembly(subassemblyId, updates) {
    const { data: oldData } = await supabase
      .from('subassemblies')
      .select('*')
      .eq('id', subassemblyId)
      .single();

    const { data, error } = await supabase
      .from('subassemblies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', subassemblyId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Įrašyti į istoriją
    if (oldData) {
      await productionHistoryAPI.logAction('subassembly', subassemblyId, data.name, 'updated', oldData, updates);
    }
    
    return data;
  }
};

// Gamybos istorijos valdymas
export const productionHistoryAPI = {
  async logAction(entityType, entityId, entityName, actionType, oldValue, newValue, reason = '') {
    try {
      const { error } = await supabase
        .from('production_history')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          action_type: actionType,
          old_value: oldValue,
          new_value: newValue,
          change_reason: reason,
          changed_by: (await supabase.auth.getUser()).data.user?.id
        });
      
      if (error) console.error('Klaida įrašant istoriją:', error);
    } catch (error) {
      console.error('Klaida istorijos API:', error);
    }
  },

  async getHistory(limit = 100) {
    const { data, error } = await supabase
      .from('production_history')
      .select(`
        *,
        user:users(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async getEntityHistory(entityType, entityId) {
    const { data, error } = await supabase
      .from('production_history')
      .select(`
        *,
        user:users(name)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// Inventorizacijos ciklų funkcijos
export const inventoryCyclesAPI = {
  async getSettings() {
    const { data, error } = await supabase
      .from('inventory_cycle_settings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.warn('Settings not found, using defaults');
    }
    
    const settings = data && data.length > 0 ? data[0] : null;
    
    return settings || {
      default_cycle_months: 3,
      start_date: new Date().toISOString().split('T')[0]
    };
  },

  async saveSettings(settings) {
    // Pirmiausia pabandyti gauti esamą įrašą
    const { data: existing } = await supabase
      .from('inventory_cycle_settings')
      .select('*')
      .limit(1);
    
    const settingsData = {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      default_cycle_months: settings.defaultCycleMonths,
      start_date: settings.startDate,
      updated_at: new Date().toISOString()
    };
    
    if (existing && existing.length > 0) {
      // Atnaujinti esamą
      const { data, error } = await supabase
        .from('inventory_cycle_settings')
        .update(settingsData)
        .eq('id', existing[0].id)
        .select()
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } else {
      // Sukurti naują
      const { data, error } = await supabase
        .from('inventory_cycle_settings')
        .insert(settingsData)
        .select()
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    }
  },

  async getRecords() {
    const { data, error } = await supabase
      .from('inventory_records')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

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

  async getComponentOverrides() {
    const { data, error } = await supabase
      .from('component_cycle_overrides')
      .select('*');
    
    if (error) throw error;
    return data || [];
  },

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
  }
};

// Kokybės kontrolės funkcijos
export const qualityAPI = {
  async getQualityChecks() {
    const { data, error } = await supabase
      .from('quality_checks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async addQualityCheck(checkData) {
    const { data, error } = await supabase
      .from('quality_checks')
      .insert({
        ...checkData,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Priežiūros funkcijos
export const maintenanceAPI = {
  async getMaintenanceTasks() {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .order('scheduled_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async addMaintenanceTask(taskData) {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert({
        ...taskData,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateMaintenanceTask(taskId, updates) {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Sistemos žurnalų funkcijos
export const systemLogsAPI = {
  async logAction(action, entityType = null, entityId = null, details = {}) {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          ip_address: null, // Galima pridėti IP gavimą
          user_agent: navigator.userAgent
        });
      
      if (error) console.error('Klaida įrašant sistemos žurnalą:', error);
    } catch (error) {
      console.error('Sistemos žurnalo klaida:', error);
    }
  },

  async getLogs(limit = 100) {
    const { data, error } = await supabase
      .from('system_logs')
      .select(`
        *,
        user:users(name, username)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }
};