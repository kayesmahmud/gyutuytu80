import 'package:mobile/core/data/nepal_location_data.dart';

class MockFilterData {
  static const List<Map<String, dynamic>> categories = [
    // 1. Mobiles
    {
      "name": "Mobiles",
      "shortName": "Mobiles",
      "icon": "📱",
      "slug": "mobiles",
      "subcategories": [
        {"name": "Mobile Phones", "slug": "mobile-phones"},
        {"name": "Tablets & Accessories", "slug": "tablets-accessories"},
        {"name": "Mobile & Tablet Accessories", "slug": "mobile-accessories"},
        {"name": "Smart Watches", "slug": "smart-watches"},
      ]
    },
    // 2. Electronics
    {
      "name": "Electronics",
      "shortName": "Electronics",
      "icon": "💻",
      "slug": "electronics",
      "subcategories": [
        {"name": "Laptops", "slug": "laptops"},
        {"name": "Desktop Computers", "slug": "desktop-computers"},
        {"name": "TVs", "slug": "tvs"},
        {"name": "Cameras, Camcorders & Accessories", "slug": "cameras"},
        {"name": "Computer Accessories", "slug": "computer-accessories"},
        {"name": "Audio Equipment", "slug": "audio-equipment"},
        {"name": "Gaming Consoles", "slug": "gaming-consoles"},
        {"name": "Other Electronics", "slug": "other-electronics"},
      ]
    },
    // 3. Vehicles
    {
      "name": "Vehicles",
      "shortName": "Vehicles",
      "icon": "🚗",
      "slug": "vehicles",
      "subcategories": [
        {"name": "Cars", "slug": "cars"},
        {"name": "Motorcycles", "slug": "motorcycles"},
        {"name": "Scooters", "slug": "scooters"},
        {"name": "Electric Vehicles", "slug": "electric-vehicles"},
        {"name": "Bicycles", "slug": "bicycles"},
        {"name": "Heavy Vehicles", "slug": "heavy-vehicles"},
        {"name": "Auto Parts & Accessories", "slug": "auto-parts"},
        {"name": "Vehicle Rentals", "slug": "vehicle-rentals"},
        {"name": "Parking & Garage", "slug": "parking-garage"},
      ]
    },
    // 4. Property
    {
      "name": "Property",
      "shortName": "Property",
      "icon": "🏢",
      "slug": "property",
      "subcategories": [
        {"name": "Apartments for Sale", "slug": "apartments-sale"},
        {"name": "Apartments for Rent", "slug": "apartments-rent"},
        {"name": "Houses for Sale", "slug": "houses-sale"},
        {"name": "Houses for Rent", "slug": "houses-rent"},
        {"name": "Land & Plots", "slug": "land-plots"},
        {"name": "Commercial Properties for Sale", "slug": "commercial-sale"},
        {"name": "Commercial Properties for Rent", "slug": "commercial-rent"},
        {"name": "Rooms & Flatmates", "slug": "rooms-flatmates"},
      ]
    },
    // 5. Home & Living
    {
      "name": "Home & Living",
      "shortName": "Home & Living",
      "icon": "🏠",
      "slug": "home-living",
      "subcategories": [
        {"name": "Bedroom Furniture", "slug": "bedroom-furniture"},
        {"name": "Living Room Furniture", "slug": "living-room-furniture"},
        {"name": "Kitchen & Dining Furniture", "slug": "kitchen-dining-furniture"},
        {"name": "Office & Shop Furniture", "slug": "office-shop-furniture"},
        {"name": "Children's Furniture", "slug": "childrens-furniture"},
        {"name": "Home Decor", "slug": "home-decor"},
        {"name": "Kitchen Appliances", "slug": "kitchen-appliances"},
        {"name": "Home Appliances", "slug": "home-appliances"},
      ]
    },
    // 6. Men's Fashion & Grooming
    {
      "name": "Men's Fashion & Grooming",
      "shortName": "Men's Fashion",
      "icon": "👔",
      "slug": "mens-fashion",
      "subcategories": [
        {"name": "Men's Clothing", "slug": "mens-clothing"},
        {"name": "Men's Footwear", "slug": "mens-footwear"},
        {"name": "Men's Watches", "slug": "mens-watches"},
        {"name": "Men's Accessories", "slug": "mens-accessories"},
        {"name": "Men's Grooming", "slug": "mens-grooming"},
      ]
    },
    // 7. Women's Fashion & Beauty
    {
      "name": "Women's Fashion & Beauty",
      "shortName": "Women's Fashion",
      "icon": "👗",
      "slug": "womens-fashion",
      "subcategories": [
        {"name": "Women's Clothing", "slug": "womens-clothing"},
        {"name": "Women's Footwear", "slug": "womens-footwear"},
        {"name": "Women's Watches", "slug": "womens-watches"},
        {"name": "Jewelry", "slug": "jewelry"},
        {"name": "Beauty & Skincare", "slug": "beauty-skincare"},
        {"name": "Bags & Luggage", "slug": "bags-luggage"},
      ]
    },
    // 8. Hobbies, Sports & Kids
    {
      "name": "Hobbies, Sports & Kids",
      "shortName": "Sports & Kids",
      "icon": "⚽",
      "slug": "hobbies-sports",
      "subcategories": [
        {"name": "Sports", "slug": "sports"},
        {"name": "Fitness & Gym", "slug": "fitness-gym"},
        {"name": "Musical Instruments", "slug": "musical-instruments"},
        {"name": "Kids Items", "slug": "kids-items"},
        {"name": "Books & Stationery", "slug": "books-stationery"},
      ]
    },
    // 9. Essentials
    {
      "name": "Essentials",
      "shortName": "Essentials",
      "icon": "🛒",
      "slug": "essentials",
      "subcategories": [
        {"name": "Grocery", "slug": "grocery"},
        {"name": "Healthcare", "slug": "healthcare"},
        {"name": "Baby Products", "slug": "baby-products"},
        {"name": "Household", "slug": "household"},
      ]
    },
    // 10. Jobs
    {
      "name": "Jobs",
      "shortName": "Jobs",
      "icon": "💼",
      "slug": "jobs",
      "subcategories": [
        {"name": "Full Time Jobs", "slug": "full-time-jobs"},
        {"name": "Part Time Jobs", "slug": "part-time-jobs"},
        {"name": "Internships", "slug": "internships"},
        {"name": "Freelance Jobs", "slug": "freelance-jobs"},
      ]
    },
    // 11. Overseas Jobs
    {
      "name": "Overseas Jobs",
      "shortName": "Overseas Jobs",
      "icon": "✈️",
      "slug": "overseas-jobs",
      "subcategories": [
        {"name": "Middle East Jobs", "slug": "middle-east-jobs"},
        {"name": "Asia Jobs", "slug": "asia-jobs"},
        {"name": "Europe Jobs", "slug": "europe-jobs"},
      ]
    },
    // 12. Pets & Animals
    {
      "name": "Pets & Animals",
      "shortName": "Pets",
      "icon": "🐾",
      "slug": "pets",
      "subcategories": [
        {"name": "Dogs", "slug": "dogs"},
        {"name": "Cats", "slug": "cats"},
        {"name": "Birds", "slug": "birds"},
        {"name": "Fish & Aquariums", "slug": "fish"},
        {"name": "Rabbits", "slug": "rabbits"},
        {"name": "Other Pets", "slug": "other-pets"},
        {"name": "Livestock", "slug": "livestock"},
        {"name": "Poultry", "slug": "poultry"},
        {"name": "Pet Food", "slug": "pet-food"},
        {"name": "Pet Accessories", "slug": "pet-accessories"},
      ]
    },
    // 13. Services
    {
      "name": "Services",
      "shortName": "Services",
      "icon": "🛠️",
      "slug": "services",
      "subcategories": [
        {"name": "Tuition", "slug": "tuition"},
        {"name": "Servicing & Repair", "slug": "servicing-repair"},
        {"name": "IT Services", "slug": "it-services"},
        {"name": "Professional Services", "slug": "professional-services"},
        {"name": "Gym & Fitness (Service)", "slug": "gym-fitness-service"},
        {"name": "Beauty Services", "slug": "beauty-services"},
        {"name": "Body Massage", "slug": "body-massage"},
        {"name": "Domestic & Daycare Services", "slug": "domestic-daycare"},
      ]
    },
    // 14. Education
    {
      "name": "Education",
      "shortName": "Education",
      "icon": "📚",
      "slug": "education",
      "subcategories": [
        {"name": "Schools & Colleges", "slug": "schools-colleges"},
        {"name": "Coaching & Tuition", "slug": "coaching-tuition"},
        {"name": "Online Courses", "slug": "online-courses"},
        {"name": "Study Abroad", "slug": "study-abroad"},
      ]
    },
    // 15. Business & Industry
    {
      "name": "Business & Industry",
      "shortName": "Business",
      "icon": "🏭",
      "slug": "business-industry",
      "subcategories": [
        {"name": "Industry Machinery & Tools", "slug": "industry-machinery"},
        {"name": "Medical Equipment & Supplies", "slug": "medical-equipment"},
        {"name": "Office Equipment", "slug": "office-equipment"},
        {"name": "Raw Materials", "slug": "raw-materials"},
      ]
    },
    // 16. Agriculture
    {
      "name": "Agriculture",
      "shortName": "Agriculture",
      "icon": "🌾",
      "slug": "agriculture",
      "subcategories": [
        {"name": "Crops, Seeds & Plants", "slug": "crops-seeds"},
        {"name": "Farming Tools & Machinery", "slug": "farming-tools"},
        {"name": "Fertilizers & Pesticides", "slug": "fertilizers"},
        {"name": "Livestock Feed", "slug": "livestock-feed"},
      ]
    },
  ];

  static const List<Map<String, dynamic>> locations = NepalLocationData.locations;
}
