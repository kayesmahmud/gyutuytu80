/// Form Template Service
///
/// Provides subcategory-specific form field configurations for the post ad flow.
/// Ported from web: apps/web/src/config/formTemplates/subcategories/

enum FieldType { text, number, select, multiselect, checkbox, date }

class FormFieldModel {
  final String name;
  final String label;
  final String? labelNe;
  final FieldType type;
  final bool required;
  final String? placeholder;
  final String? placeholderNe;
  final List<String>? options;
  final List<String>? optionsNe;
  final double? min;
  final double? max;

  const FormFieldModel({
    required this.name,
    required this.label,
    this.labelNe,
    required this.type,
    this.required = false,
    this.placeholder,
    this.placeholderNe,
    this.options,
    this.optionsNe,
    this.min,
    this.max,
  });
}

class FormTemplateService {
  // ============================================
  // COMMON FIELDS
  // ============================================

  static const _conditionOptions = ['Brand New', 'Used'];
  static const _conditionOptionsNe = ['नयाँ', 'पुरानो'];
  static const _warrantyOptions = [
    'No Warranty',
    'Under Warranty (< 6 months)',
    'Under Warranty (6-12 months)',
    'Under Warranty (1+ years)',
  ];
  static const _warrantyOptionsNe = [
    'वारेन्टी छैन',
    'वारेन्टी अन्तर्गत (< ६ महिना)',
    'वारेन्टी अन्तर्गत (६-१२ महिना)',
    'वारेन्टी अन्तर्गत (१+ वर्ष)',
  ];

  static FormFieldModel _condition([List<String>? opts]) => FormFieldModel(
        name: 'condition', label: 'Condition', labelNe: 'अवस्था', type: FieldType.select,
        required: true, options: opts ?? _conditionOptions, optionsNe: opts != null ? null : _conditionOptionsNe,
      );

  static FormFieldModel _brand(String placeholder, {bool required = false}) =>
      FormFieldModel(
        name: 'brand', label: 'Brand', labelNe: 'ब्रान्ड', type: FieldType.text,
        required: required, placeholder: placeholder, placeholderNe: 'ब्रान्ड लेख्नुहोस्',
      );

  static FormFieldModel _model(String placeholder) => FormFieldModel(
        name: 'model', label: 'Model', labelNe: 'मोडेल', type: FieldType.text,
        placeholder: placeholder, placeholderNe: 'मोडेल लेख्नुहोस्',
      );

  static const _warranty = FormFieldModel(
    name: 'warranty', label: 'Warranty', labelNe: 'वारेन्टी', type: FieldType.select,
    options: _warrantyOptions, optionsNe: _warrantyOptionsNe,
  );

  static FormFieldModel _color([String? label, String? placeholder]) => FormFieldModel(
        name: 'color', label: label ?? 'Color', labelNe: label != null ? null : 'रङ', type: FieldType.text,
        placeholder: placeholder ?? 'e.g., Black, White, Red',
        placeholderNe: 'जस्तै, कालो, सेतो, रातो',
      );

  // ============================================
  // ELECTRONICS FIELDS
  // ============================================

  static const _storage = FormFieldModel(
    name: 'storage', label: 'Storage Capacity', labelNe: 'भण्डारण क्षमता', type: FieldType.select,
    required: true,
    options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
  );

  static const _ram = FormFieldModel(
    name: 'ram', label: 'RAM', labelNe: 'र्‍याम', type: FieldType.select, required: true,
    options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
  );

  static const _batteryHealth = FormFieldModel(
    name: 'batteryHealth', label: 'Battery Health', labelNe: 'ब्याट्री स्वास्थ्य', type: FieldType.select,
    options: ['100%', '95-99%', '90-94%', '85-89%', '80-84%', 'Below 80%'],
    optionsNe: ['१००%', '९५-९९%', '९०-९४%', '८५-८९%', '८०-८४%', '८०% भन्दा कम'],
  );

  static const _processor = FormFieldModel(
    name: 'processor', label: 'Processor', labelNe: 'प्रोसेसर', type: FieldType.text, required: true,
    placeholder: 'e.g., Intel Core i5 12th Gen, AMD Ryzen 7',
    placeholderNe: 'जस्तै, Intel Core i5 12th Gen, AMD Ryzen 7',
  );

  static const _graphics = FormFieldModel(
    name: 'graphics', label: 'Graphics Card', labelNe: 'ग्राफिक्स कार्ड', type: FieldType.text,
    placeholder: 'e.g., NVIDIA RTX 3060, Integrated',
    placeholderNe: 'जस्तै, NVIDIA RTX 3060, Integrated',
  );

  static const _screenResolution = FormFieldModel(
    name: 'screenResolution', label: 'Screen Resolution', labelNe: 'स्क्रिन रिजोलुसन', type: FieldType.select,
    options: ['HD (1366x768)', 'Full HD (1920x1080)', '2K', '4K', 'Retina'],
  );

  static FormFieldModel _screenSize([String? placeholder]) => FormFieldModel(
        name: 'screenSize', label: 'Screen Size', labelNe: 'स्क्रिन साइज', type: FieldType.text,
        required: true, placeholder: placeholder ?? 'e.g., 55 inches',
        placeholderNe: 'जस्तै, ५५ इन्च',
      );

  static const _smartFeatures = FormFieldModel(
    name: 'smartFeatures', label: 'Smart Features', labelNe: 'स्मार्ट सुविधाहरू', type: FieldType.multiselect,
    options: ['Smart TV', '4K', 'HDR', 'Android TV', 'WebOS', 'Voice Control'],
    optionsNe: ['स्मार्ट टिभी', '4K', 'HDR', 'एन्ड्रोइड टिभी', 'WebOS', 'भ्वाइस कन्ट्रोल'],
  );

  static const _megapixels = FormFieldModel(
    name: 'megapixels', label: 'Megapixels', labelNe: 'मेगापिक्सेल', type: FieldType.number,
    placeholder: 'e.g., 24, 48, 108', placeholderNe: 'जस्तै, २४, ४८, १०८',
  );

  // ============================================
  // VEHICLE FIELDS
  // ============================================

  static const _vehicleYear = FormFieldModel(
    name: 'year', label: 'Year of Manufacture', labelNe: 'निर्माण वर्ष', type: FieldType.number,
    required: true, placeholder: 'e.g., 2020', placeholderNe: 'जस्तै, २०२०', min: 1980, max: 2025,
  );

  static const _mileage = FormFieldModel(
    name: 'mileage', label: 'Mileage/Kilometers Driven', labelNe: 'माइलेज/कि.मी.', type: FieldType.number,
    placeholder: 'in km', placeholderNe: 'कि.मी. मा',
  );

  static FormFieldModel _fuelType([List<String>? opts]) => FormFieldModel(
        name: 'fuelType', label: 'Fuel Type', labelNe: 'इन्धन प्रकार', type: FieldType.select,
        required: true, options: opts ?? ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'],
        optionsNe: opts != null ? null : ['पेट्रोल', 'डिजेल', 'इलेक्ट्रिक', 'हाइब्रिड', 'सीएनजी', 'एलपीजी'],
      );

  static const _transmission = FormFieldModel(
    name: 'transmission', label: 'Transmission', labelNe: 'ट्रान्समिसन', type: FieldType.select,
    required: true, options: ['Manual', 'Automatic', 'Semi-Automatic'],
    optionsNe: ['म्यानुअल', 'अटोम्याटिक', 'सेमी-अटोम्याटिक'],
  );

  static FormFieldModel _engineCapacity([String? placeholder]) => FormFieldModel(
        name: 'engineCapacity', label: 'Engine Capacity (cc)', labelNe: 'इन्जिन क्षमता (cc)', type: FieldType.number,
        placeholder: placeholder ?? 'e.g., 1500', placeholderNe: 'जस्तै, १५००',
      );

  static const _owners = FormFieldModel(
    name: 'owners', label: 'Number of Owners', labelNe: 'मालिक संख्या', type: FieldType.select,
    options: ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner or More'],
    optionsNe: ['पहिलो मालिक', 'दोस्रो मालिक', 'तेस्रो मालिक', 'चौथो मालिक वा बढी'],
  );

  static const _registrationYear = FormFieldModel(
    name: 'registrationYear', label: 'Registration Year', labelNe: 'दर्ता वर्ष', type: FieldType.number,
    min: 1980, max: 2025,
  );

  static const _registrationLocation = FormFieldModel(
    name: 'registrationLocation', label: 'Registration Location', labelNe: 'दर्ता स्थान', type: FieldType.text,
    placeholder: 'e.g., Bagmati, Kathmandu', placeholderNe: 'जस्तै, बागमती, काठमाडौं',
  );

  static FormFieldModel _bodyType([List<String>? opts, String? label]) => FormFieldModel(
        name: 'bodyType', label: label ?? 'Body Type', labelNe: label != null ? null : 'बडी प्रकार', type: FieldType.select,
        options: opts ?? ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Pickup', 'Van'],
        optionsNe: opts != null ? null : ['सेडान', 'एसयूभी', 'ह्याचब्याक', 'कूपे', 'कन्भर्टिबल', 'पिकअप', 'भ्यान'],
      );

  static const _seats = FormFieldModel(
    name: 'seats', label: 'Number of Seats', labelNe: 'सिट संख्या', type: FieldType.select,
    options: ['2', '4', '5', '7', '8+'],
  );

  static const _bicycleType = FormFieldModel(
    name: 'bicycleType', label: 'Bicycle Type', labelNe: 'साइकल प्रकार', type: FieldType.select,
    options: ['Mountain Bike', 'Road Bike', 'Hybrid', 'Electric', 'Kids Bike'],
    optionsNe: ['माउन्टेन बाइक', 'रोड बाइक', 'हाइब्रिड', 'इलेक्ट्रिक', 'बच्चाको बाइक'],
  );

  // ============================================
  // PROPERTY FIELDS
  // ============================================

  static const _totalArea = FormFieldModel(
    name: 'totalArea', label: 'Total Area', labelNe: 'कुल क्षेत्रफल', type: FieldType.number,
    required: true, placeholder: 'Enter area', placeholderNe: 'क्षेत्रफल लेख्नुहोस्',
  );

  static const _areaUnit = FormFieldModel(
    name: 'areaUnit', label: 'Area Unit', labelNe: 'क्षेत्रफल एकाइ', type: FieldType.select,
    required: true, options: ['sq ft', 'aana', 'ropani', 'sq meter'],
    optionsNe: ['वर्ग फिट', 'आना', 'रोपनी', 'वर्ग मिटर'],
  );

  static const _bedrooms = FormFieldModel(
    name: 'bedrooms', label: 'Bedrooms', labelNe: 'शयनकोठा', type: FieldType.select,
    required: true, options: ['Studio', '1', '2', '3', '4', '5', '6+'],
    optionsNe: ['स्टुडियो', '१', '२', '३', '४', '५', '६+'],
  );

  static const _bathrooms = FormFieldModel(
    name: 'bathrooms', label: 'Bathrooms', labelNe: 'स्नानकोठा', type: FieldType.select,
    required: true, options: ['1', '2', '3', '4', '5+'],
    optionsNe: ['१', '२', '३', '४', '५+'],
  );

  static const _furnishing = FormFieldModel(
    name: 'furnishing', label: 'Furnishing Status', labelNe: 'फर्निचर अवस्था', type: FieldType.select,
    options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
    optionsNe: ['पूर्ण सुसज्जित', 'आंशिक सुसज्जित', 'सुसज्जित नभएको'],
  );

  static const _parking = FormFieldModel(
    name: 'parking', label: 'Number of Parking Spaces', labelNe: 'पार्किङ स्थान', type: FieldType.select,
    options: ['None', '1', '2', '3', '4+'],
    optionsNe: ['छैन', '१', '२', '३', '४+'],
  );

  static const _floorNumber = FormFieldModel(
    name: 'floorNumber', label: 'Floor Number', labelNe: 'तल्ला नम्बर', type: FieldType.number,
    placeholder: 'e.g., 5', placeholderNe: 'जस्तै, ५',
  );

  static const _totalFloors = FormFieldModel(
    name: 'totalFloors', label: 'Total Floors in Building', labelNe: 'भवनमा कुल तल्ला', type: FieldType.number,
    placeholder: 'e.g., 12', placeholderNe: 'जस्तै, १२',
  );

  static const _facing = FormFieldModel(
    name: 'facing', label: 'Facing Direction', labelNe: 'मुख दिशा', type: FieldType.select,
    options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'],
    optionsNe: ['उत्तर', 'दक्षिण', 'पूर्व', 'पश्चिम', 'उत्तर-पूर्व', 'उत्तर-पश्चिम', 'दक्षिण-पूर्व', 'दक्षिण-पश्चिम'],
  );

  static const _propertyAge = FormFieldModel(
    name: 'propertyAge', label: 'Property Age', labelNe: 'सम्पत्ति उमेर', type: FieldType.select,
    options: ['Under Construction', '0-1 years', '1-5 years', '5-10 years', '10-20 years', '20+ years'],
    optionsNe: ['निर्माणाधीन', '०-१ वर्ष', '१-५ वर्ष', '५-१० वर्ष', '१०-२० वर्ष', '२०+ वर्ष'],
  );

  static FormFieldModel _amenities([List<String>? opts]) => FormFieldModel(
        name: 'amenities', label: 'Amenities', labelNe: 'सुविधाहरू', type: FieldType.multiselect,
        options: opts ?? ['Lift/Elevator', 'Power Backup', 'Water Supply', 'Security/Gated', 'Gym', 'Swimming Pool', 'Garden', 'Playground', 'Club House', 'Visitor Parking'],
        optionsNe: opts != null ? null : ['लिफ्ट/एलिभेटर', 'पावर ब्याकअप', 'पानी आपूर्ति', 'सुरक्षा/गेटेड', 'जिम', 'स्विमिङ पुल', 'बगैंचा', 'खेल मैदान', 'क्लब हाउस', 'आगन्तुक पार्किङ'],
      );

  static FormFieldModel _landType([String? label, List<String>? opts]) => FormFieldModel(
        name: 'landType', label: label ?? 'Land Type', labelNe: label != null ? null : 'जमिन प्रकार', type: FieldType.select,
        options: opts ?? ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use'],
        optionsNe: opts != null ? null : ['आवासीय', 'व्यापारिक', 'कृषि', 'औद्योगिक', 'मिश्रित प्रयोग'],
      );

  static const _roadAccess = FormFieldModel(
    name: 'roadAccess', label: 'Road Access', labelNe: 'सडक पहुँच', type: FieldType.select,
    options: ['Paved Road', 'Graveled Road', 'Dirt Road', 'No Direct Access'],
    optionsNe: ['पक्की सडक', 'ग्राभेल सडक', 'कच्ची सडक', 'प्रत्यक्ष पहुँच छैन'],
  );

  static const _roadWidth = FormFieldModel(
    name: 'roadWidth', label: 'Road Width', labelNe: 'सडक चौडाइ', type: FieldType.number,
    placeholder: 'in feet', placeholderNe: 'फिटमा',
  );

  static const _monthlyRent = FormFieldModel(
    name: 'monthlyRent', label: 'Monthly Rent', labelNe: 'मासिक भाडा', type: FieldType.number,
    required: true, placeholder: 'in NPR', placeholderNe: 'रुपैयाँमा',
  );

  static const _securityDeposit = FormFieldModel(
    name: 'securityDeposit', label: 'Security Deposit', labelNe: 'धरौटी', type: FieldType.number,
    placeholder: 'in NPR', placeholderNe: 'रुपैयाँमा',
  );

  static const _availableFrom = FormFieldModel(
    name: 'availableFrom', label: 'Available From', labelNe: 'उपलब्ध मिति', type: FieldType.select,
    options: ['Immediately', '15 days', '1 month', '2 months', '3 months'],
    optionsNe: ['तुरुन्तै', '१५ दिन', '१ महिना', '२ महिना', '३ महिना'],
  );

  // ============================================
  // FASHION FIELDS
  // ============================================

  static FormFieldModel _clothingType([List<String>? opts]) => FormFieldModel(
        name: 'clothingType', label: 'Clothing Type', labelNe: 'लुगा प्रकार', type: FieldType.select,
        required: true,
        options: opts ?? ['Shirt', 'T-Shirt', 'Pants', 'Jeans', 'Dress', 'Saree', 'Kurta', 'Jacket', 'Coat', 'Sweater', 'Skirt', 'Shorts'],
        optionsNe: opts != null ? null : ['सर्ट', 'टी-सर्ट', 'प्यान्ट', 'जिन्स', 'ड्रेस', 'साडी', 'कुर्ता', 'ज्याकेट', 'कोट', 'स्वेटर', 'स्कर्ट', 'शर्ट्स'],
      );

  static const _size = FormFieldModel(
    name: 'size', label: 'Size', labelNe: 'साइज', type: FieldType.select, required: true,
    options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'],
    optionsNe: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'फ्री साइज'],
  );

  static const _fitType = FormFieldModel(
    name: 'fitType', label: 'Fit Type', labelNe: 'फिट प्रकार', type: FieldType.select,
    options: ['Regular Fit', 'Slim Fit', 'Loose Fit', 'Skinny Fit'],
    optionsNe: ['रेगुलर फिट', 'स्लिम फिट', 'लुज फिट', 'स्किनी फिट'],
  );

  static const _sleeveType = FormFieldModel(
    name: 'sleeveType', label: 'Sleeve Type', labelNe: 'बाहुला प्रकार', type: FieldType.select,
    options: ['Full Sleeve', 'Half Sleeve', 'Sleeveless', '3/4 Sleeve'],
    optionsNe: ['पूरा बाहुला', 'आधा बाहुला', 'बाहुला नभएको', '३/४ बाहुला'],
  );

  static FormFieldModel _footwearType([List<String>? opts]) => FormFieldModel(
        name: 'footwearType', label: 'Footwear Type', labelNe: 'जुत्ता प्रकार', type: FieldType.select,
        required: true,
        options: opts ?? ['Sneakers', 'Formal Shoes', 'Sandals', 'Slippers', 'Boots', 'Heels', 'Flats', 'Sports Shoes'],
        optionsNe: opts != null ? null : ['स्निकर्स', 'फर्मल जुत्ता', 'स्यान्डल', 'चप्पल', 'बुट', 'हिल्स', 'फ्ल्याट्स', 'खेलकुद जुत्ता'],
      );

  static const _shoeSize = FormFieldModel(
    name: 'shoeSize', label: 'Shoe Size', labelNe: 'जुत्ता साइज', type: FieldType.number,
    required: true, placeholder: 'e.g., 38, 40, 42', placeholderNe: 'जस्तै, ३८, ४०, ४२', min: 32, max: 50,
  );

  static const _watchType = FormFieldModel(
    name: 'watchType', label: 'Watch Type', labelNe: 'घडी प्रकार', type: FieldType.select,
    options: ['Analog', 'Digital', 'Smart Watch', 'Chronograph'],
    optionsNe: ['एनालग', 'डिजिटल', 'स्मार्ट वाच', 'क्रोनोग्राफ'],
  );

  static const _strapMaterial = FormFieldModel(
    name: 'strapMaterial', label: 'Strap Material', labelNe: 'स्ट्र्याप सामग्री', type: FieldType.select,
    options: ['Leather', 'Metal', 'Rubber', 'Fabric'],
    optionsNe: ['छाला', 'धातु', 'रबर', 'कपडा'],
  );

  // ============================================
  // PETS FIELDS
  // ============================================

  static FormFieldModel _animalType([List<String>? opts]) => FormFieldModel(
        name: 'animalType', label: 'Animal Type', labelNe: 'जनावर प्रकार', type: FieldType.select,
        required: true,
        options: opts ?? ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Cow', 'Buffalo', 'Goat', 'Chicken', 'Duck', 'Other'],
        optionsNe: opts != null ? null : ['कुकुर', 'बिरालो', 'चरा', 'माछा', 'खरायो', 'ह्याम्स्टर', 'गिनी पिग', 'गाई', 'भैंसी', 'बाख्रा', 'कुखुरा', 'हाँस', 'अन्य'],
      );

  static FormFieldModel _breed([String? label, String? placeholder]) => FormFieldModel(
        name: 'breed', label: label ?? 'Breed', labelNe: 'जात', type: FieldType.text,
        placeholder: placeholder ?? 'e.g., Golden Retriever, Persian Cat',
        placeholderNe: 'जस्तै, गोल्डेन रिट्रिभर, पर्सियन बिरालो',
      );

  static FormFieldModel _petAge([String? label]) => FormFieldModel(
        name: 'age', label: label ?? 'Age', labelNe: 'उमेर', type: FieldType.select, required: true,
        options: ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'],
        optionsNe: ['०-३ महिना', '३-६ महिना', '६-१२ महिना', '१-२ वर्ष', '२-५ वर्ष', '५+ वर्ष'],
      );

  static FormFieldModel _petGender([String? label]) => FormFieldModel(
        name: 'gender', label: label ?? 'Gender', labelNe: 'लिङ्ग', type: FieldType.select,
        options: ['Male', 'Female', 'Unknown'],
        optionsNe: ['भाले', 'पोथी', 'थाहा छैन'],
      );

  static const _vaccination = FormFieldModel(
    name: 'vaccination', label: 'Vaccination Status', labelNe: 'खोप अवस्था', type: FieldType.select,
    required: true,
    options: ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
    optionsNe: ['पूर्ण खोप लगाइएको', 'आंशिक खोप लगाइएको', 'खोप नलगाइएको'],
  );

  static const _petPapers = FormFieldModel(
    name: 'papers', label: 'Pet Papers/Documents', labelNe: 'कागजात', type: FieldType.select,
    options: ['Yes - All Papers', 'Some Papers', 'No Papers'],
    optionsNe: ['छ - सबै कागजात', 'केही कागजात', 'कागजात छैन'],
  );

  static const _petColor = FormFieldModel(
    name: 'color', label: 'Color/Coat Color', labelNe: 'रङ/छाला रङ', type: FieldType.text,
    placeholder: 'e.g., Brown, Black, White',
    placeholderNe: 'जस्तै, खैरो, कालो, सेतो',
  );

  static FormFieldModel _petWeight([String? label]) => FormFieldModel(
        name: 'weight', label: label ?? 'Weight', labelNe: 'तौल', type: FieldType.number,
        placeholder: 'in kg', placeholderNe: 'के.जी. मा',
      );

  static FormFieldModel _trained([List<String>? opts]) => FormFieldModel(
        name: 'trained', label: 'Trained', labelNe: 'प्रशिक्षित', type: FieldType.select,
        options: opts ?? ['Fully Trained', 'Partially Trained', 'Not Trained'],
        optionsNe: opts != null ? null : ['पूर्ण प्रशिक्षित', 'आंशिक प्रशिक्षित', 'प्रशिक्षित नभएको'],
      );

  static const _friendlyWith = FormFieldModel(
    name: 'friendlyWith', label: 'Friendly With', labelNe: 'मैत्रीपूर्ण', type: FieldType.multiselect,
    options: ['Children', 'Other Dogs', 'Cats', 'Strangers'],
    optionsNe: ['बच्चाहरू', 'अन्य कुकुर', 'बिरालो', 'अपरिचित'],
  );

  static FormFieldModel _petProductType([List<String>? opts]) => FormFieldModel(
        name: 'productType', label: 'Product Type', labelNe: 'उत्पादन प्रकार', type: FieldType.select,
        required: true,
        options: opts ?? ['Food', 'Toy', 'Cage', 'Leash', 'Collar', 'Grooming', 'Medicine', 'Bedding'],
        optionsNe: opts != null ? null : ['खाना', 'खेलौना', 'पिंजरा', 'डोरी', 'कलर', 'सफाइ', 'औषधि', 'ओछ्यान'],
      );

  static const _suitableFor = FormFieldModel(
    name: 'suitableFor', label: 'Suitable For', labelNe: 'उपयुक्त', type: FieldType.select,
    options: ['Dogs', 'Cats', 'Birds', 'Fish', 'All Pets'],
    optionsNe: ['कुकुर', 'बिरालो', 'चरा', 'माछा', 'सबै पाल्तु जनावर'],
  );

  // ============================================
  // SERVICES FIELDS
  // ============================================

  static const _experience = FormFieldModel(
    name: 'experience', label: 'Experience', labelNe: 'अनुभव', type: FieldType.select,
    options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
    optionsNe: ['१ वर्ष भन्दा कम', '१-३ वर्ष', '३-५ वर्ष', '५-१० वर्ष', '१०+ वर्ष'],
  );

  static FormFieldModel _availability([List<String>? opts]) => FormFieldModel(
        name: 'availability', label: 'Availability', labelNe: 'उपलब्धता', type: FieldType.multiselect,
        options: opts ?? ['Weekdays', 'Weekends', 'Evenings', '24/7', 'On-Call'],
        optionsNe: opts != null ? null : ['हप्ताका दिन', 'शनिबार/आइतबार', 'साँझ', '२४/७', 'अन-कल'],
      );

  static FormFieldModel _serviceLocation([String? label, List<String>? opts, bool required = false]) => FormFieldModel(
        name: 'serviceLocation', label: label ?? 'Service Location', labelNe: label != null ? null : 'सेवा स्थान', type: FieldType.select,
        required: required,
        options: opts ?? ['At Customer Location', 'At Provider Location', 'Remote/Online'],
        optionsNe: opts != null ? null : ['ग्राहकको स्थानमा', 'सेवा प्रदायकको स्थानमा', 'रिमोट/अनलाइन'],
      );

  static FormFieldModel _languages([List<String>? opts]) => FormFieldModel(
        name: 'languages', label: 'Languages Known', labelNe: 'भाषा ज्ञान', type: FieldType.multiselect,
        options: opts ?? ['English', 'Nepali', 'Hindi', 'Newari', 'Other'],
        optionsNe: opts != null ? null : ['अंग्रेजी', 'नेपाली', 'हिन्दी', 'नेवारी', 'अन्य'],
      );

  static const _subjects = FormFieldModel(
    name: 'subjects', label: 'Subject', labelNe: 'विषय', type: FieldType.multiselect, required: true,
    options: ['Math', 'Science', 'English', 'Nepali', 'Social Studies', 'Computer', 'Accounts', 'All Subjects'],
    optionsNe: ['गणित', 'विज्ञान', 'अंग्रेजी', 'नेपाली', 'सामाजिक अध्ययन', 'कम्प्युटर', 'लेखा', 'सबै विषय'],
  );

  static const _gradeLevel = FormFieldModel(
    name: 'gradeLevel', label: 'Grade/Level', labelNe: 'कक्षा/तह', type: FieldType.multiselect, required: true,
    options: ['Primary (1-5)', 'Secondary (6-10)', '+2/Intermediate', 'Bachelor', 'Master'],
    optionsNe: ['प्राथमिक (१-५)', 'माध्यमिक (६-१०)', '+२/उच्च माध्यमिक', 'स्नातक', 'स्नातकोत्तर'],
  );

  static const _modeOfTeaching = FormFieldModel(
    name: 'modeOfTeaching', label: 'Mode of Teaching', labelNe: 'पढाउने तरिका', type: FieldType.select,
    options: ['Home Tuition', 'Online', 'At Institute', 'Group Class'],
    optionsNe: ['घरमा ट्युसन', 'अनलाइन', 'संस्थामा', 'समूह कक्षा'],
  );

  static const _companyName = FormFieldModel(
    name: 'companyName', label: 'Company Name', labelNe: 'कम्पनीको नाम', type: FieldType.text,
    placeholder: 'Enter company name', placeholderNe: 'कम्पनीको नाम लेख्नुहोस्',
  );

  static FormFieldModel _jobType([List<String>? opts]) => FormFieldModel(
        name: 'jobType', label: 'Job Type', labelNe: 'जागिर प्रकार', type: FieldType.select,
        options: opts ?? ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance'],
        optionsNe: opts != null ? null : ['पूर्णकालीन', 'अंशकालीन', 'करार', 'इन्टर्नशिप', 'फ्रिल्यान्स'],
      );

  static const _experienceRequired = FormFieldModel(
    name: 'experienceRequired', label: 'Experience Required', labelNe: 'आवश्यक अनुभव', type: FieldType.select,
    options: ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
    optionsNe: ['फ्रेशर', '०-१ वर्ष', '१-३ वर्ष', '३-५ वर्ष', '५-१० वर्ष', '१०+ वर्ष'],
  );

  static const _educationRequired = FormFieldModel(
    name: 'educationRequired', label: 'Education Required', labelNe: 'आवश्यक शिक्षा', type: FieldType.select,
    options: ['No Formal Education', 'SLC/SEE', '+2', "Bachelor's", "Master's", 'PhD'],
    optionsNe: ['औपचारिक शिक्षा नभएको', 'एसएलसी/एसईई', '+२', 'स्नातक', 'स्नातकोत्तर', 'पीएचडी'],
  );

  static FormFieldModel _salaryRange([String? label, List<String>? opts]) => FormFieldModel(
        name: 'salaryRange', label: label ?? 'Salary Range', labelNe: label != null ? null : 'तलब दायरा', type: FieldType.select,
        options: opts ?? ['Below 20,000', '20,000-30,000', '30,000-50,000', '50,000-1,00,000', 'Above 1,00,000', 'Negotiable'],
        optionsNe: opts != null ? null : ['२०,००० भन्दा कम', '२०,०००-३०,०००', '३०,०००-५०,०००', '५०,०००-१,००,०००', '१,००,००० भन्दा माथि', 'मिलाउन सकिने'],
      );

  // ============================================
  // GENERAL FIELDS
  // ============================================

  static FormFieldModel _furnitureType([List<String>? opts]) => FormFieldModel(
        name: 'furnitureType', label: 'Furniture Type', labelNe: 'फर्निचर प्रकार', type: FieldType.select,
        required: true,
        options: opts ?? ['Bed', 'Sofa', 'Table', 'Chair', 'Wardrobe', 'Shelf', 'Desk', 'Cabinet', 'Dining Set', 'Other'],
        optionsNe: opts != null ? null : ['पलंग', 'सोफा', 'टेबल', 'कुर्सी', 'अलमारी', 'शेल्फ', 'डेस्क', 'क्याबिनेट', 'खाना खाने सेट', 'अन्य'],
      );

  static const _material = FormFieldModel(
    name: 'material', label: 'Material', labelNe: 'सामग्री', type: FieldType.select,
    options: ['Wood', 'Metal', 'Plastic', 'Glass', 'Leather', 'Fabric', 'Mixed Materials'],
    optionsNe: ['काठ', 'धातु', 'प्लास्टिक', 'गिलास', 'छाला', 'कपडा', 'मिश्रित सामग्री'],
  );

  static const _dimensions = FormFieldModel(
    name: 'dimensions', label: 'Dimensions (L × W × H)', labelNe: 'आयाम (ल × चौ × उ)', type: FieldType.text,
    placeholder: 'e.g., 200cm × 100cm × 80cm', placeholderNe: 'जस्तै, २०० से.मी. × १०० से.मी. × ८० से.मी.',
  );

  static const _assemblyRequired = FormFieldModel(
    name: 'assemblyRequired', label: 'Assembly Required', labelNe: 'जडान आवश्यक', type: FieldType.select,
    options: ['Yes - Assembly Required', 'No - Ready to Use', 'Partial Assembly'],
    optionsNe: ['छ - जडान आवश्यक', 'छैन - प्रयोगको लागि तयार', 'आंशिक जडान'],
  );

  static const _seatingCapacity = FormFieldModel(
    name: 'seatingCapacity', label: 'Seating Capacity', labelNe: 'बस्ने क्षमता', type: FieldType.select,
    options: ['1 Person', '2-3 People', '4-6 People', '6-8 People', '8+ People'],
    optionsNe: ['१ जना', '२-३ जना', '४-६ जना', '६-८ जना', '८+ जना'],
  );

  static const _storageAvailable = FormFieldModel(
    name: 'storageAvailable', label: 'Storage Available', labelNe: 'भण्डारण उपलब्ध', type: FieldType.select,
    options: ['Yes', 'No'],
    optionsNe: ['छ', 'छैन'],
  );

  static const _style = FormFieldModel(
    name: 'style', label: 'Style', labelNe: 'शैली', type: FieldType.select,
    options: ['Modern', 'Traditional', 'Vintage', 'Minimalist', 'Contemporary', 'Rustic', 'Industrial'],
    optionsNe: ['आधुनिक', 'परम्परागत', 'पुरानो शैली', 'न्यूनतम', 'समकालीन', 'ग्रामीण', 'औद्योगिक'],
  );

  static const _sportType = FormFieldModel(
    name: 'sportType', label: 'Sport Type', labelNe: 'खेलकुद प्रकार', type: FieldType.text,
    placeholder: 'e.g., Cricket, Football, Basketball',
    placeholderNe: 'जस्तै, क्रिकेट, फुटबल, बास्केटबल',
  );

  static const _instrumentType = FormFieldModel(
    name: 'instrumentType', label: 'Instrument Type', labelNe: 'बाजा प्रकार', type: FieldType.text,
    placeholder: 'e.g., Guitar, Piano, Drums',
    placeholderNe: 'जस्तै, गिटार, पियानो, ड्रम्स',
  );

  static FormFieldModel _machineryType([List<String>? opts]) => FormFieldModel(
        name: 'machineryType', label: 'Machinery Type', labelNe: 'मेसिनरी प्रकार', type: FieldType.select,
        required: true,
        options: opts ?? ['Construction', 'Manufacturing', 'Agricultural', 'Office Equipment', 'Medical Equipment'],
        optionsNe: opts != null ? null : ['निर्माण', 'उत्पादन', 'कृषि', 'कार्यालय उपकरण', 'चिकित्सा उपकरण'],
      );

  static const _powerSource = FormFieldModel(
    name: 'powerSource', label: 'Power Source', labelNe: 'शक्ति स्रोत', type: FieldType.select,
    options: ['Electric', 'Manual', 'Diesel', 'Petrol', 'Battery'],
    optionsNe: ['बिजुली', 'म्यानुअल', 'डिजेल', 'पेट्रोल', 'ब्याट्री'],
  );

  static FormFieldModel _productType([List<String>? opts]) => FormFieldModel(
        name: 'productType', label: 'Product Type', labelNe: 'उत्पादन प्रकार', type: FieldType.select,
        required: true,
        options: opts ?? ['Food Item', 'Household Item', 'Baby Product', 'Healthcare'],
        optionsNe: opts != null ? null : ['खाद्य वस्तु', 'घरेलु वस्तु', 'बच्चाको उत्पादन', 'स्वास्थ्य सेवा'],
      );

  static const _quantity = FormFieldModel(
    name: 'quantity', label: 'Quantity Available', labelNe: 'उपलब्ध मात्रा', type: FieldType.number,
    placeholder: 'Enter quantity', placeholderNe: 'मात्रा लेख्नुहोस्',
  );

  static const _expiryDate = FormFieldModel(
    name: 'expiryDate', label: 'Expiry Date', labelNe: 'म्याद सकिने मिति', type: FieldType.date,
  );

  static const _cropType = FormFieldModel(
    name: 'cropType', label: 'Crop/Plant Type', labelNe: 'बाली/बिरुवा प्रकार', type: FieldType.text,
    required: true, placeholder: 'e.g., Rice, Wheat, Tomato',
    placeholderNe: 'जस्तै, धान, गहुँ, गोलभेडा',
  );

  static const _farmingToolType = FormFieldModel(
    name: 'farmingToolType', label: 'Farming Tool Type', labelNe: 'कृषि औजार प्रकार', type: FieldType.select,
    options: ['Tractor', 'Plough', 'Harvester', 'Sprayer', 'Hand Tool'],
    optionsNe: ['ट्र्याक्टर', 'हलो', 'हार्भेस्टर', 'स्प्रेयर', 'हात औजार'],
  );

  // ============================================
  // SUBCATEGORY CONFIGS — keyed by EXACT database subcategory name
  // ============================================

  static final Map<String, List<FormFieldModel>> _subcategoryConfigs = {
    // ── MOBILES (parent: Mobiles) ────────────
    'Mobile Phones': [
      _condition(), _brand('e.g., Apple, Samsung, OnePlus, Xiaomi'), _model('e.g., iPhone 15 Pro, Galaxy S24'),
      _warranty, _storage, _ram, _batteryHealth,
    ],
    'Mobile Phone Accessories': [
      _condition(), _brand('e.g., Spigen, Anker, Samsung, Apple'), _warranty,
    ],
    'Wearables': [
      _condition(), _brand('e.g., Apple, Samsung, Fitbit, Garmin, Boat'),
      _model('e.g., Apple Watch Series 9, Galaxy Watch 6'), _warranty,
    ],

    // ── ELECTRONICS (parent: Electronics) ────
    'Tablets & Accessories': [
      _condition(), _brand('e.g., Apple, Samsung, Huawei'), _model('e.g., iPad Pro, Galaxy Tab'),
      _warranty, _storage, _ram, _batteryHealth,
    ],
    'Laptops': [
      _condition(), _brand('e.g., Dell, HP, Lenovo, Apple'), _model('e.g., MacBook Pro, ThinkPad X1'),
      _warranty, _processor, _ram,
      const FormFieldModel(
        name: 'storage', label: 'Storage Capacity', labelNe: 'भण्डारण क्षमता', type: FieldType.select, required: true,
        options: ['128GB SSD', '256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD', '2TB HDD'],
      ),
      _graphics, _screenResolution, _batteryHealth,
    ],
    'Desktop Computers': [
      _condition(), _brand('e.g., Dell, HP, Custom Build'), _model('Enter model name'),
      _warranty, _processor, _ram,
      const FormFieldModel(
        name: 'storage', label: 'Storage Capacity', labelNe: 'भण्डारण क्षमता', type: FieldType.select, required: true,
        options: ['256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD', '2TB HDD', '4TB HDD'],
      ),
      _graphics, _screenResolution,
    ],
    'TVs': [
      _condition(), _brand('e.g., Samsung, LG, Sony, TCL'), _model('Enter model name'),
      _warranty, _screenSize('e.g., 32 inches, 55 inches, 65 inches'), _screenResolution, _smartFeatures,
    ],
    'TV & Video Accessories': [
      _condition(), _brand('e.g., Samsung, LG, Sony, TCL, Hisense'), _model('Enter model name'), _warranty,
    ],
    'Cameras, Camcorders & Accessories': [
      _condition(), _brand('e.g., Canon, Nikon, Sony, GoPro'), _model('e.g., EOS R5, A7 IV'),
      _warranty,
      const FormFieldModel(name: 'screenSize', label: 'Sensor Size', labelNe: 'सेन्सर साइज', type: FieldType.text, required: true, placeholder: 'e.g., Full Frame, APS-C, 1 inch', placeholderNe: 'जस्तै, Full Frame, APS-C, 1 inch'),
      _megapixels,
    ],
    'Laptop & Computer Accessories': [
      _condition(), _brand('e.g., Logitech, Razer, Corsair'), _warranty,
    ],
    'Audio & Sound Systems': [
      _condition(), _brand('e.g., Sony, Bose, JBL, Sennheiser'), _model('Enter model name'), _warranty,
    ],
    'Video Game Consoles & Accessories': [
      _condition(), _brand('e.g., Sony, Microsoft, Nintendo'), _model('e.g., PS5, Xbox Series X, Switch'),
      _storage, _warranty,
    ],
    'ACs & Home Electronics': [
      _condition(), _brand('e.g., Voltas, LG, Samsung, Daikin, Panasonic'), _model('Enter model name'), _warranty,
    ],
    'Photocopiers': [
      _condition(), _brand('e.g., Canon, Xerox, HP, Ricoh'), _model('Enter model name'), _warranty,
    ],
    'Home Appliances': [
      _condition(), _brand('e.g., LG, Samsung, Whirlpool'),
    ],
    'Other Electronics': [
      _condition(), _brand('Enter brand name'), _model('Enter model name'), _warranty,
    ],

    // ── VEHICLES (parent: Vehicles) ──────────
    'Cars': [
      _condition(), _brand('e.g., Toyota, Honda, Hyundai, Suzuki'), _model('e.g., Corolla, Civic, i20, Swift'),
      _vehicleYear, _mileage, _fuelType(), _transmission,
      _engineCapacity(), _color(), _owners, _registrationYear, _registrationLocation,
      _bodyType(), _seats,
    ],
    'Motorbikes': [
      _condition(), _brand('e.g., Honda, Yamaha, Bajaj, TVS'), _model('e.g., CBR, FZ, Pulsar'),
      _vehicleYear, _mileage, _fuelType(['Petrol']),
      _engineCapacity('e.g., 150cc, 250cc, 400cc'), _color(), _owners, _registrationYear,
    ],
    'Bicycles': [
      _condition(), _brand('e.g., Trek, Giant, Hero, Firefox'),
      _bicycleType, _color(),
    ],
    'Three Wheelers': [
      _condition(), _brand('e.g., Bajaj, Piaggio, Ape'), _model('Enter model name'),
      _vehicleYear, _mileage, _fuelType(['Petrol', 'Diesel', 'CNG', 'Electric']),
      _engineCapacity('e.g., 200cc, 400cc'), _color(), _owners, _registrationYear,
    ],
    'Heavy Duty': [
      _condition(), _brand('e.g., Tata, Ashok Leyland, Mahindra'), _model('Enter model name'),
      _vehicleYear,
      _bodyType(['Truck', 'Bus', 'Tipper', 'Tanker', 'Trailer'], 'Vehicle Type'),
      _mileage, _fuelType(), _owners, _registrationYear,
    ],
    'Trucks': [
      _condition(), _brand('e.g., Tata, Ashok Leyland, BharatBenz'), _model('Enter model name'),
      _vehicleYear, _mileage, _fuelType(['Diesel']),
      _owners, _registrationYear,
    ],
    'Buses': [
      _condition(), _brand('e.g., Tata, Ashok Leyland, BharatBenz'), _model('Enter model name'),
      _vehicleYear, _mileage, _fuelType(['Diesel']),
      _seats, _owners, _registrationYear,
    ],
    'Vans': [
      _condition(), _brand('e.g., Maruti, Tata, Mahindra'), _model('Enter model name'),
      _vehicleYear, _mileage, _fuelType(), _transmission,
      _color(), _owners, _registrationYear,
    ],
    'Auto Parts & Accessories': [
      _condition(), _brand('e.g., Bosch, Denso, 3M'),
    ],
    'Rentals': [
      _bodyType(['Car', 'Motorcycle', 'Scooter', 'Van', 'Bus'], 'Vehicle Type'),
      _brand('Enter brand name'), _model('Enter model name'),
      _fuelType(), _transmission,
    ],
    'Water Transport': [
      _condition(), _brand('Enter brand name'), _model('Enter model name'),
      _vehicleYear, _color(),
    ],
    'Auto Services': [
      _brand('e.g., Toyota, Honda, Yamaha'), _model('e.g., Corolla, City, FZ'),
      _vehicleYear, _color(),
    ],
    'Maintenance and Repair': [],

    // ── PROPERTY (parent: Property) ──────────
    'Apartments For Sale': [
      _landType('Property Type', ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Duplex']),
      _bedrooms, _bathrooms, _totalArea, _areaUnit, _furnishing, _parking,
      _floorNumber, _facing, _amenities(), _propertyAge,
    ],
    'Apartment Rentals': [
      _landType('Property Type', ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Duplex']),
      _bedrooms, _bathrooms, _totalArea, _areaUnit, _furnishing, _parking,
      _floorNumber, _facing, _amenities(), _monthlyRent, _securityDeposit, _availableFrom,
    ],
    'Houses For Sale': [
      _landType('Property Type', ['Single Family', 'Bungalow', 'Villa', 'Townhouse', 'Duplex House']),
      _bedrooms, _bathrooms, _totalArea, _areaUnit, _furnishing, _parking,
      _totalFloors, _facing, _amenities(), _roadAccess, _propertyAge,
    ],
    'House Rentals': [
      _landType('Property Type', ['Single Family', 'Bungalow', 'Villa', 'Townhouse', 'Duplex House']),
      _bedrooms, _bathrooms, _totalArea, _areaUnit, _furnishing, _parking,
      _totalFloors, _facing, _amenities(), _monthlyRent, _securityDeposit, _availableFrom,
    ],
    'Land For Sale': [
      const FormFieldModel(name: 'totalArea', label: 'Land Area', labelNe: 'जमिन क्षेत्रफल', type: FieldType.number, required: true, placeholder: 'Enter area', placeholderNe: 'क्षेत्रफल लेख्नुहोस्'),
      _areaUnit, _landType('Zoning'), _roadAccess, _roadWidth, _facing,
    ],
    'Land Rentals': [
      const FormFieldModel(name: 'totalArea', label: 'Land Area', labelNe: 'जमिन क्षेत्रफल', type: FieldType.number, required: true, placeholder: 'Enter area', placeholderNe: 'क्षेत्रफल लेख्नुहोस्'),
      _areaUnit, _landType('Zoning'), _roadAccess, _roadWidth, _facing,
      _monthlyRent, _availableFrom,
    ],
    'Commercial Properties For Sale': [
      _landType('Property Type', ['Office Space', 'Shop', 'Showroom', 'Warehouse', 'Factory', 'Restaurant Space']),
      _totalArea, _areaUnit, _furnishing, _parking, _floorNumber,
      _amenities(), _roadAccess, _propertyAge,
    ],
    'Commercial Property Rentals': [
      _landType('Property Type', ['Office Space', 'Shop', 'Showroom', 'Warehouse', 'Factory', 'Restaurant Space']),
      _totalArea, _areaUnit, _furnishing, _parking, _floorNumber,
      _amenities(), _monthlyRent, _securityDeposit, _availableFrom,
    ],
    'Room Rentals': [
      _landType('Room Type', ['Single Room', 'Shared Room', 'Master Bedroom', 'Hostel Bed']),
      _furnishing,
      _amenities(['WiFi', 'Kitchen', 'Laundry', 'Parking', 'Attached Bathroom', 'Hot Water']),
      _monthlyRent, _securityDeposit, _availableFrom,
    ],
    'New projects on PropertyGuide': [],

    // ── FASHION (Men's Fashion & Grooming) ───
    'Shirts & T-Shirts': [
      _condition(), _brand('e.g., Nike, Adidas, Zara, H&M'),
      _clothingType(['Shirt', 'T-Shirt', 'Polo', 'Tank Top']), _size, _fitType, _sleeveType, _color(),
    ],
    'Pants': [
      _condition(), _brand('e.g., Levi\'s, Zara, H&M'),
      _clothingType(['Jeans', 'Chinos', 'Formal Pants', 'Track Pants', 'Shorts']),
      _size, _fitType, _color(),
    ],
    'Jacket & Coat': [
      _condition(), _brand('e.g., Nike, Zara, North Face'),
      _clothingType(['Jacket', 'Coat', 'Blazer', 'Hoodie', 'Windbreaker']),
      _size, _fitType, _color(),
    ],
    'Traditional Clothing': [
      _condition(), _brand('Enter brand name'),
      _clothingType(['Daura Suruwal', 'Topi', 'Dhoti', 'Kurta', 'Sherwani', 'Other']),
      _size, _color(),
    ],
    'Grooming & Bodycare': [
      _brand('e.g., Nivea, Gillette, Park Avenue'),
    ],
    // Shared between Men's and Women's:
    'Footwear': [
      _condition(), _brand('e.g., Nike, Adidas, Puma, Bata'),
      _footwearType(), _shoeSize, _color(),
    ],
    'Watches': [
      _condition(), _brand('e.g., Casio, Fossil, Titan, Apple'),
      _watchType, _strapMaterial, _color(),
    ],
    'Bags & Accessories': [
      _condition(), _brand('e.g., Ray-Ban, Tommy Hilfiger, Michael Kors'), _color(),
    ],
    'Optical & Sunglasses': [
      _condition(), _brand('e.g., Ray-Ban, Oakley, Titan'), _color(),
    ],

    // ── FASHION (Women's Fashion & Beauty) ───
    'Western Wear': [
      _condition(), _brand('e.g., Zara, H&M, Forever 21, Max'),
      _clothingType(['Dress', 'Top', 'Jeans', 'Skirt', 'Leggings', 'Jacket', 'Coat']),
      _size, _fitType, _color(),
    ],
    'Traditional Wear': [
      _condition(), _brand('Enter brand name'),
      _clothingType(['Saree', 'Kurta', 'Lehenga', 'Sherwani', 'Dhoti', 'Topi', 'Daura Suruwal', 'Other']),
      _size, _color(),
    ],
    'Jewellery & Watches': [
      _condition(), _brand('e.g., Tanishq, Swarovski, Fossil'),
      _watchType, _strapMaterial,
      _color('Metal/Color', 'e.g., Gold, Silver, Rose Gold'),
    ],
    'Beauty & Personal Care': [],
    'Lingerie & Sleepwear': [_color()],
    'Winter Wear': [
      _condition(), _brand('e.g., North Face, Columbia, Zara'), _size, _color(),
    ],

    // ── FASHION (shared) ─────────────────────
    "Baby Boy's Fashion": [
      _brand("e.g., Carter's, Mothercare, Next"), _color(),
    ],
    "Baby Girl's Fashion": [
      _brand("e.g., Carter's, Mothercare, Next"), _color(),
    ],
    'Wholesale - Bulk': [_brand('Enter brand name')],

    // ── PETS & ANIMALS ───────────────────────
    'Pets': [
      _animalType(['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Other']),
      _breed(null, 'e.g., Golden Retriever, Persian Cat, Parrot'),
      _petAge(), _petGender(), _vaccination, _petPapers, _petColor, _petWeight(), _trained(), _friendlyWith,
    ],
    'Farm Animals': [
      _animalType(['Cow', 'Buffalo', 'Goat', 'Sheep', 'Pig', 'Horse', 'Donkey', 'Chicken', 'Duck', 'Turkey', 'Pigeon']),
      _breed(), _petAge('Age'), _petGender('Gender'), _vaccination, _petWeight('Weight (kg)'),
    ],
    'Other Pets & Animals': [
      _animalType(), _breed(), _petAge(), _petGender(), _petColor,
    ],
    'Pet & Animal food': [
      _condition(), _brand('e.g., Pedigree, Royal Canin, Whiskas'), _suitableFor,
    ],
    'Pet & Animal Accessories': [
      _condition(), _brand('Enter brand name'),
      _petProductType(), _suitableFor,
    ],

    // ── SERVICES (NO condition field!) ────────
    'Servicing & Repair': [
      _experience, _availability(), _serviceLocation(),
    ],
    'IT Services': [
      _experience, _availability(),
      _serviceLocation(null, ['At Customer Location', 'At Provider Location', 'Remote/Online']),
      _languages(),
    ],
    'Professional Services': [
      _experience, _availability(), _serviceLocation(), _languages(),
    ],
    'Gym & Fitness': [
      _experience, _availability(),
      _serviceLocation('Location', ['At Customer Location', 'At Provider Location']),
    ],
    'Beauty Services': [
      _experience, _availability(),
      _serviceLocation('Location', ['At Customer Location', 'At Salon/Parlour']),
    ],
    'Body Massage': [
      _experience, _availability(),
      _serviceLocation('Location', ['At Home', 'At Massage Parlour'], true),
    ],
    'Domestic & Daycare Services': [
      _experience, _availability(), _languages(),
    ],
    'Building maintenance': [
      _experience, _availability(), _serviceLocation(),
    ],
    'Media & Event Management Services': [
      _experience, _availability(),
    ],
    'Matrimonials': [],
    'Tours & Travels': [],

    // ── EDUCATION ────────────────────────────
    'Tuition': [
      _subjects, _gradeLevel, _modeOfTeaching, _experience,
      _languages(['English', 'Hindi', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Other']),
      _availability(),
    ],
    'Courses': [
      _subjects, _gradeLevel, _modeOfTeaching, _experience, _availability(),
    ],
    'Textbooks': [
      _condition(), _brand('e.g., Publisher name'),
    ],
    'Study Abroad': [],
    'Other Education': [],

    // ── HOME & LIVING ────────────────────────
    'Bedroom Furniture': [
      _condition(), _brand('e.g., IKEA, Ashley, Local Carpenter'),
      _furnitureType(['Bed', 'Wardrobe', 'Dresser', 'Nightstand', 'Mattress']),
      _material, _color('Color/Finish', null), _dimensions, _assemblyRequired, _storageAvailable, _style,
    ],
    'Living Room Furniture': [
      _condition(), _brand('e.g., IKEA, La-Z-Boy, Local Maker'),
      _furnitureType(['Sofa', 'Coffee Table', 'TV Stand', 'Shelf', 'Recliner', 'Ottoman']),
      _material, _color('Color/Finish', null), _dimensions, _seatingCapacity, _assemblyRequired, _style,
    ],
    'Kitchen & Dining Furniture': [
      _condition(), _brand('e.g., IKEA, Local Carpenter'),
      _furnitureType(['Dining Table', 'Dining Chair', 'Cabinet', 'Shelf', 'Bar Stool']),
      _material, _color('Color/Finish', null), _dimensions, _seatingCapacity, _assemblyRequired,
    ],
    'Office & Shop Furniture': [
      _condition(), _brand('e.g., Herman Miller, Steelcase, IKEA'),
      _furnitureType(['Desk', 'Office Chair', 'Filing Cabinet', 'Bookshelf', 'Conference Table', 'Reception Desk']),
      _material, _color('Color/Finish', null), _dimensions, _assemblyRequired,
    ],
    "Children's Furniture": [
      _condition(), _brand('e.g., IKEA, Fisher-Price'),
      _furnitureType(['Crib', 'Kids Bed', 'Study Table', 'Toy Storage', 'High Chair', 'Changing Table']),
      _material, _color(), _dimensions, _assemblyRequired,
    ],
    'Home Textiles & Decoration': [
      _condition(), _brand('e.g., Bombay Dyeing, Portico, Spaces, Local'),
      _material, _color(), _style,
    ],
    'Bathroom Products': [
      _condition(), _brand('Enter brand name'), _material,
    ],
    'Household Items': [
      _condition(), _brand('e.g., Prestige, Milton, Local'), _material,
    ],
    'Doors': [
      _condition(), _brand('e.g., CenturyPly, Greenply, Local'), _material, _dimensions,
    ],

    // ── HOBBIES, SPORTS & KIDS ───────────────
    'Sports': [
      _condition(), _brand('e.g., Nike, Adidas, Yonex, Wilson'), _sportType,
    ],
    'Fitness & Gym': [
      _condition(), _brand('e.g., Bowflex, NordicTrack, Decathlon'),
      const FormFieldModel(name: 'sportType', label: 'Equipment Type', labelNe: 'उपकरण प्रकार', type: FieldType.text, placeholder: 'e.g., Treadmill, Dumbbells, Yoga Mat', placeholderNe: 'जस्तै, ट्रेडमिल, डम्बेल, योगा म्याट'),
    ],
    'Musical Instruments': [
      _condition(), _brand('e.g., Yamaha, Gibson, Fender, Roland'), _instrumentType,
    ],
    "Children's Items": [
      _condition(), _brand('Enter brand name'),
    ],
    'Music, Books & Movies': [
      _condition(), _brand('e.g., Publisher, Author, or Brand'),
    ],
    'Other Hobby, Sport & Kids items': [
      _condition(), _brand('Enter brand name'),
    ],

    // ── BUSINESS & INDUSTRY ──────────────────
    'Industry Machinery & Tools': [
      _condition(), _brand('e.g., Caterpillar, John Deere, Bosch, Makita'),
      _machineryType(), _powerSource,
    ],
    'Medical Equipment & Supplies': [
      _condition(), _brand('e.g., Philips, GE Healthcare, Siemens'),
      _machineryType(['Diagnostic', 'Surgical', 'Monitoring', 'Laboratory', 'Therapy']),
    ],
    'Office Supplies & Stationary': [
      _condition(), _brand('e.g., HP, Canon, Xerox, Brother'),
    ],
    'Raw Materials & Industrial Supplies': [
      _condition(), _quantity,
    ],
    'Other Business & Industry Items': [
      _condition(), _brand('Enter brand name'),
    ],
    'Safety & Security': [
      _condition(), _brand('Enter brand name'),
    ],
    'Licences, Titles & Tenders': [],

    // ── ESSENTIALS ───────────────────────────
    'Grocery': [
      _brand('Enter brand name'),
      _productType(['Food Item', 'Beverage', 'Snacks', 'Dairy', 'Grains']),
      _quantity, _expiryDate,
    ],
    'Healthcare': [
      _brand('Enter brand name'),
      _productType(['Medicine', 'First Aid', 'Medical Device', 'Supplements']),
      _quantity, _expiryDate,
    ],
    'Baby Products': [
      _brand('e.g., Pampers, Johnson & Johnson, Huggies'),
      _productType(['Diapers', 'Baby Food', 'Baby Care', 'Feeding', 'Baby Clothes']),
      _quantity,
    ],
    'Household': [
      _condition(), _brand('Enter brand name'),
      _productType(['Cleaning', 'Laundry', 'Storage', 'Kitchen Items']),
      _quantity,
    ],
    'Fruits & Vegetables': [_quantity],
    'Meat & Seafood': [_quantity, _expiryDate],
    'Other Essentials': [_quantity],

    // ── AGRICULTURE ──────────────────────────
    'Crops, Seeds & Plants': [_cropType, _quantity],
    'Farming Tools & Machinery': [
      _condition(), _brand('e.g., John Deere, Mahindra, Kubota'),
      _farmingToolType, _powerSource,
    ],
    'Other Agriculture': [],
  };

  // ============================================
  // CATEGORY-LEVEL FALLBACKS
  // For categories with many subcategories that share the same fields
  // (e.g., Jobs has 60+ job title subcategories, all get the same fields)
  // ============================================

  static final Map<String, List<FormFieldModel>> _categoryFallbacks = {
    'Jobs': [_companyName, _jobType(), _experienceRequired, _educationRequired, _salaryRange()],
    'Overseas Jobs': [],
  };

  /// Get applicable fields for a specific subcategory.
  /// 1. Try exact subcategory name match
  /// 2. Fall back to category-level config (for Jobs, Overseas Jobs)
  /// 3. Default to just [Condition]
  List<FormFieldModel> getApplicableFields(String categoryName, String subcategoryName) {
    final fields = _subcategoryConfigs[subcategoryName];
    if (fields != null) return fields;
    return _categoryFallbacks[categoryName] ?? [_condition()];
  }
}
