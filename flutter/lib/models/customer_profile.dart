class CustomerProfile {
  final String id;
  final String userId;
  final String name;
  final String email;
  final String? phone;
  final String? gender;
  final String? address;

  CustomerProfile({
    required this.id,
    required this.userId,
    required this.name,
    required this.email,
    this.phone,
    this.gender,
    this.address,
  });

  factory CustomerProfile.fromJson(Map<String, dynamic> json) {
    return CustomerProfile(
      id: (json['customer_id'] ?? json['id'] ?? '').toString(),
      userId: (json['user_id'] ?? '').toString(),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone']?.toString(),
      gender: json['gender']?.toString(),
      address: json['address']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'customer_id': id,
      'user_id': userId,
      'name': name,
      'email': email,
      'phone': phone,
      'gender': gender,
      'address': address,
    };
  }

  CustomerProfile copyWith({
    String? name,
    String? phone,
    String? gender,
    String? address,
  }) {
    return CustomerProfile(
      id: id,
      userId: userId,
      name: name ?? this.name,
      email: email,
      phone: phone ?? this.phone,
      gender: gender ?? this.gender,
      address: address ?? this.address,
    );
  }
}
