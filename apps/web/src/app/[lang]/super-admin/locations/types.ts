export interface Location {
  id: number;
  name: string;
  name_ne: string | null;
  slug: string | null;
  type: LocationType;
  parent_id: number | null;
  parent_name: string | null;
  latitude: string | null;
  longitude: string | null;
  created_at: string;
  ad_count: string;
  user_count: string;
  sublocation_count: string;
}

export type LocationType = 'province' | 'district' | 'municipality' | 'area';

export interface LocationFormData {
  name: string;
  name_ne: string;
  slug: string;
  type: LocationType;
  parent_id: string;
  latitude: string;
  longitude: string;
}

export const DEFAULT_FORM_DATA: LocationFormData = {
  name: '',
  name_ne: '',
  slug: '',
  type: 'municipality',
  parent_id: '',
  latitude: '',
  longitude: '',
};
