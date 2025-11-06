import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/product_provider.dart';
import '../widgets/product_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _sortBy = 'newest';
  double _minPrice = 0;
  double _maxPrice = 10000000;
  final List<String> _selectedCategories = [];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _performSearch() {
    if (_searchQuery.trim().isNotEmpty) {
      final productProvider = Provider.of<ProductProvider>(context, listen: false);
      productProvider.searchProducts(
        _searchQuery.trim(),
        sortBy: _sortBy,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        categories: _selectedCategories,
      );
    }
  }

  void _clearFilters() {
    setState(() {
      _sortBy = 'newest';
      _minPrice = 0;
      _maxPrice = 10000000;
      _selectedCategories.clear();
    });
    _performSearch();
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
          
          // Filters Row
          _buildFiltersRow(),
          
          // Search Results
          Expanded(
            child: _buildSearchResults(),
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
        'Tìm kiếm',
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.bold,
        ),
      ),
      centerTitle: true,
      automaticallyImplyLeading: false,
      actions: [
        IconButton(
          onPressed: _showFiltersBottomSheet,
          icon: const Icon(
            Icons.tune,
            color: AppColors.textSecondary,
          ),
        ),
      ],
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
          // Debounce search
          Future.delayed(const Duration(milliseconds: 500), () {
            if (_searchQuery == value && value.trim().isNotEmpty) {
              _performSearch();
            }
          });
        },
        onSubmitted: (value) {
          _performSearch();
        },
        decoration: InputDecoration(
          hintText: 'Tìm kiếm sản phẩm...',
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

  Widget _buildFiltersRow() {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // Sort Dropdown
          Expanded(
            flex: 2,
            child: DropdownButtonFormField<String>(
              initialValue: _sortBy,
              onChanged: (value) {
                setState(() {
                  _sortBy = value!;
                });
                _performSearch();
              },
              decoration: InputDecoration(
                labelText: 'Sắp xếp',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: const [
                DropdownMenuItem(value: 'newest', child: Text('Mới nhất')),
                DropdownMenuItem(value: 'oldest', child: Text('Cũ nhất')),
                DropdownMenuItem(value: 'price_low', child: Text('Giá thấp')),
                DropdownMenuItem(value: 'price_high', child: Text('Giá cao')),
                DropdownMenuItem(value: 'name_az', child: Text('A-Z')),
                DropdownMenuItem(value: 'name_za', child: Text('Z-A')),
              ],
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Filter Button
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _showFiltersBottomSheet,
              icon: const Icon(Icons.filter_list, size: 16),
              label: const Text('Bộ lọc'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Clear Filters
          if (_selectedCategories.isNotEmpty || _minPrice > 0 || _maxPrice < 10000000)
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _clearFilters,
                icon: const Icon(Icons.clear, size: 16),
                label: const Text('Xóa'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    return Consumer<ProductProvider>(
      builder: (context, productProvider, child) {
        if (productProvider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(
              color: AppColors.primary,
            ),
          );
        }

        if (productProvider.error != null) {
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
                  'Có lỗi xảy ra',
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
                  onPressed: _performSearch,
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          );
        }

        if (_searchQuery.isEmpty) {
          return _buildEmptySearch();
        }

        final searchResults = productProvider.searchResults;
        
        if (searchResults.isEmpty) {
          return _buildNoResults();
        }

        return RefreshIndicator(
          onRefresh: () async => _performSearch(),
          color: AppColors.primary,
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.7,
            ),
            itemCount: searchResults.length,
            itemBuilder: (context, index) {
              final product = searchResults[index];
              return ProductCard(
                product: product,
                onTap: () {
                  Navigator.of(context).pushNamed(
                    '/product-detail',
                    arguments: product,
                  );
                },
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildEmptySearch() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search,
            size: 64,
            color: AppColors.textSecondary,
          ),
          const SizedBox(height: 16),
          Text(
            'Tìm kiếm sản phẩm',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Nhập từ khóa để tìm kiếm sản phẩm bạn muốn',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textLight,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildNoResults() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 64,
            color: AppColors.textSecondary,
          ),
          const SizedBox(height: 16),
          Text(
            'Không tìm thấy sản phẩm',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textLight,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: _clearFilters,
            child: const Text('Xóa bộ lọc'),
          ),
        ],
      ),
    );
  }

  void _showFiltersBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _buildFiltersBottomSheet(),
    );
  }

  Widget _buildFiltersBottomSheet() {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Bộ lọc tìm kiếm',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Price Range
          Text(
            'Khoảng giá',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          RangeSlider(
            values: RangeValues(_minPrice, _maxPrice),
            min: 0,
            max: 10000000,
            divisions: 100,
            labels: RangeLabels(
              '${(_minPrice / 1000).round()}K',
              '${(_maxPrice / 1000).round()}K',
            ),
            onChanged: (values) {
              setState(() {
                _minPrice = values.start;
                _maxPrice = values.end;
              });
            },
          ),
          
          const SizedBox(height: 24),
          
          // Apply Filters Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _performSearch();
              },
              child: const Text('Áp dụng bộ lọc'),
            ),
          ),
        ],
      ),
    );
  }
}
