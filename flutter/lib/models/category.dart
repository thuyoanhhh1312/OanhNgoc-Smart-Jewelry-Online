class Category {
  final String id;
  final String name;
  final String description;
  final String? image;
  final String? icon;
  final int sortOrder;
  final bool isActive;
  final List<SubCategory> subCategories;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Category({
    required this.id,
    required this.name,
    required this.description,
    this.image,
    this.icon,
    this.sortOrder = 0,
    this.isActive = true,
    this.subCategories = const [],
    required this.createdAt,
    this.updatedAt,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: (json['category_id'] ?? json['id'] ?? json['_id'] ?? '').toString(),
      name: json['category_name'] ?? json['name'] ?? '',
      description: json['description'] ?? '',
      image: json['image'],
      icon: json['icon'],
      sortOrder: json['sortOrder'] ?? json['sort_order'] ?? 0,
      isActive: json['isActive'] ?? json['is_active'] ?? true,
      subCategories: (json['SubCategories'] ?? json['subCategories'] ?? [])
          .map<SubCategory>((sub) => SubCategory.fromJson(sub))
          .toList(),
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : (json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now()),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at']) 
          : (json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'image': image,
      'icon': icon,
      'sortOrder': sortOrder,
      'isActive': isActive,
      'subCategories': subCategories.map((sub) => sub.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

class SubCategory {
  final String id;
  final String name;
  final String description;
  final String? image;
  final String categoryId;
  final int sortOrder;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;

  SubCategory({
    required this.id,
    required this.name,
    required this.description,
    this.image,
    required this.categoryId,
    this.sortOrder = 0,
    this.isActive = true,
    required this.createdAt,
    this.updatedAt,
  });

  factory SubCategory.fromJson(Map<String, dynamic> json) {
    return SubCategory(
      id: (json['subcategory_id'] ?? json['id'] ?? json['_id'] ?? '').toString(),
      name: json['subcategory_name'] ?? json['name'] ?? '',
      description: json['description'] ?? '',
      image: json['image'],
      categoryId: (json['category_id'] ?? json['categoryId'] ?? '').toString(),
      sortOrder: json['sortOrder'] ?? json['sort_order'] ?? 0,
      isActive: json['isActive'] ?? json['is_active'] ?? true,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : (json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now()),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at']) 
          : (json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'image': image,
      'categoryId': categoryId,
      'sortOrder': sortOrder,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
