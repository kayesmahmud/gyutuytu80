/**
 * Electronics Fields
 */

import type { FormField } from '../types';

export const storageField: FormField = {
  name: 'storage',
  label: 'Storage Capacity',
  labelNe: 'भण्डारण क्षमता',
  type: 'select',
  required: true,
  options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
  appliesTo: 'all',
};

export const ramField: FormField = {
  name: 'ram',
  label: 'RAM',
  labelNe: 'र्‍याम',
  type: 'select',
  required: true,
  options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
  appliesTo: 'all',
};

export const batteryHealthField: FormField = {
  name: 'batteryHealth',
  label: 'Battery Health',
  labelNe: 'ब्याट्री स्वास्थ्य',
  type: 'select',
  required: false,
  options: ['100%', '95-99%', '90-94%', '85-89%', '80-84%', 'Below 80%'],
  appliesTo: 'all',
};

export const processorField: FormField = {
  name: 'processor',
  label: 'Processor',
  labelNe: 'प्रोसेसर',
  type: 'text',
  required: true,
  placeholder: 'e.g., Intel Core i5 12th Gen, AMD Ryzen 7',
  placeholderNe: 'जस्तै, Intel Core i5, AMD Ryzen 7',
  appliesTo: 'all',
};

export const graphicsField: FormField = {
  name: 'graphics',
  label: 'Graphics Card',
  labelNe: 'ग्राफिक्स कार्ड',
  type: 'text',
  required: false,
  placeholder: 'e.g., NVIDIA RTX 3060, Integrated',
  placeholderNe: 'जस्तै, NVIDIA RTX 3060',
  appliesTo: 'all',
};

export const screenResolutionField: FormField = {
  name: 'screenResolution',
  label: 'Screen Resolution',
  labelNe: 'स्क्रिन रिजोलुसन',
  type: 'select',
  required: false,
  options: ['HD (1366x768)', 'Full HD (1920x1080)', '2K', '4K', 'Retina'],
  appliesTo: 'all',
};

export const screenSizeField: FormField = {
  name: 'screenSize',
  label: 'Screen Size',
  labelNe: 'स्क्रिन साइज',
  type: 'text',
  required: true,
  placeholder: 'e.g., 55 inches',
  placeholderNe: 'जस्तै, ५५ इन्च',
  appliesTo: 'all',
};

export const smartFeaturesField: FormField = {
  name: 'smartFeatures',
  label: 'Smart Features',
  labelNe: 'स्मार्ट सुविधाहरू',
  type: 'multiselect',
  required: false,
  options: ['Smart TV', '4K', 'HDR', 'Android TV', 'WebOS', 'Voice Control'],
  appliesTo: 'all',
};

export const megapixelsField: FormField = {
  name: 'megapixels',
  label: 'Megapixels',
  labelNe: 'मेगापिक्सेल',
  type: 'number',
  required: false,
  placeholder: 'e.g., 24, 48, 108',
  placeholderNe: 'जस्तै, २४, ४८, १०८',
  appliesTo: 'all',
};

export const sensorSizeField: FormField = {
  name: 'sensorSize',
  label: 'Sensor Size',
  labelNe: 'सेन्सर साइज',
  type: 'text',
  required: false,
  placeholder: 'e.g., Full Frame, APS-C, Micro 4/3',
  placeholderNe: 'जस्तै, Full Frame, APS-C',
  appliesTo: 'all',
};
