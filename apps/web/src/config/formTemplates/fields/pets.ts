/**
 * Pets & Animals Fields
 */

import type { FormField } from '../types';

export const animalTypeField: FormField = {
  name: 'animalType',
  label: 'Animal Type',
  labelNe: 'पशु प्रकार',
  type: 'select',
  required: true,
  options: ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Cow', 'Buffalo', 'Goat', 'Chicken', 'Duck', 'Other'],
  optionsNe: ['कुकुर', 'बिरालो', 'चरा', 'माछा', 'खरायो', 'ह्यामस्टर', 'गिनी पिग', 'गाई', 'भैंसी', 'बाख्रा', 'कुखुरा', 'हाँस', 'अन्य'],
  appliesTo: 'all',
};

export const breedField: FormField = {
  name: 'breed',
  label: 'Breed',
  labelNe: 'नस्ल',
  type: 'text',
  required: false,
  placeholder: 'e.g., Golden Retriever, Persian Cat',
  placeholderNe: 'जस्तै, गोल्डेन रिट्रिभर, पर्सियन बिरालो',
  appliesTo: 'all',
};

export const petAgeField: FormField = {
  name: 'age',
  label: 'Age',
  labelNe: 'उमेर',
  type: 'select',
  required: true,
  options: ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'],
  optionsNe: ['०-३ महिना', '३-६ महिना', '६-१२ महिना', '१-२ वर्ष', '२-५ वर्ष', '५+ वर्ष'],
  appliesTo: 'all',
};

export const petGenderField: FormField = {
  name: 'gender',
  label: 'Gender',
  labelNe: 'लिङ्ग',
  type: 'select',
  required: false,
  options: ['Male', 'Female', 'Unknown'],
  optionsNe: ['भाले', 'पोथी', 'थाहा छैन'],
  appliesTo: 'all',
};

export const vaccinationField: FormField = {
  name: 'vaccination',
  label: 'Vaccination Status',
  labelNe: 'खोप स्थिति',
  type: 'select',
  required: true,
  options: ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
  optionsNe: ['पूर्ण खोप लगाइएको', 'आंशिक खोप', 'खोप नलगाइएको'],
  appliesTo: 'all',
};

export const petPapersField: FormField = {
  name: 'papers',
  label: 'Pet Papers/Documents',
  labelNe: 'कागजात',
  type: 'select',
  required: false,
  options: ['Yes - All Papers', 'Some Papers', 'No Papers'],
  optionsNe: ['छ - सबै कागजात', 'केही कागजात', 'कागजात छैन'],
  appliesTo: 'all',
};

export const petColorField: FormField = {
  name: 'color',
  label: 'Color/Coat Color',
  labelNe: 'रङ',
  type: 'text',
  required: false,
  placeholder: 'e.g., Brown, Black, White',
  placeholderNe: 'जस्तै, खैरो, कालो, सेतो',
  appliesTo: 'all',
};

export const petWeightField: FormField = {
  name: 'weight',
  label: 'Weight',
  labelNe: 'तौल',
  type: 'number',
  required: false,
  placeholder: 'in kg',
  placeholderNe: 'केजीमा',
  appliesTo: 'all',
};

export const trainedField: FormField = {
  name: 'trained',
  label: 'Trained',
  labelNe: 'प्रशिक्षित',
  type: 'select',
  required: false,
  options: ['Fully Trained', 'Partially Trained', 'Not Trained'],
  optionsNe: ['पूर्ण प्रशिक्षित', 'आंशिक प्रशिक्षित', 'प्रशिक्षित छैन'],
  appliesTo: 'all',
};

export const friendlyWithField: FormField = {
  name: 'friendlyWith',
  label: 'Friendly With',
  labelNe: 'मैत्रीपूर्ण',
  type: 'multiselect',
  required: false,
  options: ['Children', 'Other Dogs', 'Cats', 'Strangers'],
  optionsNe: ['बच्चाहरू', 'अन्य कुकुर', 'बिरालो', 'अपरिचित'],
  appliesTo: 'all',
};

export const petProductTypeField: FormField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: true,
  options: ['Food', 'Toy', 'Cage', 'Leash', 'Collar', 'Grooming', 'Medicine', 'Bedding'],
  optionsNe: ['खाना', 'खेलौना', 'पिंजरा', 'पट्टा', 'कलर', 'ग्रुमिङ', 'औषधि', 'ओछ्यान'],
  appliesTo: 'all',
};

export const suitableForField: FormField = {
  name: 'suitableFor',
  label: 'Suitable For',
  labelNe: 'उपयुक्त',
  type: 'select',
  required: false,
  options: ['Dogs', 'Cats', 'Birds', 'Fish', 'All Pets'],
  optionsNe: ['कुकुर', 'बिरालो', 'चरा', 'माछा', 'सबै पालतु'],
  appliesTo: 'all',
};
