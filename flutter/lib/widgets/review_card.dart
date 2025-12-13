import 'package:flutter/material.dart';

class ReviewCard extends StatelessWidget {
  final Map<String, dynamic> review;

  const ReviewCard({
    super.key,
    required this.review,
  });

  @override
  Widget build(BuildContext context) {
    final rating = review['rating'] ?? 0;
    final content = review['content'] ?? '';
    // Handle both user_name and nested Customer object
    String userName = 'Anonymous';
    if (review['user_name'] != null) {
      userName = review['user_name'];
    } else if (review['Customer'] != null && review['Customer']['name'] != null) {
      userName = review['Customer']['name'];
    }
    final createdAt = review['created_at'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User info and rating
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: const Color(0xFFFFC107),
                  child: Text(
                    userName.isNotEmpty ? userName[0].toUpperCase() : 'A',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        userName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: Color(0xFF1A1A1A),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Row(
                            children: List.generate(5, (index) {
                              return Icon(
                                index < rating ? Icons.star : Icons.star_border,
                                color: Colors.amber,
                                size: 18,
                              );
                            }),
                          ),
                          const SizedBox(width: 8),
                          if (createdAt.isNotEmpty)
                            Text(
                              _formatDate(createdAt),
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 12,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Review content
            Text(
              content,
              style: const TextStyle(
                fontSize: 14,
                height: 1.6,
                color: Color(0xFF333333),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays > 7) {
        return '${date.day}/${date.month}/${date.year}';
      } else if (difference.inDays > 0) {
        return '${difference.inDays} ngày trước';
      } else if (difference.inHours > 0) {
        return '${difference.inHours} giờ trước';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes} phút trước';
      } else {
        return 'Vừa xong';
      }
    } catch (e) {
      return dateString;
    }
  }
}
