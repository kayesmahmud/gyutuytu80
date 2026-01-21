import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CreateAdScreen extends StatefulWidget {
  const CreateAdScreen({super.key});

  @override
  State<CreateAdScreen> createState() => _CreateAdScreenState();
}

class _CreateAdScreenState extends State<CreateAdScreen> {
  bool _priceNegotiable = false;
  String? _selectedCategory = "Women's Fashion & Beauty";
  String? _selectedSubCategory = "Traditional Wear";
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
         leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Post a Free Ad",
          style: GoogleFonts.inter(
            color: Colors.black,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Verified Phone Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5), // Light Green
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF10B981)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF065F46)),
                        children: [
                          const TextSpan(text: "Contact phone: "),
                          TextSpan(
                            text: "9860887312", 
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold),
                          ),
                          const TextSpan(text: " (Verified)"),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Ad Details Section
            Text(
              "Ad Details",
              style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            _buildLabel("Ad Title *"),
            _buildTextField(hintText: "e.g., iPhone 15 Pro Max 256GB"),
            _buildCharCount("0/100"),

            const SizedBox(height: 16),
            _buildLabel("Description *"),
            _buildTextField(hintText: "Describe your item in detail...", maxLines: 5),
            _buildCharCount("0/5000"),

            const SizedBox(height: 16),
            _buildLabel("Price (NPR) *"),
            _buildTextField(hintText: "0", keyboardType: TextInputType.number),
            
            Row(
              children: [
                Checkbox(
                  value: _priceNegotiable,
                  activeColor: const Color(0xFF10B981),
                  onChanged: (val) => setState(() => _priceNegotiable = val!),
                ),
                Text(
                  "Price is negotiable",
                  style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[700]),
                ),
              ],
            ),

            const SizedBox(height: 24),
            Text(
              "Category *",
              style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            _buildLabel("Select Category *"),
            _buildDropdown(
              value: _selectedCategory,
              items: ["Women's Fashion & Beauty", "Mobiles", "Electronics"],
              onChanged: (val) => setState(() => _selectedCategory = val),
              icon: Icons.person_3_outlined, // Placeholder for category icon
            ),

            const SizedBox(height: 12),
            _buildLabel("Select Subcategory *"),
            _buildDropdown(
              value: _selectedSubCategory,
              items: ["Traditional Wear", "Western Wear", "Accessories"],
              onChanged: (val) => setState(() => _selectedSubCategory = val),
            ),

            const SizedBox(height: 24),

            // Additional Details Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB), // Very light grey/blue
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                       const Icon(Icons.info_outline, size: 20, color: Colors.grey),
                       const SizedBox(width: 8),
                       Column(
                         crossAxisAlignment: CrossAxisAlignment.start,
                         children: [
                           RichText(
                             text: TextSpan(
                               style: GoogleFonts.inter(color: Colors.black87, fontSize: 14),
                               children: [
                                 const TextSpan(text: "Additional Details", style: TextStyle(fontWeight: FontWeight.bold)),
                                 const TextSpan(text: " for "),
                                 TextSpan(text: _selectedSubCategory ?? "", style: const TextStyle(fontWeight: FontWeight.bold)),
                               ],
                             ),
                           ),
                           Text(
                             "Provide specific details to help buyers...",
                             style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500]),
                           ),
                         ],
                       )
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  _buildLabel("Condition *"),
                  _buildDropdown(hint: "Select Condition", items: ["New", "Used", "Like New"]),
                  
                  const SizedBox(height: 12),
                  _buildLabel("Size *"),
                  _buildDropdown(hint: "Select Size", items: ["S", "M", "L", "XL"]),

                  const SizedBox(height: 12),
                  _buildLabel("Color"),
                  _buildTextField(hintText: "e.g., Black, White, Red"),

                   const SizedBox(height: 12),
                  _buildLabel("Clothing Type *"),
                  _buildDropdown(hint: "Select Clothing Type", items: ["Kurta", "Saree", "Lehenga"]),
                ],
              ),
            ),

            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Photos *", style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                Text("Max 5 Images", style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
              ],
            ),
            const SizedBox(height: 12),

            // Premium Banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEEF2FF), // Light Indigo
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFC7D2FE)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.diamond_outlined, color: Colors.indigo, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Want to upload up to 10 images?", style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.indigo[900])),
                        Text("Get verified to unlock more images!", style: GoogleFonts.inter(fontSize: 11, color: Colors.indigo[700])),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: (){}, 
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                      minimumSize: const Size(0, 32),
                    ),
                    child: Text("Get Verified", style: GoogleFonts.inter(fontSize: 11, color: Colors.white)),
                  )
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Upload Box
            Container(
              height: 150,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!, style: BorderStyle.none), // Dashed border needs custom painter, simple border for now
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: CustomPaint(
                      painter: DashedBorderPainter(),
                    ),
                  ),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.camera_alt_outlined, size: 32, color: Colors.grey[400]),
                        const SizedBox(height: 8),
                        Text("Click to upload or drag and drop", style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.black87)),
                        const SizedBox(height: 4),
                        Text("PNG, JPG, GIF up to 5MB", style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
                        Text("(Max 5 Images)", style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
                        const SizedBox(height: 8),
                        Text("0/5 Images total", style: GoogleFonts.inter(fontSize: 11, color: Colors.red[400], fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            _buildLabel("Location (Area/Place) *"),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  TextField(
                     decoration: InputDecoration(
                        hintText: "Search location...",
                        prefixIcon: const Icon(Icons.search, color: Colors.grey),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 14),
                     ),
                  ),
                  const Divider(height: 1),
                  _buildLocationItem("Bagmati Province"),
                  _buildLocationItem("Gandaki Province"),
                  _buildLocationItem("Karnali Province"),
                  // Truncated list...
                ],
              ),
            ),

            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(color: Colors.grey[300]!),
                    ),
                    child: Text("Cancel", style: GoogleFonts.inter(color: Colors.black)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                       padding: const EdgeInsets.symmetric(vertical: 16),
                       backgroundColor: const Color(0xFF10B981),
                    ),
                    child: Text("Post Ad", style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13, color: Colors.black87)),
    );
  }

  Widget _buildTextField({String? hintText, int maxLines = 1, TextInputType? keyboardType}) {
    return TextField(
      maxLines: maxLines,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    );
  }

  Widget _buildDropdown({String? value, String? hint, List<String>? items, ValueChanged<String?>? onChanged, IconData? icon}) {
    return DropdownButtonFormField<String>(
      value: value,
      hint: hint != null ? Text(hint, style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 14)) : null,
      decoration: InputDecoration(
        prefixIcon: icon != null ? Icon(icon, size: 18, color: Colors.grey[600]) : null,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      items: items?.map((item) => DropdownMenuItem(value: item, child: Text(item, style: GoogleFonts.inter(fontSize: 14)))).toList(),
      onChanged: onChanged ?? (_) {},
      icon: const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
    );
  }

  Widget _buildCharCount(String text) {
     return Align(
       alignment: Alignment.centerRight,
       child: Padding(
         padding: const EdgeInsets.only(top: 4),
         child: Text(text, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
       ),
     );
  }

  Widget _buildLocationItem(String name) {
    return ListTile(
      visualDensity: VisualDensity.compact,
      leading: const Icon(Icons.arrow_right, color: Colors.grey, size: 20),
      title: Text(name, style: GoogleFonts.inter(fontSize: 14)),
      onTap: () {},
    );
  }
}

class DashedBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.grey[300]!
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    const dashWidth = 5;
    const dashSpace = 3;
    final path = Path();
    
    // Top
    for (double i = 0; i < size.width; i += dashWidth + dashSpace) {
      path.moveTo(i, 0);
      path.lineTo(i + dashWidth, 0);
    }
    // Bottom
    for (double i = 0; i < size.width; i += dashWidth + dashSpace) {
      path.moveTo(i, size.height);
      path.lineTo(i + dashWidth, size.height);
    }
    // Left
    for (double i = 0; i < size.height; i += dashWidth + dashSpace) {
      path.moveTo(0, i);
      path.lineTo(0, i + dashWidth);
    }
    // Right
    for (double i = 0; i < size.height; i += dashWidth + dashSpace) {
      path.moveTo(size.width, i);
      path.lineTo(size.width, i + dashWidth);
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
