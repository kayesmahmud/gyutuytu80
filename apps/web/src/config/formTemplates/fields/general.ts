/**
 * General Fields - Furniture, Sports, Business, Essentials, Agriculture
 */

import type { FormField } from '../types';

// Furniture fields
export const furnitureTypeField: FormField = {
  name: 'furnitureType',
  label: 'Furniture Type',
  labelNe: 'फर्निचर प्रकार',
  type: 'select',
  required: true,
  options: ['Bed', 'Sofa', 'Table', 'Chair', 'Wardrobe', 'Shelf', 'Desk', 'Cabinet', 'Dining Set', 'Other'],
  optionsNe: ['बेड', 'सोफा', 'टेबल', 'कुर्सी', 'अलमारी', 'शेल्फ', 'डेस्क', 'क्याबिनेट', 'डाइनिङ सेट', 'अन्य'],
  appliesTo: 'all',
};

export const materialField: FormField = {
  name: 'material',
  label: 'Material',
  labelNe: 'सामग्री',
  type: 'select',
  required: false,
  options: ['Wood', 'Metal', 'Plastic', 'Glass', 'Leather', 'Fabric', 'Mixed Materials'],
  optionsNe: ['काठ', 'धातु', 'प्लास्टिक', 'गिलास', 'छाला', 'कपडा', 'मिश्रित'],
  appliesTo: 'all',
};

export const dimensionsField: FormField = {
  name: 'dimensions',
  label: 'Dimensions (L × W × H)',
  labelNe: 'आयाम (ल × चौ × उ)',
  type: 'text',
  required: false,
  placeholder: 'e.g., 200cm × 100cm × 80cm',
  placeholderNe: 'जस्तै, २०० सेमी × १०० सेमी × ८० सेमी',
  appliesTo: 'all',
};

export const assemblyRequiredField: FormField = {
  name: 'assemblyRequired',
  label: 'Assembly Required',
  labelNe: 'जोड्ने आवश्यक',
  type: 'select',
  required: false,
  options: ['Yes - Assembly Required', 'No - Ready to Use', 'Partial Assembly'],
  optionsNe: ['हो - जोड्ने आवश्यक', 'छैन - प्रयोगको लागि तयार', 'आंशिक जोड्ने'],
  appliesTo: 'all',
};

export const seatingCapacityField: FormField = {
  name: 'seatingCapacity',
  label: 'Seating Capacity',
  labelNe: 'बस्ने क्षमता',
  type: 'select',
  required: false,
  options: ['1 Person', '2-3 People', '4-6 People', '6-8 People', '8+ People'],
  optionsNe: ['१ जना', '२-३ जना', '४-६ जना', '६-८ जना', '८+ जना'],
  appliesTo: 'all',
};

export const storageAvailableField: FormField = {
  name: 'storageAvailable',
  label: 'Storage Available',
  labelNe: 'भण्डारण उपलब्ध',
  type: 'select',
  required: false,
  options: ['Yes', 'No'],
  optionsNe: ['छ', 'छैन'],
  appliesTo: 'all',
};

export const styleField: FormField = {
  name: 'style',
  label: 'Style',
  labelNe: 'शैली',
  type: 'select',
  required: false,
  options: ['Modern', 'Traditional', 'Vintage', 'Minimalist', 'Contemporary', 'Rustic', 'Industrial'],
  optionsNe: ['आधुनिक', 'परम्परागत', 'पुरानो', 'न्यूनतम', 'समकालीन', 'ग्रामीण', 'औद्योगिक'],
  appliesTo: 'all',
};

// Sports & Hobbies fields
export const sportTypeField: FormField = {
  name: 'sportType',
  label: 'Sport Type',
  labelNe: 'खेल प्रकार',
  type: 'text',
  required: false,
  placeholder: 'e.g., Cricket, Football, Basketball',
  placeholderNe: 'जस्तै, क्रिकेट, फुटबल, बास्केटबल',
  appliesTo: 'all',
};

export const instrumentTypeField: FormField = {
  name: 'instrumentType',
  label: 'Instrument Type',
  labelNe: 'वाद्य प्रकार',
  type: 'text',
  required: false,
  placeholder: 'e.g., Guitar, Piano, Drums',
  placeholderNe: 'जस्तै, गिटार, पियानो, ड्रम',
  appliesTo: 'all',
};

// Business & Industry fields
export const machineryTypeField: FormField = {
  name: 'machineryType',
  label: 'Machinery Type',
  labelNe: 'मेसिनरी प्रकार',
  type: 'select',
  required: true,
  options: ['Construction', 'Manufacturing', 'Agricultural', 'Office Equipment', 'Medical Equipment'],
  optionsNe: ['निर्माण', 'उत्पादन', 'कृषि', 'कार्यालय उपकरण', 'चिकित्सा उपकरण'],
  appliesTo: 'all',
};

export const powerSourceField: FormField = {
  name: 'powerSource',
  label: 'Power Source',
  labelNe: 'शक्ति स्रोत',
  type: 'select',
  required: false,
  options: ['Electric', 'Manual', 'Diesel', 'Petrol', 'Battery'],
  optionsNe: ['इलेक्ट्रिक', 'म्यानुअल', 'डिजेल', 'पेट्रोल', 'ब्याट्री'],
  appliesTo: 'all',
};

// Essentials fields
export const productTypeField: FormField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: true,
  options: ['Food Item', 'Household Item', 'Baby Product', 'Healthcare'],
  optionsNe: ['खाद्य पदार्थ', 'घरायसी सामान', 'बच्चा उत्पादन', 'स्वास्थ्य'],
  appliesTo: 'all',
};

export const quantityField: FormField = {
  name: 'quantity',
  label: 'Quantity Available',
  labelNe: 'उपलब्ध मात्रा',
  type: 'number',
  required: false,
  placeholder: 'Enter quantity',
  placeholderNe: 'मात्रा लेख्नुहोस्',
  appliesTo: 'all',
};

export const expiryDateField: FormField = {
  name: 'expiryDate',
  label: 'Expiry Date',
  labelNe: 'म्याद सकिने मिति',
  type: 'date',
  required: false,
  appliesTo: 'all',
};

export const manufacturingDateField: FormField = {
  name: 'manufacturingDate',
  label: 'Manufacturing Date',
  labelNe: 'उत्पादन मिति',
  type: 'date',
  required: false,
  appliesTo: 'all',
};

export const productWeightField: FormField = {
  name: 'productWeight',
  label: 'Weight / Volume',
  labelNe: 'तौल / आयतन',
  type: 'text',
  required: false,
  placeholder: 'e.g., 250ml, 100gm, 50gm',
  placeholderNe: 'जस्तै, २५०मिली, १००ग्राम, ५०ग्राम',
  appliesTo: 'all',
};

// Agriculture fields
export const cropTypeField: FormField = {
  name: 'cropType',
  label: 'Crop/Plant Type',
  labelNe: 'बाली/बिरुवा प्रकार',
  type: 'text',
  required: true,
  placeholder: 'e.g., Rice, Wheat, Tomato',
  placeholderNe: 'जस्तै, धान, गहुँ, टमाटर',
  appliesTo: 'all',
};

export const farmingToolTypeField: FormField = {
  name: 'farmingToolType',
  label: 'Farming Tool Type',
  labelNe: 'कृषि औजार',
  type: 'select',
  required: false,
  options: ['Tractor', 'Plough', 'Harvester', 'Sprayer', 'Hand Tool'],
  optionsNe: ['ट्र्याक्टर', 'हलो', 'हार्भेस्टर', 'स्प्रेयर', 'हात औजार'],
  appliesTo: 'all',
};
