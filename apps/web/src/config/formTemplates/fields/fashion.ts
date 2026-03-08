/**
 * Fashion & Apparel Fields
 */

import type { FormField } from '../types';

export const sizeField: FormField = {
  name: 'size',
  label: 'Size',
  labelNe: 'साइज',
  type: 'select',
  required: true,
  options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'],
  optionsNe: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'फ्री साइज'],
  appliesTo: 'all',
};

export const clothingTypeField: FormField = {
  name: 'clothingType',
  label: 'Clothing Type',
  labelNe: 'लुगा प्रकार',
  type: 'select',
  required: true,
  options: ['Shirt', 'T-Shirt', 'Pants', 'Jeans', 'Dress', 'Saree', 'Kurta', 'Jacket', 'Coat', 'Sweater', 'Skirt', 'Shorts'],
  optionsNe: ['सर्ट', 'टी-सर्ट', 'प्यान्ट', 'जिन्स', 'ड्रेस', 'साडी', 'कुर्ता', 'ज्याकेट', 'कोट', 'स्वेटर', 'स्कर्ट', 'सर्ट्स'],
  appliesTo: 'all',
};

export const fitTypeField: FormField = {
  name: 'fitType',
  label: 'Fit Type',
  labelNe: 'फिट प्रकार',
  type: 'select',
  required: false,
  options: ['Regular Fit', 'Slim Fit', 'Loose Fit', 'Skinny Fit'],
  optionsNe: ['रेगुलर फिट', 'स्लिम फिट', 'लुज फिट', 'स्किनी फिट'],
  appliesTo: 'all',
};

export const sleeveTypeField: FormField = {
  name: 'sleeveType',
  label: 'Sleeve Type',
  labelNe: 'बाहुला प्रकार',
  type: 'select',
  required: false,
  options: ['Full Sleeve', 'Half Sleeve', 'Sleeveless', '3/4 Sleeve'],
  optionsNe: ['पूरा बाहुला', 'आधा बाहुला', 'बाहुला बिना', '३/४ बाहुला'],
  appliesTo: 'all',
};

export const footwearTypeField: FormField = {
  name: 'footwearType',
  label: 'Footwear Type',
  labelNe: 'जुत्ता प्रकार',
  type: 'select',
  required: true,
  options: ['Sneakers', 'Formal Shoes', 'Sandals', 'Slippers', 'Boots', 'Heels', 'Flats', 'Sports Shoes'],
  optionsNe: ['स्निकर्स', 'औपचारिक जुत्ता', 'सेन्डल', 'चप्पल', 'बुट', 'हिल', 'फ्ल्याट', 'खेलकुद जुत्ता'],
  appliesTo: 'all',
};

export const shoeSizeField: FormField = {
  name: 'shoeSize',
  label: 'Shoe Size',
  labelNe: 'जुत्ता साइज',
  type: 'number',
  required: true,
  min: 32,
  max: 50,
  placeholder: 'e.g., 38, 40, 42',
  placeholderNe: 'जस्तै, ३८, ४०, ४२',
  appliesTo: 'all',
};

export const watchTypeField: FormField = {
  name: 'watchType',
  label: 'Watch Type',
  labelNe: 'घडी प्रकार',
  type: 'select',
  required: false,
  options: ['Analog', 'Digital', 'Smart Watch', 'Chronograph'],
  optionsNe: ['एनालग', 'डिजिटल', 'स्मार्ट वाच', 'क्रोनोग्राफ'],
  appliesTo: 'all',
};

export const strapMaterialField: FormField = {
  name: 'strapMaterial',
  label: 'Strap Material',
  labelNe: 'स्ट्र्याप सामग्री',
  type: 'select',
  required: false,
  options: ['Leather', 'Metal', 'Rubber', 'Fabric'],
  optionsNe: ['छाला', 'धातु', 'रबर', 'कपडा'],
  appliesTo: 'all',
};
