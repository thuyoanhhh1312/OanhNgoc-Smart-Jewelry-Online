import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/product_provider.dart';
import '../widgets/category_card.dart';
import '../models/category.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Category> _getFilteredCategories(List<Category> categories) {
    if (_searchQuery.isEmpty) {
      return categories;
    }
    return categories.where((category) {
      return category.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
             category.description.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // Search Bar
          _buildSearchBar(),
          
          // Categories Grid
          Expanded(
            child: _buildCategoriesGrid(),
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: AppColors.surface,
      elevation: 0,
      title: Text(
        'Danh mục sản phẩm',
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.bold,
        ),
      ),
      centerTitle: true,
      automaticallyImplyLeading: false,
    );
  }

  Widget _buildSearchBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: TextField(
        controller: _searchController,
        onChanged: (value) {
          setState(() {
            _searchQuery = value;
          });
        },
        decoration: InputDecoration(
          hintText: 'Tìm kiếm danh mục...',
          prefixIcon: const Icon(
            Icons.search,
            color: AppColors.textSecondary,
          ),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  onPressed: () {
                    _searchController.clear();
                    setState(() {
                      _searchQuery = '';
                    });
                  },
                  icon: const Icon(
                    Icons.clear,
                    color: AppColors.textSecondary,
                  ),
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 2),
          ),
          filled: true,
          fillColor: AppColors.surface,
          contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        ),
      ),
    );
  }

  Widget _buildCategoriesGrid() {
    return Consumer<ProductProvider>(
      builder: (context, productProvider, child) {
        if (productProvider.isLoading && productProvider.categories.isEmpty) {
          return const Center(
            child: CircularProgressIndicator(
              color: AppColors.primary,
            ),
          );
        }

        if (productProvider.error != null && productProvider.categories.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 64,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(height: 16),
                Text(
                  'Không thể tải danh mục',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  productProvider.error ?? 'Lỗi không xác định',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textLight,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => productProvider.loadCategories(),
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          );
        }

        final filteredCategories = _getFilteredCategories(productProvider.categories);

        if (filteredCategories.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  _searchQuery.isNotEmpty ? Icons.search_off : Icons.category_outlined,
                  size: 64,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(height: 16),
                Text(
                  _searchQuery.isNotEmpty 
                      ? 'Không tìm thấy danh mục phù hợp'
                      : 'Chưa có danh mục nào',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                if (_searchQuery.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Thử tìm kiếm với từ khóa khác',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textLight,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () {
                      _searchController.clear();
                      setState(() {
                        _searchQuery = '';
                      });
                    },
                    child: const Text('Xóa bộ lọc'),
                  ),
                ],
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => productProvider.loadCategories(),
          color: AppColors.primary,
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 0.85,
            ),
            itemCount: filteredCategories.length,
            itemBuilder: (context, index) {
              final category = filteredCategories[index];
              return CategoryCard(
                category: category,
                onTap: () {
                  Navigator.of(context).pushNamed(
                    '/products',
                    arguments: {'categoryId': category.id},
                  );
                },
              );
            },
          ),
        );
      },
    );
  }
}
