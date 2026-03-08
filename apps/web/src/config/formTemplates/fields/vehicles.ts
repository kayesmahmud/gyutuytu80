/**
 * Vehicle Fields
 */

import type { FormField } from '../types';

export const vehicleYearField: FormField = {
  name: 'year',
  label: 'Year of Manufacture',
  labelNe: 'निर्माण वर्ष',
  type: 'number',
  required: true,
  min: 1980,
  max: 2025,
  placeholder: 'e.g., 2020',
  placeholderNe: 'जस्तै, २०२०',
  appliesTo: 'all',
};

export const mileageField: FormField = {
  name: 'mileage',
  label: 'Mileage/Kilometers Driven',
  labelNe: 'माइलेज/किलोमिटर',
  type: 'number',
  required: false,
  placeholder: 'in km',
  placeholderNe: 'किमी मा',
  appliesTo: 'all',
};

export const fuelTypeField: FormField = {
  name: 'fuelType',
  label: 'Fuel Type',
  labelNe: 'इन्धन प्रकार',
  type: 'select',
  required: true,
  options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'],
  optionsNe: ['पेट्रोल', 'डिजेल', 'इलेक्ट्रिक', 'हाइब्रिड', 'सीएनजी', 'एलपीजी'],
  appliesTo: 'all',
};

export const transmissionField: FormField = {
  name: 'transmission',
  label: 'Transmission',
  labelNe: 'ट्रान्समिसन',
  type: 'select',
  required: true,
  options: ['Manual', 'Automatic', 'Semi-Automatic'],
  optionsNe: ['म्यानुअल', 'अटोम्याटिक', 'सेमी-अटोम्याटिक'],
  appliesTo: 'all',
};

export const engineCapacityField: FormField = {
  name: 'engineCapacity',
  label: 'Engine Capacity (cc)',
  labelNe: 'इन्जिन क्षमता (cc)',
  type: 'number',
  required: false,
  placeholder: 'e.g., 1500',
  placeholderNe: 'जस्तै, १५००',
  appliesTo: 'all',
};

export const ownersField: FormField = {
  name: 'owners',
  label: 'Number of Owners',
  labelNe: 'मालिक संख्या',
  type: 'select',
  required: false,
  options: ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner or More'],
  optionsNe: ['पहिलो मालिक', 'दोस्रो मालिक', 'तेस्रो मालिक', 'चौथो वा बढी'],
  appliesTo: 'all',
};

export const registrationYearField: FormField = {
  name: 'registrationYear',
  label: 'Registration Year',
  labelNe: 'दर्ता वर्ष',
  type: 'number',
  required: false,
  min: 1980,
  max: 2025,
  appliesTo: 'all',
};

export const registrationLocationField: FormField = {
  name: 'registrationLocation',
  label: 'Registration Location',
  labelNe: 'दर्ता स्थान',
  type: 'text',
  required: false,
  placeholder: 'e.g., Bagmati, Kathmandu',
  placeholderNe: 'जस्तै, बागमती, काठमाडौं',
  appliesTo: 'all',
};

export const seatsField: FormField = {
  name: 'seats',
  label: 'Number of Seats',
  labelNe: 'सिट संख्या',
  type: 'select',
  required: false,
  options: ['2', '4', '5', '7', '8+'],
  appliesTo: 'all',
};

export const bodyTypeField: FormField = {
  name: 'bodyType',
  label: 'Body Type',
  labelNe: 'बडी प्रकार',
  type: 'select',
  required: false,
  options: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Pickup', 'Van'],
  optionsNe: ['सेडान', 'एसयुभी', 'ह्याचब्याक', 'कुपे', 'कन्भर्टिबल', 'पिकअप', 'भ्यान'],
  appliesTo: 'all',
};

export const parkingSensorsField: FormField = {
  name: 'parkingSensors',
  label: 'Parking Sensors',
  labelNe: 'पार्किङ सेन्सर',
  type: 'checkbox',
  required: false,
  appliesTo: 'all',
};

export const backupCameraField: FormField = {
  name: 'backupCamera',
  label: 'Backup Camera',
  labelNe: 'ब्याकअप क्यामेरा',
  type: 'checkbox',
  required: false,
  appliesTo: 'all',
};

export const bicycleTypeField: FormField = {
  name: 'bicycleType',
  label: 'Bicycle Type',
  labelNe: 'साइकल प्रकार',
  type: 'select',
  required: false,
  options: ['Mountain Bike', 'Road Bike', 'Hybrid', 'Electric', 'Kids Bike'],
  optionsNe: ['माउन्टेन बाइक', 'रोड बाइक', 'हाइब्रिड', 'इलेक्ट्रिक', 'बच्चाको साइकल'],
  appliesTo: 'all',
};

export const frameSizeField: FormField = {
  name: 'frameSize',
  label: 'Frame Size',
  labelNe: 'फ्रेम साइज',
  type: 'text',
  required: false,
  placeholder: 'e.g., Medium, 27.5"',
  placeholderNe: 'जस्तै, Medium, 27.5"',
  appliesTo: 'all',
};
