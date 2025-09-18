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
        category:categories(id, name, color),
        components:subassembly_components(
          required_quantity,
          component:components(id, name, stock)
        ),
        comments:subassembly_comments(
          id, comment, created_at,
          author:users(id, name)
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
    try {
      await productionHistoryAPI.logAction('subassembly', data.id, data.name, 'created', null, subassemblyData);
    } catch (historyError) {
      console.warn('Failed to log history:', historyError);
    }
    
    return data;
  },

  async updateSubassembly(subassemblyId, updates) {
    const { data, error } = await supabase
      .from('subassemblies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', subassemblyId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Įrašyti į istoriją (neblokuojame jei nepavyksta)
    try {
      await productionHistoryAPI.logAction('subassembly', subassemblyId, data.name, 'updated', null, updates);
    } catch (historyError) {
      console.warn('Failed to log history:', historyError);
    }
    
    return data;
  },

  async deleteSubassembly(subassemblyId) {
    // Get subassembly data before deletion
    const { data: subassemblyData } = await supabase
      .from('subassemblies')
      .select('*')
      .eq('id', subassemblyId)
      .single();

    const { error } = await supabase
      .from('subassemblies')
      .delete()
      .eq('id', subassemblyId);
    
    if (error) throw error;
    
    // Įrašyti į istoriją
    if (subassemblyData) {
      try {
        await productionHistoryAPI.logAction('subassembly', subassemblyId, subassemblyData.name, 'deleted', subassemblyData, null);
      } catch (historyError) {
        console.warn('Failed to log history:', historyError);
      }
    }
  },

  async addSubassemblyComponents(subassemblyId, components) {
    // First, remove existing components
    await supabase
      .from('subassembly_components')
      .delete()
      .eq('subassembly_id', subassemblyId);
    
    // Then add new components
    if (components.length > 0) {
      const componentsToInsert = components.map(comp => ({
        subassembly_id: subassemblyId,
        component_id: comp.componentId,
        required_quantity: comp.requiredQuantity
      }));
      
      const { error } = await supabase
        .from('subassembly_components')
        .insert(componentsToInsert);
      
      if (error) throw error;
    }
  },

  async updateSubassemblyParent(subassemblyId, parentId) {
    const { data, error } = await supabase
      .from('subassemblies')
      .update({ parent_id: parentId, updated_at: new Date().toISOString() })
      .eq('id', subassemblyId)
      .select()
      .single();
    
    if (error) throw error;
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
    try {
      const { data, error } = await supabase
        .from('inventory_cycle_settings')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || {
        default_cycle_months: 3,
        start_date: new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.warn('Settings not found, using defaults:', error);
      return {
        default_cycle_months: 3,
        start_date: new Date().toISOString().split('T')[0]
      };
    }
  },

  async saveSettings(settings) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const settingsData = {
      user_id: userId,
      default_cycle_months: settings.defaultCycleMonths,
      start_date: settings.startDate,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('inventory_cycle_settings')
      .upsert(settingsData, { onConflict: 'user_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getRecords() {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('inventory_records')
        .select(`
          *,
          component:components(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to include component name
      return (data || []).map(record => ({
        ...record,
        component_name: record.component?.name || 'Nežinomas komponentas'
      }));
    } catch (error) {
      console.error('Error fetching inventory records:', error);
      return [];
    }
  },

  async addRecord(record) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('inventory_records')
      .insert({
        component_id: record.componentId,
        expected_stock: record.expectedStock,
        actual_stock: record.actualStock,
        notes: record.notes || '',
        inspector: record.inspector,
        check_date: record.date || new Date().toISOString().split('T')[0],
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async addMultipleRecords(records) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const recordsToInsert = records.map(record => ({
      component_id: record.componentId,
      expected_stock: record.expectedStock,
      actual_stock: record.actualStock,
      notes: record.notes || '',
      inspector: record.inspector,
      check_date: new Date().toISOString().split('T')[0],
      user_id: userId
    }));

    const { data, error } = await supabase
      .from('inventory_records')
      .insert(recordsToInsert)
      .select();
    
    if (error) throw error;
    return data;
  },

  async getComponentOverrides() {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('component_cycle_overrides')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching component overrides:', error);
      return [];
    }
  },

  async saveComponentCycle(componentId, cycleMonths, isCritical = false) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const overrideData = {
      component_id: componentId,
      cycle_months: cycleMonths,
      is_critical: isCritical,
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('component_cycle_overrides')
      .upsert(overrideData, { onConflict: 'component_id,user_id' })
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