class User {
  final String id;
  final String email;
  final String? fullName;
  final String? phoneNumber;
  final String? avatar;
  final List<Address> addresses;
  final DateTime createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    required this.email,
    this.fullName,
    this.phoneNumber,
    this.avatar,
    this.addresses = const [],
    required this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['id'] ?? json['_id']).toString(), // Convert to String
      email: json['email'],
      fullName: json['fullName'] ?? json['name'], // Handle both field names
      phoneNumber: json['phoneNumber'] ?? json['phone'],
      avatar: json['avatar'],
      addresses: (json['addresses'] as List<dynamic>?)
          ?.map((address) => Address.fromJson(address))
          .toList() ?? [],
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'avatar': avatar,
      'addresses': addresses.map((address) => address.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? fullName,
    String? phoneNumber,
    String? avatar,
    List<Address>? addresses,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      avatar: avatar ?? this.avatar,
      addresses: addresses ?? this.addresses,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class Address {
  final String id;
  final String fullName;
  final String phoneNumber;
  final String address;
  final String city;
  final String district;
  final String ward;
  final String? postalCode;
  final bool isDefault;

  Address({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    required this.address,
    required this.city,
    required this.district,
    required this.ward,
    this.postalCode,
    this.isDefault = false,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: (json['id'] ?? json['_id']).toString(), // Convert to String
      fullName: json['fullName'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      district: json['district'] ?? '',
      ward: json['ward'] ?? '',
      postalCode: json['postalCode'],
      isDefault: json['isDefault'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'address': address,
      'city': city,
      'district': district,
      'ward': ward,
      'postalCode': postalCode,
      'isDefault': isDefault,
    };
  }

  String get fullAddress {
    return '$address, $ward, $district, $city';
  }
}
