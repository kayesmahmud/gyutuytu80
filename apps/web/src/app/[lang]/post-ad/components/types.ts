export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent_id?: number | null;
  parentId?: number | null;
  subcategories?: Category[];
}

export interface PostAdFormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  subcategoryId: string;
  locationSlug: string;
  locationName: string;
  condition: string;
  isNegotiable: boolean;
  isCodAvailable: boolean;
  /** When true the WhatsApp number mirrors the verified phone and is not editable. */
  whatsappSameAsPhone: boolean;
  whatsappNumber: string;
}

export const INITIAL_FORM_DATA: PostAdFormData = {
  title: '',
  description: '',
  price: '',
  categoryId: '',
  subcategoryId: '',
  locationSlug: '',
  locationName: '',
  condition: 'Brand New',
  isNegotiable: false,
  isCodAvailable: false,
  whatsappSameAsPhone: true,
  whatsappNumber: '',
};
