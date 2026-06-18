/**
 * Property Subcategory Configurations
 */

import type { SubcategoryConfig } from '../types';
import {
  bedroomsField,
  bathroomsField,
  totalAreaField,
  areaUnitField,
  furnishingField,
  parkingField,
  floorNumberField,
  totalFloorsField,
  facingField,
  landTypeField,
  propertyAgeField,
  amenitiesField,
  roadAccessField,
  roadWidthField,
  monthlyRentField,
  securityDepositField,
  availableFromField,
} from '../fields';

export const apartments: SubcategoryConfig = {
  name: 'Apartments for Sale',
  fields: [
    { field: landTypeField, override: { label: 'Property Type', options: ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Duplex'] } },
    { field: bedroomsField },
    { field: bathroomsField },
    { field: totalAreaField },
    { field: areaUnitField },
    { field: furnishingField },
    { field: parkingField },
    { field: floorNumberField },
    { field: facingField },
    { field: amenitiesField },
    { field: propertyAgeField },
  ],
};

export const apartmentsRent: SubcategoryConfig = {
  name: 'Apartments for Rent',
  fields: [
    { field: landTypeField, override: { label: 'Property Type', options: ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Duplex'] } },
    { field: bedroomsField },
    { field: bathroomsField },
    { field: totalAreaField },
    { field: areaUnitField },
    { field: furnishingField },
    { field: parkingField },
    { field: floorNumberField },
    { field: facingField },
    { field: amenitiesField },
    { field: monthlyRentField },
    { field: securityDepositField },
    { field: availableFromField },
  ],
};

export const houses: SubcategoryConfig = {
  name: 'Houses for Sale',
  fields: [
    { field: landTypeField, override: { label: 'Property Type', options: ['Single Family', 'Bungalow', 'Villa', 'Townhouse', 'Duplex House'] } },
    { field: bedroomsField },
    { field: bathroomsField },
    { field: totalAreaField },
    { field: areaUnitField },
    { field: furnishingField },
    { field: parkingField },
    { field: totalFloorsField },
    { field: facingField },
    { field: amenitiesField },
    { field: roadAccessField },
    { field: propertyAgeField },
  ],
};

export const housesRent: SubcategoryConfig = {
  name: 'Houses for Rent',
  fields: [
    { field: landTypeField, override: { label: 'Property Type', options: ['Single Family', 'Bungalow', 'Villa', 'Townhouse', 'Duplex House'] } },
    { field: bedroomsField },
    { field: bathroomsField },
    { field: totalAreaField },
    { field: areaUnitField },
    { field: furnishingField },
    { field: parkingField },
    { field: totalFloorsField },
    { field: facingField },
    { field: amenitiesField },
    { field: monthlyRentField },
    { field: securityDepositField },
    { field: availableFromField },
  ],
};

export const land: SubcategoryConfig = {
  name: 'Land & Plots',
  fields: [
    { field: totalAreaField, override: { label: 'Land Area' } },
    { field: areaUnitField },
    { field: landTypeField, override: { label: 'Zoning' } },
    { field: roadAccessField },
    { field: roadWidthField },
    { field: facingField },
  ],
};

export const commercialSale: SubcategoryConfig = {
  name: 'Commercial Properties for Sale',
  fields: [
    { field: landTypeField, override: { label: 'Property Type', options: ['Office Space', 'Shop', 'Showroom', 'Warehouse', 'Factory', 'Restaurant Space'] } },
    { field: totalAreaField },
    { field: areaUnitField },
    { field: furnishingField },
    { field: parkingField },
    { field: floorNumberField },
    { field: amenitiesField },
    { field: roadAccessField },
    { field: propertyAgeField },
  ],
};

export const commercialRent: SubcategoryConfig = {
  name: 'Commercial Properties for Rent',
  fields: [
    { field: landTypeField, override: { label: 'Property Type', options: ['Office Space', 'Shop', 'Showroom', 'Warehouse', 'Factory', 'Restaurant Space'] } },
    { field: totalAreaField },
    { field: areaUnitField },
    { field: furnishingField },
    { field: parkingField },
    { field: floorNumberField },
    { field: amenitiesField },
    { field: monthlyRentField },
    { field: securityDepositField },
    { field: availableFromField },
  ],
};

export const roomsRent: SubcategoryConfig = {
  name: 'Rooms & Flatmates',
  fields: [
    { field: landTypeField, override: { label: 'Room Type', options: ['Single Room', 'Shared Room', 'Master Bedroom', 'Hostel Bed'] } },
    { field: furnishingField },
    { field: amenitiesField, override: { options: ['WiFi', 'Kitchen', 'Laundry', 'Parking', 'Attached Bathroom', 'Hot Water'] } },
    { field: monthlyRentField },
    { field: securityDepositField },
    { field: availableFromField },
  ],
};

// Export all property subcategories as a map.
//
// ⚠️ IMPORTANT: these keys DO NOT match the real DB subcategory names (DB uses
// 'Apartments For Sale', 'House Rentals', 'Land For Sale', 'Room Rentals',
// 'New projects on PropertyGuide', etc.). Because hasSubcategoryConfig() does an
// exact-name lookup, none of these match, so the PROPERTY TEMPLATE (templates/
// property.ts) is what actually drives every property subcategory form — and
// that is where the Condition field is correctly gated to the 3 "For Sale"
// subcategories. If you "fix" these keys to match the DB, these (condition-less)
// configs would take over and silently drop Condition from Houses/Apartments/
// Commercial For Sale. Either keep them mismatched, or migrate the template
// fields (incl. Condition on the for-sale subcats) into these configs first.
export const propertySubcategories: Record<string, SubcategoryConfig> = {
  'Apartments for Sale': apartments,
  'Apartments for Rent': apartmentsRent,
  'Houses for Sale': houses,
  'Houses for Rent': housesRent,
  'Land & Plots': land,
  'Commercial Properties for Sale': commercialSale,
  'Commercial Properties for Rent': commercialRent,
  'Rooms & Flatmates': roomsRent,
};
