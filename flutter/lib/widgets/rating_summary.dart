import 'package:flutter/material.dart';

class RatingSummary extends StatelessWidget {
  final double avgRating;
  final int totalReviews;
  final Map<String, dynamic> ratingDistribution;

  const RatingSummary({
    Key? key,
    required this.avgRating,
    required this.totalReviews,
    required this.ratingDistribution,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 2,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Tổng quan đánh giá',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          Row(
            children: [
              // Average rating section
              Expanded(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      avgRating.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: Colors.amber,
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return Icon(
                          index < avgRating.floor()
                              ? Icons.star
                              : index < avgRating
                                  ? Icons.star_half
                                  : Icons.star_border,
                          color: Colors.amber,
                          size: 20,
                        );
                      }),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$totalReviews đánh giá',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Rating distribution
              Expanded(
                flex: 3,
                child: Column(
                  children: List.generate(5, (index) {
                    final star = 5 - index;
                    final count = ratingDistribution[star.toString()] ?? 0;
                    final percentage = totalReviews > 0 ? (count / totalReviews) : 0.0;
                    
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          Text(
                            '$star',
                            style: const TextStyle(fontSize: 14),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.star,
                            color: Colors.amber,
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: LinearProgressIndicator(
                              value: percentage,
                              backgroundColor: Colors.grey.shade200,
                              valueColor: const AlwaysStoppedAnimation<Color>(Colors.amber),
                            ),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            width: 30,
                            child: Text(
                              '$count',
                              style: const TextStyle(fontSize: 12),
                              textAlign: TextAlign.end,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
