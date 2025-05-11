//@ts-nocheck
import { API_BASE_URL } from '~/config';

export interface SupabaseProject {
  id: number;
  organization_id: string;
  project_ref_id: string;
  urlId: string;
  ann_api_key: string;
  service_api_key: string;
}

export interface Organization {
  id: string;
  name: string;
  projects?: any[];
}

export const supabaseApi = {
  fetchOrganizationProjectsAPIKeys: async (project_id: string, access_token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/supabase/api/supabase/projects/${project_id}/api-keys`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  fetchOrganizationProjects: async (org_id: string, access_token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/supabase/api/supabase/organizations/${org_id}/projects`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  fetchOrganization: async (access_token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/supabase/api/supabase/organizations`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  fetchProjects: async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/supabase/projects-all-me`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      return result[0];
      
    } catch (error) {
      throw error;
    }
  }
};