import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:mobile/core/widgets/main_app_bar.dart';
import 'package:mobile/core/widgets/main_drawer.dart';

class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: MainAppBar(
          bottom: TabBar(
            labelColor: const Color(0xFF2563EB), // Blue active
            unselectedLabelColor: Colors.grey[600],
            indicatorColor: const Color(0xFF2563EB),
            indicatorWeight: 3,
            labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
            tabs: const [
              Tab(text: "Chats"),
              Tab(text: "Announcements"),
            ],
          ),
        ),
        drawer: const MainDrawer(),
        body: TabBarView(
          children: [
            // Chats Tab
            SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Messages",
                      style: GoogleFonts.inter(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildMessageItem(
                        name: "Amit Sharma",
                        message: "hi",
                        adTitle: "Luxurious 4BHK Bungalow with Garden - ...",
                        time: "8 days ago",
                        avatarUrl: "https://randomuser.me/api/portraits/men/1.jpg"), // Placeholder
                    const Divider(height: 1),
                    _buildMessageItem(
                        name: "Parash Thakur",
                        message: "I want to buy",
                        adTitle: "Parash test ad",
                        time: "8 days ago",
                        avatarUrl: "https://randomuser.me/api/portraits/men/2.jpg"),
                    const Divider(height: 1),
                    _buildMessageItem(
                        name: "Ananda Shahi",
                        message: "",
                        adTitle: "Car",
                        time: "",
                        initials: "AS",
                        color: Colors.pinkAccent),
                     const Divider(height: 1),
                    _buildMessageItem(
                        name: "Rohit Thapa",
                        message: "jjjj",
                        adTitle: "Abstract Print Cotton Blouse",
                        time: "8 days ago",
                        avatarUrl: "https://randomuser.me/api/portraits/men/4.jpg"), // Illustration in screenshot, using generic for now
                  ],
                ),
              ),
            ),
            
            // Announcements Tab (Placeholder)
            Center(child: Text("No announcements", style: GoogleFonts.inter(color: Colors.grey))),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {},
          backgroundColor: const Color(0xFFE11D48), // Pink/Red color
          child: const Icon(Icons.arrow_upward, color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildMessageItem({
    required String name,
    required String message,
    required String adTitle,
    String? time,
    String? avatarUrl,
    String? initials,
    Color? color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          if (avatarUrl != null)
            CircleAvatar(
              radius: 24,
              backgroundImage: NetworkImage(avatarUrl),
            )
          else
            CircleAvatar(
              radius: 24,
              backgroundColor: color ?? Colors.blue,
              child: Text(
                 initials ?? name[0],
                 style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          const SizedBox(width: 12),
          
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    if (time != null && time.isNotEmpty)
                      Text(
                        time,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                  ],
                ),
                if (message.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.folder_open, size: 14, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        adTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: Colors.grey[500],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
