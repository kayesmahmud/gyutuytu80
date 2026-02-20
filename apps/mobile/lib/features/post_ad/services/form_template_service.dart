/// Form Template Service
///
/// Provides subcategory-specific form field configurations for the post ad flow.
/// Ported from web: apps/web/src/config/formTemplates/subcategories/

enum FieldType { text, number, select, multiselect, checkbox, date }

class FormFieldModel {
  final String name;
  final String label;
  final FieldType type;
  final bool required;
  final String? placeholder;
  final List<String>? options;
  final double? min;
  final double? max;

  const FormFieldModel({
    required this.name,
    required this.label,
    required this.type,
    this.required = false,
    this.placeholder,
    this.options,
    this.min,
    this.max,
  });
}

class FormTemplateService {
  // ============================================
  // COMMON FIELDS
  // ============================================

  static const _conditionOptions = ['Brand New', 'Used'];
  static const _warrantyOptions = [
    'No Warranty',
    'Under Warranty (< 6 months)',
    'Under Warranty (6-12 months)',
    'Under Warranty (1+ years)',
  ];

  static FormFieldModel _condition([List<String>? opts]) => FormFieldModel(
        name: 'condition', label: 'Condition', type: FieldType.select,
        required: true, options: opts ?? _conditionOptions,
      );

  static FormFieldModel _brand(String placeholder, {bool required = false}) =>
      FormFieldModel(
        name: 'brand', label: 'Brand', type: FieldType.text,
        required: required, placeholder: placeholder,
      );

  static FormFieldModel _model(String placeholder) => FormFieldModel(
        name: 'model', label: 'Model', type: FieldType.text,
        placeholder: placeholder,
      );

  static const _warranty = FormFieldModel(
    name: 'warranty', label: 'Warranty', type: FieldType.select,
    options: _warrantyOptions,
  );

  static FormFieldModel _color([String? label, String? placeholder]) => FormFieldModel(
        name: 'color', label: label ?? 'Color', type: FieldType.text,
        placeholder: placeholder ?? 'e.g., Black, White, Red',
      );

  // ============================================
  // ELECTRONICS FIELDS
  // ============================================

  static const _storage = FormFieldModel(
    name: 'storage', label: 'Storage Capacity', type: FieldType.select,
    required: true,
    options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
  );

  static const _ram = FormFieldModel(
    name: 'ram', label: 'RAM', type: FieldType.select, required: true,
    options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
  );

  static const _batteryHealth = FormFieldModel(
    name: 'batteryHealth', label: 'Battery Health', type: FieldType.select,
    options: ['100%', '95-99%', '90-94%', '85-89%', '80-84%', 'Below 80%'],
  );

  static const _processor = FormFieldModel(
    name: 'processor', label: 'Processor', type: FieldType.text, required: true,
    placeholder: 'e.g., Intel Core i5 12th Gen, AMD Ryzen 7',
  );

  static const _graphics = FormFieldModel(
    name: 'graphics', label: 'Graphics Card', type: FieldType.text,
    placeholder: 'e.g., NVIDIA RTX 3060, Integrated',
  );

  static const _screenResolution = FormFieldModel(
    name: 'screenResolution', label: 'Screen Resolution', type: FieldType.select,
    options: ['HD (1366x768)', 'Full HD (1920x1080)', '2K', '4K', 'Retina'],
  );

  static FormFieldModel _screenSize([String? placeholder]) => FormFieldModel(
        name: 'screenSize', label: 'Screen Size', type: FieldType.text,
        required: true, placeholder: placeholder ?? 'e.g., 55 inches',
      );

  static const _smartFeatures = FormFieldModel(
    name: 'smartFeatures', label: 'Smart Features', type: FieldType.multiselect,
    options: ['Smart TV', '4K', 'HDR', 'Android TV', 'WebOS', 'Voice Control'],
  );

  static const _megapixels = FormFieldModel(
    name: 'megapixels', label: 'Megapixels', type: FieldType.number,
    placeholder: 'e.g., 24, 48, 108',
  );

  // ============================================
  // VEHICLE FIELDS
  // ============================================

  static const _vehicleYear = FormFieldModel(
    name: 'year', label: 'Year of Manufacture', type: FieldType.number,
    required: true, placeholder: 'e.g., 2020', min: 1980, max: 2025,
  );

  static const _mileage = FormFieldModel(
    name: 'mileage', label: 'Mileage/Kilometers Driven', type: FieldType.number,
    placeholder: 'in km',
  );

  static FormFieldModel _fuelType([List<String>? opts]) => FormFieldModel(
        name: 'fuelType', label: 'Fuel Type', type: FieldType.select,
        required: true, options: opts ?? ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'],
      );

  static const _transmission = FormFieldModel(
    name: 'transmission', label: 'Transmission', type: FieldType.select,
    required: true, options: ['Manual', 'Automatic', 'Semi-Automatic'],
  );

  static FormFieldModel _engineCapacity([String? placeholder]) => FormFieldModel(
        name: 'engineCapacity', label: 'Engine Capacity (cc)', type: FieldType.number,
        placeholder: placeholder ?? 'e.g., 1500',
      );

  static const _owners = FormFieldModel(
    name: 'owners', label: 'Number of Owners', type: FieldType.select,
    options: ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner or More'],
  );

  static const _registrationYear = FormFieldModel(
    name: 'registrationYear', label: 'Registration Year', type: FieldType.number,
    min: 1980, max: 2025,
  );

  static const _registrationLocation = FormFieldModel(
    name: 'registrationLocation', label: 'Registration Location', type: FieldType.text,
    placeholder: 'e.g., Bagmati, Kathmandu',
  );

  static FormFieldModel _bodyType([List<String>? opts, String? label]) => FormFieldModel(
        name: 'bodyType', label: label ?? 'Body Type', type: FieldType.select,
        options: opts ?? ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Pickup', 'Van'],
      );

  static const _seats = FormFieldModel(
    name: 'seats', label: 'Number of Seats', type: FieldType.select,
    options: ['2', '4', '5', '7', '8+'],
  );

  static const _bicycleType = FormFieldModel(
    name: 'bicycleType', label: 'Bicycle Type', type: FieldType.select,
    options: ['Mountain Bike', 'Road Bike', 'Hybrid', 'Electric', 'Kids Bike'],
  );

  // ============================================
  // PROPERTY FIELDS
  // ============================================

  static const _totalArea = FormFieldModel(
    name: 'totalArea', label: 'Total Area', type: FieldType.number,
    required: true, placeholder: 'Enter area',
  );

  static const _areaUnit = FormFieldModel(
    name: 'areaUnit', label: 'Area Unit', type: FieldType.select,
    required: true, options: ['sq ft', 'aana', 'ropani', 'sq meter'],
  );

  static const _bedrooms = FormFieldModel(
    name: 'bedrooms', label: 'Bedrooms', type: FieldType.select,
    required: true, options: ['Studio', '1', '2', '3', '4', '5', '6+'],
  );

  static const _bathrooms = FormFieldModel(
    name: 'bathrooms', label: 'Bathrooms', type: FieldType.select,
    required: true, options: ['1', '2', '3', '4', '5+'],
  );

  static const _furnishing = FormFieldModel(
    name: 'furnishing', label: 'Furnishing Status', type: FieldType.select,
    options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
  );

  static const _parking = FormFieldModel(
    name: 'parking', label: 'Number of Parking Spaces', type: FieldType.select,
    options: ['None', '1', '2', '3', '4+'],
  );

  static const _floorNumber = FormFieldModel(
    name: 'floorNumber', label: 'Floor Number', type: FieldType.number,
    placeholder: 'e.g., 5',
  );

  static const _totalFloors = FormFieldModel(
    name: 'totalFloors', label: 'Total Floors in Building', type: FieldType.number,
    placeholder: 'e.g., 12',
  );

  static const _facing = FormFieldModel(
    name: 'facing', label: 'Facing Direction', type: FieldType.select,
    options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'],
  );

  static const _propertyAge = FormFieldModel(
    name: 'propertyAge', label: 'Property Age', type: FieldType.select,
    options: ['Under Construction', '0-1 years', '1-5 years', '5-10 years', '10-20 years', '20+ years'],
  );

  static FormFieldModel _amenities([List<String>? opts]) => FormFieldModel(
        name: 'amenities', label: 'Amenities', type: FieldType.multiselect,
        options: opts ?? ['Lift/Elevator', 'Power Backup', 'Water Supply', 'Security/Gated', 'Gym', 'Swimming Pool', 'Garden', 'Playground', 'Club House', 'Visitor Parking'],
      );

  static FormFieldModel _landType([String? label, List<String>? opts]) => FormFieldModel(
        name: 'landType', label: label ?? 'Land Type', type: FieldType.select,
        options: opts ?? ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use'],
      );

  static const _roadAccess = FormFieldModel(
    name: 'roadAccess', label: 'Road Access', type: FieldType.select,
    options: ['Paved Road', 'Graveled Road', 'Dirt Road', 'No Direct Access'],
  );

  static const _roadWidth = FormFieldModel(
    name: 'roadWidth', label: 'Road Width', type: FieldType.number,
    placeholder: 'in feet',
  );

  static const _monthlyRent = FormFieldModel(
    name: 'monthlyRent', label: 'Monthly Rent', type: FieldType.number,
    required: true, placeholder: 'in NPR',
  );

  static const _securityDeposit = FormFieldModel(
    name: 'securityDeposit', label: 'Security Deposit', type: FieldType.number,
    placeholder: 'in NPR',
  );

  static const _availableFrom = FormFieldModel(
    name: 'availableFrom', label: 'Available From', type: FieldType.select,
    options: ['Immediately', '15 days', '1 month', '2 months', '3 months'],
  );

  // ============================================
  // FASHION FIELDS
  // ============================================

  static FormFieldModel _clothingType([List<String>? opts]) => FormFieldModel(
        name: 'clothingType', label: 'Clothing Type', type: FieldType.select,
        required: true,
        options: opts ?? ['Shirt', 'T-Shirt', 'Pants', 'Jeans', 'Dress', 'Saree', 'Kurta', 'Jacket', 'Coat', 'Sweater', 'Skirt', 'Shorts'],
      );

  static const _size = FormFieldModel(
    name: 'size', label: 'Size', type: FieldType.select, required: true,
    options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'],
  );

  static const _fitType = FormFieldModel(
    name: 'fitType', label: 'Fit Type', type: FieldType.select,
    options: ['Regular Fit', 'Slim Fit', 'Loose Fit', 'Skinny Fit'],
  );

  static const _sleeveType = FormFieldModel(
    name: 'sleeveType', label: 'Sleeve Type', type: FieldType.select,
    options: ['Full Sleeve', 'Half Sleeve', 'Sleeveless', '3/4 Sleeve'],
  );

  static FormFieldModel _footwearType([List<String>? opts]) => FormFieldModel(
        name: 'footwearType', label: 'Footwear Type', type: FieldType.select,
        required: true,
        options: opts ?? ['Sneakers', 'Formal Shoes', 'Sandals', 'Slippers', 'Boots', 'Heels', 'Flats', 'Sports Shoes'],
      );

  static const _shoeSize = FormFieldModel(
    name: 'shoeSize', label: 'Shoe Size', type: FieldType.number,
    required: true, placeholder: 'e.g., 38, 40, 42', min: 32, max: 50,
  );

  static const _watchType = FormFieldModel(
    name: 'watchType', label: 'Watch Type', type: FieldType.select,
    options: ['Analog', 'Digital', 'Smart Watch', 'Chronograph'],
  );

  static const _strapMaterial = FormFieldModel(
    name: 'strapMaterial', label: 'Strap Material', type: FieldType.select,
    options: ['Leather', 'Metal', 'Rubber', 'Fabric'],
  );

  // ============================================
  // PETS FIELDS
  // ============================================

  static FormFieldModel _animalType([List<String>? opts]) => FormFieldModel(
        name: 'animalType', label: 'Animal Type', type: FieldType.select,
        required: true,
        options: opts ?? ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Cow', 'Buffalo', 'Goat', 'Chicken', 'Duck', 'Other'],
      );

  static FormFieldModel _breed([String? label, String? placeholder]) => FormFieldModel(
        name: 'breed', label: label ?? 'Breed', type: FieldType.text,
        placeholder: placeholder ?? 'e.g., Golden Retriever, Persian Cat',
      );

  static FormFieldModel _petAge([String? label]) => FormFieldModel(
        name: 'age', label: label ?? 'Age', type: FieldType.select, required: true,
        options: ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'],
      );

  static FormFieldModel _petGender([String? label]) => FormFieldModel(
        name: 'gender', label: label ?? 'Gender', type: FieldType.select,
        options: ['Male', 'Female', 'Unknown'],
      );

  static const _vaccination = FormFieldModel(
    name: 'vaccination', label: 'Vaccination Status', type: FieldType.select,
    required: true,
    options: ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
  );

  static const _petPapers = FormFieldModel(
    name: 'papers', label: 'Pet Papers/Documents', type: FieldType.select,
    options: ['Yes - All Papers', 'Some Papers', 'No Papers'],
  );

  static const _petColor = FormFieldModel(
    name: 'color', label: 'Color/Coat Color', type: FieldType.text,
    placeholder: 'e.g., Brown, Black, White',
  );

  static FormFieldModel _petWeight([String? label]) => FormFieldModel(
        name: 'weight', label: label ?? 'Weight', type: FieldType.number,
        placeholder: 'in kg',
      );

  static FormFieldModel _trained([List<String>? opts]) => FormFieldModel(
        name: 'trained', label: 'Trained', type: FieldType.select,
        options: opts ?? ['Fully Trained', 'Partially Trained', 'Not Trained'],
      );

  static const _friendlyWith = FormFieldModel(
    name: 'friendlyWith', label: 'Friendly With', type: FieldType.multiselect,
    options: ['Children', 'Other Dogs', 'Cats', 'Strangers'],
  );

  static FormFieldModel _petProductType([List<String>? opts]) => FormFieldModel(
        name: 'productType', label: 'Product Type', type: FieldType.select,
        required: true,
        options: opts ?? ['Food', 'Toy', 'Cage', 'Leash', 'Collar', 'Grooming', 'Medicine', 'Bedding'],
      );

  static const _suitableFor = FormFieldModel(
    name: 'suitableFor', label: 'Suitable For', type: FieldType.select,
    options: ['Dogs', 'Cats', 'Birds', 'Fish', 'All Pets'],
  );

  // ============================================
  // SERVICES FIELDS
  // ============================================

  static const _experience = FormFieldModel(
    name: 'experience', label: 'Experience', type: FieldType.select,
    options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
  );

  static FormFieldModel _availability([List<String>? opts]) => FormFieldModel(
        name: 'availability', label: 'Availability', type: FieldType.multiselect,
        options: opts ?? ['Weekdays', 'Weekends', 'Evenings', '24/7', 'On-Call'],
      );

  static FormFieldModel _serviceLocation([String? label, List<String>? opts, bool required = false]) => FormFieldModel(
        name: 'serviceLocation', label: label ?? 'Service Location', type: FieldType.select,
        required: required,
        options: opts ?? ['At Customer Location', 'At Provider Location', 'Remote/Online'],
      );

  static FormFieldModel _languages([List<String>? opts]) => FormFieldModel(
        name: 'languages', label: 'Languages Known', type: FieldType.multiselect,
        options: opts ?? ['English', 'Nepali', 'Hindi', 'Newari', 'Other'],
      );

  static const _subjects = FormFieldModel(
    name: 'subjects', label: 'Subject', type: FieldType.multiselect, required: true,
    options: ['Math', 'Science', 'English', 'Nepali', 'Social Studies', 'Computer', 'Accounts', 'All Subjects'],
  );

  static const _gradeLevel = FormFieldModel(
    name: 'gradeLevel', label: 'Grade/Level', type: FieldType.multiselect, required: true,
    options: ['Primary (1-5)', 'Secondary (6-10)', '+2/Intermediate', 'Bachelor', 'Master'],
  );

  static const _modeOfTeaching = FormFieldModel(
    name: 'modeOfTeaching', label: 'Mode of Teaching', type: FieldType.select,
    options: ['Home Tuition', 'Online', 'At Institute', 'Group Class'],
  );

  static const _companyName = FormFieldModel(
    name: 'companyName', label: 'Company Name', type: FieldType.text,
    placeholder: 'Enter company name',
  );

  static FormFieldModel _jobType([List<String>? opts]) => FormFieldModel(
        name: 'jobType', label: 'Job Type', type: FieldType.select,
        options: opts ?? ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance'],
      );

  static const _experienceRequired = FormFieldModel(
    name: 'experienceRequired', label: 'Experience Required', type: FieldType.select,
    options: ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
  );

  static const _educationRequired = FormFieldModel(
    name: 'educationRequired', label: 'Education Required', type: FieldType.select,
    options: ['No Formal Education', 'SLC/SEE', '+2', "Bachelor's", "Master's", 'PhD'],
  );

  static FormFieldModel _salaryRange([String? label, List<String>? opts]) => FormFieldModel(
        name: 'salaryRange', label: label ?? 'Salary Range', type: FieldType.select,
        options: opts ?? ['Below 20,000', '20,000-30,000', '30,000-50,000', '50,000-1,00,000', 'Above 1,00,000', 'Negotiable'],
      );

  // ============================================
  // GENERAL FIELDS
  // ============================================

  static FormFieldModel _furnitureType([List<String>? opts]) => FormFieldModel(
        name: 'furnitureType', label: 'Furniture Type', type: FieldType.select,
        required: true,
        options: opts ?? ['Bed', 'Sofa', 'Table', 'Chair', 'Wardrobe', 'Shelf', 'Desk', 'Cabinet', 'Dining Set', 'Other'],
      );

  static const _material = FormFieldModel(
    name: 'material', label: 'Material', type: FieldType.select,
    options: ['Wood', 'Metal', 'Plastic', 'Glass', 'Leather', 'Fabric', 'Mixed Materials'],
  );

  static const _dimensions = FormFieldModel(
    name: 'dimensions', label: 'Dimensions (L \u00d7 W \u00d7 H)', type: FieldType.text,
    placeholder: 'e.g., 200cm \u00d7 100cm \u00d7 80cm',
  );

  static const _assemblyRequired = FormFieldModel(
    name: 'assemblyRequired', label: 'Assembly Required', type: FieldType.select,
    options: ['Yes - Assembly Required', 'No - Ready to Use', 'Partial Assembly'],
  );

  static const _seatingCapacity = FormFieldModel(
    name: 'seatingCapacity', label: 'Seating Capacity', type: FieldType.select,
    options: ['1 Person', '2-3 People', '4-6 People', '6-8 People', '8+ People'],
  );

  static const _storageAvailable = FormFieldModel(
    name: 'storageAvailable', label: 'Storage Available', type: FieldType.select,
    options: ['Yes', 'No'],
  );

  static const _style = FormFieldModel(
    name: 'style', label: 'Style', type: FieldType.select,
    options: ['Modern', 'Traditional', 'Vintage', 'Minimalist', 'Contemporary', 'Rustic', 'Industrial'],
  );

  static const _sportType = FormFieldModel(
    name: 'sportType', label: 'Sport Type', type: FieldType.text,
    placeholder: 'e.g., Cricket, Football, Basketball',
  );

  static const _instrumentType = FormFieldModel(
    name: 'instrumentType', label: 'Instrument Type', type: FieldType.text,
    placeholder: 'e.g., Guitar, Piano, Drums',
  );

  static FormFieldModel _machineryType([List<String>? opts]) => FormFieldModel(
        name: 'machineryType', label: 'Machinery Type', type: FieldType.select,
        required: true,
        options: opts ?? ['Construction', 'Manufacturing', 'Agricultural', 'Office Equipment', 'Medical Equipment'],
      );

  static const _powerSource = FormFieldModel(
    name: 'powerSource', label: 'Power Source', type: FieldType.select,
    options: ['Electric', 'Manual', 'Diesel', 'Petrol', 'Battery'],
  );

  static FormFieldModel _productType([List<String>? opts]) => FormFieldModel(
        name: 'productType', label: 'Product Type', type: FieldType.select,
        required: true,
        options: opts ?? ['Food Item', 'Household Item', 'Baby Product', 'Healthcare'],
      );

  static const _quantity = FormFieldModel(
    name: 'quantity', label: 'Quantity Available', type: FieldType.number,
    placeholder: 'Enter quantity',
  );

  static const _expiryDate = FormFieldModel(
    name: 'expiryDate', label: 'Expiry Date', type: FieldType.date,
  );

  static const _cropType = FormFieldModel(
    name: 'cropType', label: 'Crop/Plant Type', type: FieldType.text,
    required: true, placeholder: 'e.g., Rice, Wheat, Tomato',
  );

  static const _farmingToolType = FormFieldModel(
    name: 'farmingToolType', label: 'Farming Tool Type', type: FieldType.select,
    options: ['Tractor', 'Plough', 'Harvester', 'Sprayer', 'Hand Tool'],
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
        name: 'storage', label: 'Storage Capacity', type: FieldType.select, required: true,
        options: ['128GB SSD', '256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD', '2TB HDD'],
      ),
      _graphics, _screenResolution, _batteryHealth,
    ],
    'Desktop Computers': [
      _condition(), _brand('e.g., Dell, HP, Custom Build'), _model('Enter model name'),
      _warranty, _processor, _ram,
      const FormFieldModel(
        name: 'storage', label: 'Storage Capacity', type: FieldType.select, required: true,
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
      const FormFieldModel(name: 'screenSize', label: 'Sensor Size', type: FieldType.text, required: true, placeholder: 'e.g., Full Frame, APS-C, 1 inch'),
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
      const FormFieldModel(name: 'totalArea', label: 'Land Area', type: FieldType.number, required: true, placeholder: 'Enter area'),
      _areaUnit, _landType('Zoning'), _roadAccess, _roadWidth, _facing,
    ],
    'Land Rentals': [
      const FormFieldModel(name: 'totalArea', label: 'Land Area', type: FieldType.number, required: true, placeholder: 'Enter area'),
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
      const FormFieldModel(name: 'sportType', label: 'Equipment Type', type: FieldType.text, placeholder: 'e.g., Treadmill, Dumbbells, Yoga Mat'),
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
