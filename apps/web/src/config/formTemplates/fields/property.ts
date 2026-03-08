/**
 * Property Fields
 */

import type { FormField } from '../types';

export const totalAreaField: FormField = {
  name: 'totalArea',
  label: 'Total Area',
  labelNe: 'कुल क्षेत्रफल',
  type: 'number',
  required: true,
  placeholder: 'Enter area',
  placeholderNe: 'क्षेत्रफल लेख्नुहोस्',
  appliesTo: 'all',
};

export const areaUnitField: FormField = {
  name: 'areaUnit',
  label: 'Area Unit',
  labelNe: 'क्षेत्रफल एकाइ',
  type: 'select',
  required: true,
  options: ['sq ft', 'aana', 'ropani', 'sq meter'],
  optionsNe: ['वर्ग फिट', 'आना', 'रोपनी', 'वर्ग मिटर'],
  appliesTo: 'all',
};

export const bedroomsField: FormField = {
  name: 'bedrooms',
  label: 'Bedrooms',
  labelNe: 'शयनकोठा',
  type: 'select',
  required: true,
  options: ['Studio', '1', '2', '3', '4', '5', '6+'],
  optionsNe: ['स्टुडियो', '१', '२', '३', '४', '५', '६+'],
  appliesTo: 'all',
};

export const bathroomsField: FormField = {
  name: 'bathrooms',
  label: 'Bathrooms',
  labelNe: 'स्नानकोठा',
  type: 'select',
  required: true,
  options: ['1', '2', '3', '4', '5+'],
  optionsNe: ['१', '२', '३', '४', '५+'],
  appliesTo: 'all',
};

export const furnishingField: FormField = {
  name: 'furnishing',
  label: 'Furnishing Status',
  labelNe: 'फर्निचर स्थिति',
  type: 'select',
  required: false,
  options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
  optionsNe: ['पूर्ण फर्निचर', 'आंशिक फर्निचर', 'फर्निचर बिना'],
  appliesTo: 'all',
};

export const floorNumberField: FormField = {
  name: 'floorNumber',
  label: 'Floor Number',
  labelNe: 'तल्ला नम्बर',
  type: 'number',
  required: false,
  placeholder: 'e.g., 5',
  placeholderNe: 'जस्तै, ५',
  appliesTo: 'all',
};

export const totalFloorsField: FormField = {
  name: 'totalFloors',
  label: 'Total Floors in Building',
  labelNe: 'भवनको कुल तल्ला',
  type: 'number',
  required: false,
  placeholder: 'e.g., 12',
  placeholderNe: 'जस्तै, १२',
  appliesTo: 'all',
};

export const parkingField: FormField = {
  name: 'parking',
  label: 'Number of Parking Spaces',
  labelNe: 'पार्किङ स्थान',
  type: 'select',
  required: false,
  options: ['None', '1', '2', '3', '4+'],
  optionsNe: ['छैन', '१', '२', '३', '४+'],
  appliesTo: 'all',
};

export const facingField: FormField = {
  name: 'facing',
  label: 'Facing Direction',
  labelNe: 'मुख दिशा',
  type: 'select',
  required: false,
  options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'],
  optionsNe: ['उत्तर', 'दक्षिण', 'पूर्व', 'पश्चिम', 'उत्तर-पूर्व', 'उत्तर-पश्चिम', 'दक्षिण-पूर्व', 'दक्षिण-पश्चिम'],
  appliesTo: 'all',
};

export const propertyAgeField: FormField = {
  name: 'propertyAge',
  label: 'Property Age',
  labelNe: 'सम्पत्ति उमेर',
  type: 'select',
  required: false,
  options: ['Under Construction', '0-1 years', '1-5 years', '5-10 years', '10-20 years', '20+ years'],
  optionsNe: ['निर्माणाधीन', '०-१ वर्ष', '१-५ वर्ष', '५-१० वर्ष', '१०-२० वर्ष', '२०+ वर्ष'],
  appliesTo: 'all',
};

export const amenitiesField: FormField = {
  name: 'amenities',
  label: 'Amenities',
  labelNe: 'सुविधाहरू',
  type: 'multiselect',
  required: false,
  options: ['Lift/Elevator', 'Power Backup', 'Water Supply', 'Security/Gated', 'Gym', 'Swimming Pool', 'Garden', 'Playground', 'Club House', 'Visitor Parking'],
  optionsNe: ['लिफ्ट', 'पावर ब्याकअप', 'पानी आपूर्ति', 'सुरक्षा/गेटेड', 'जिम', 'स्विमिङ पुल', 'बगैंचा', 'खेल मैदान', 'क्लब हाउस', 'आगन्तुक पार्किङ'],
  appliesTo: 'all',
};

export const landTypeField: FormField = {
  name: 'landType',
  label: 'Land Type',
  labelNe: 'जग्गा प्रकार',
  type: 'select',
  required: false,
  options: ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use'],
  optionsNe: ['आवासीय', 'व्यापारिक', 'कृषि', 'औद्योगिक', 'मिश्रित'],
  appliesTo: 'all',
};

export const roadAccessField: FormField = {
  name: 'roadAccess',
  label: 'Road Access',
  labelNe: 'सडक पहुँच',
  type: 'select',
  required: false,
  options: ['Paved Road', 'Graveled Road', 'Dirt Road', 'No Direct Access'],
  optionsNe: ['पक्की सडक', 'ग्राभेल सडक', 'कच्ची सडक', 'प्रत्यक्ष पहुँच छैन'],
  appliesTo: 'all',
};

export const roadWidthField: FormField = {
  name: 'roadWidth',
  label: 'Road Width',
  labelNe: 'सडक चौडाइ',
  type: 'number',
  required: false,
  placeholder: 'in feet',
  placeholderNe: 'फिटमा',
  appliesTo: 'all',
};

export const monthlyRentField: FormField = {
  name: 'monthlyRent',
  label: 'Monthly Rent',
  labelNe: 'मासिक भाडा',
  type: 'number',
  required: true,
  placeholder: 'in NPR',
  placeholderNe: 'रुपैयाँमा',
  appliesTo: 'all',
};

export const securityDepositField: FormField = {
  name: 'securityDeposit',
  label: 'Security Deposit',
  labelNe: 'धरौटी',
  type: 'number',
  required: false,
  placeholder: 'in NPR',
  placeholderNe: 'रुपैयाँमा',
  appliesTo: 'all',
};

export const availableFromField: FormField = {
  name: 'availableFrom',
  label: 'Available From',
  labelNe: 'उपलब्ध मिति',
  type: 'select',
  required: false,
  options: ['Immediately', '15 days', '1 month', '2 months', '3 months'],
  optionsNe: ['तुरुन्तै', '१५ दिन', '१ महिना', '२ महिना', '३ महिना'],
  appliesTo: 'all',
};
