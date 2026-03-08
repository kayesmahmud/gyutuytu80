/**
 * Services & Jobs Fields
 */

import type { FormField } from '../types';

export const experienceField: FormField = {
  name: 'experience',
  label: 'Experience',
  labelNe: 'अनुभव',
  type: 'select',
  required: false,
  options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
  optionsNe: ['१ वर्ष भन्दा कम', '१-३ वर्ष', '३-५ वर्ष', '५-१० वर्ष', '१०+ वर्ष'],
  appliesTo: 'all',
};

export const availabilityField: FormField = {
  name: 'availability',
  label: 'Availability',
  labelNe: 'उपलब्धता',
  type: 'multiselect',
  required: false,
  options: ['Weekdays', 'Weekends', 'Evenings', '24/7', 'On-Call'],
  optionsNe: ['हप्ताको दिन', 'शनिबार/आइतबार', 'साँझ', '२४/७', 'कलमा'],
  appliesTo: 'all',
};

export const serviceLocationField: FormField = {
  name: 'serviceLocation',
  label: 'Service Location',
  labelNe: 'सेवा स्थान',
  type: 'select',
  required: false,
  options: ['At Customer Location', 'At Provider Location', 'Remote/Online'],
  optionsNe: ['ग्राहकको स्थानमा', 'प्रदायकको स्थानमा', 'रिमोट/अनलाइन'],
  appliesTo: 'all',
};

export const languagesField: FormField = {
  name: 'languages',
  label: 'Languages Known',
  labelNe: 'भाषा',
  type: 'multiselect',
  required: false,
  options: ['English', 'Nepali', 'Hindi', 'Newari', 'Other'],
  optionsNe: ['अंग्रेजी', 'नेपाली', 'हिन्दी', 'नेवारी', 'अन्य'],
  appliesTo: 'all',
};

// Job-specific fields
export const experienceRequiredField: FormField = {
  name: 'experienceRequired',
  label: 'Experience Required',
  labelNe: 'आवश्यक अनुभव',
  type: 'select',
  required: false,
  options: ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
  optionsNe: ['फ्रेसर', '०-१ वर्ष', '१-३ वर्ष', '३-५ वर्ष', '५-१० वर्ष', '१०+ वर्ष'],
  appliesTo: 'all',
};

export const salaryRangeField: FormField = {
  name: 'salaryRange',
  label: 'Salary Range',
  labelNe: 'तलब दायरा',
  type: 'select',
  required: false,
  options: ['Below 20,000', '20,000-30,000', '30,000-50,000', '50,000-1,00,000', 'Above 1,00,000', 'Negotiable'],
  optionsNe: ['२०,००० भन्दा कम', '२०,०००-३०,०००', '३०,०००-५०,०००', '५०,०००-१,००,०००', '१,००,००० भन्दा माथि', 'मोलमोलाई योग्य'],
  appliesTo: 'all',
};

export const educationRequiredField: FormField = {
  name: 'educationRequired',
  label: 'Education Required',
  labelNe: 'आवश्यक शिक्षा',
  type: 'select',
  required: false,
  options: ['No Formal Education', 'SLC/SEE', '+2', "Bachelor's", "Master's", 'PhD'],
  optionsNe: ['औपचारिक शिक्षा छैन', 'एसएलसी/एसईई', '+२', 'स्नातक', 'स्नातकोत्तर', 'पीएचडी'],
  appliesTo: 'all',
};

export const companyNameField: FormField = {
  name: 'companyName',
  label: 'Company Name',
  labelNe: 'कम्पनीको नाम',
  type: 'text',
  required: false,
  placeholder: 'Enter company name',
  placeholderNe: 'कम्पनीको नाम लेख्नुहोस्',
  appliesTo: 'all',
};

export const jobTypeField: FormField = {
  name: 'jobType',
  label: 'Job Type',
  labelNe: 'जागिर प्रकार',
  type: 'select',
  required: false,
  options: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance'],
  optionsNe: ['पूर्णकालीन', 'अंशकालीन', 'करार', 'इन्टर्नशिप', 'फ्रिल्यान्स'],
  appliesTo: 'all',
};

// Education/Tuition fields
export const subjectsField: FormField = {
  name: 'subjects',
  label: 'Subject',
  labelNe: 'विषय',
  type: 'multiselect',
  required: true,
  options: ['Math', 'Science', 'English', 'Nepali', 'Social Studies', 'Computer', 'Accounts', 'All Subjects'],
  optionsNe: ['गणित', 'विज्ञान', 'अंग्रेजी', 'नेपाली', 'सामाजिक अध्ययन', 'कम्प्युटर', 'लेखा', 'सबै विषय'],
  appliesTo: 'all',
};

export const gradeLevelField: FormField = {
  name: 'gradeLevel',
  label: 'Grade/Level',
  labelNe: 'कक्षा/तह',
  type: 'multiselect',
  required: true,
  options: ['Primary (1-5)', 'Secondary (6-10)', '+2/Intermediate', 'Bachelor', 'Master'],
  optionsNe: ['प्राथमिक (१-५)', 'माध्यमिक (६-१०)', '+२/मध्यवर्ती', 'स्नातक', 'स्नातकोत्तर'],
  appliesTo: 'all',
};

export const modeOfTeachingField: FormField = {
  name: 'modeOfTeaching',
  label: 'Mode of Teaching',
  labelNe: 'शिक्षण विधि',
  type: 'select',
  required: false,
  options: ['Home Tuition', 'Online', 'At Institute', 'Group Class'],
  optionsNe: ['घर ट्युसन', 'अनलाइन', 'संस्थामा', 'सामूहिक कक्षा'],
  appliesTo: 'all',
};
