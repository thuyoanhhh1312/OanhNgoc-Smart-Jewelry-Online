import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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
  Timer? _debounceTimer;

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _performSearch() {
    if (_searchQuery.trim().isNotEmpty) {
      final productProvider =
          Provider.of<ProductProvider>(context, listen: false);
      productProvider.searchProducts(
        _searchQuery.trim(),
        sortBy: _sortBy,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        categories: _selectedCategories,
      ).then((_) {
      });
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
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // Enhanced Search Bar
          _buildEnhancedSearchBar(),

          // Quick filters + Sort (only show when searching)
          if (_searchQuery.isNotEmpty) _buildQuickFiltersBar(),

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
      backgroundColor: const Color(0xFFFFFFFF),
      elevation: 0.5,
      title: Text(
        'Tìm kiếm sản phẩm',
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
          color: const Color(0xFF1A1A1A),
          fontWeight: FontWeight.w700,
          fontSize: 20,
        ),
      ),
      centerTitle: false,
      automaticallyImplyLeading: false,
      actions: [
        if (_searchQuery.isNotEmpty)
          IconButton(
            onPressed: _showFiltersBottomSheet,
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.tune,
                color: Color(0xFFD4A574),
                size: 20,
              ),
            ),
          ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildEnhancedSearchBar() {
    return Container(
      color: const Color(0xFFFFFFFF),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: TextField(
        controller: _searchController,
        onChanged: (value) {
          setState(() {
            _searchQuery = value;
          });
          // Cancel previous debounce
          _debounceTimer?.cancel();

          // Debounce search with new timer
          if (value.trim().isNotEmpty) {
            _debounceTimer = Timer(const Duration(milliseconds: 500), () {
              _performSearch();
            });
          }
        },
        onSubmitted: (value) {
          _debounceTimer?.cancel();
          _performSearch();
        },
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: 'Tìm kiếm nhẫn, dây chuyền, vòng tay...',
          hintStyle: const TextStyle(
            color: Color(0xFFAAAAAA),
            fontSize: 14,
          ),
          prefixIcon: Container(
            padding: const EdgeInsets.only(left: 12, right: 8),
            child: const Icon(
              Icons.search,
              color: Color(0xFFD4A574),
              size: 22,
            ),
          ),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  onPressed: () {
                    _searchController.clear();
                    setState(() {
                      _searchQuery = '';
                    });
                    _debounceTimer?.cancel();
                  },
                  icon: const Icon(
                    Icons.close_rounded,
                    color: Color(0xFFCCCCCC),
                    size: 20,
                  ),
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(
              color: Color(0xFFEEEEEE),
              width: 1.5,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(
              color: Color(0xFFEEEEEE),
              width: 1.5,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(
              color: Color(0xFFD4A574),
              width: 2,
            ),
          ),
          filled: true,
          fillColor: const Color(0xFFFAFAFA),
          contentPadding:
              const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        ),
        style: const TextStyle(
          fontSize: 15,
          color: Color(0xFF1A1A1A),
        ),
      ),
    );
  }

  Widget _buildQuickFiltersBar() {
    return Container(
      color: const Color(0xFFFFFFFF),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          // Sort Dropdown
          Expanded(
            flex: 2,
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFEEEEEE)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButtonFormField<String>(
                initialValue: _sortBy,
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _sortBy = value;
                    });
                    _performSearch();
                  }
                },
                decoration: InputDecoration(
                  border: InputBorder.none,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  labelStyle: const TextStyle(color: Color(0xFFD4A574)),
                ),
                items: [
                  _buildDropdownMenuItem('newest', '🆕 Mới nhất'),
                  _buildDropdownMenuItem('oldest', '📅 Cũ nhất'),
                  _buildDropdownMenuItem('price_low', '💰 Giá thấp'),
                  _buildDropdownMenuItem('price_high', '💎 Giá cao'),
                ],
                icon: const Icon(
                  Icons.expand_more,
                  color: Color(0xFFD4A574),
                ),
                isExpanded: true,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Filter Button
          OutlinedButton.icon(
            onPressed: _showFiltersBottomSheet,
            icon: const Icon(Icons.filter_list, size: 18),
            label: const Text('Bộ lọc'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD4A574),
              side: const BorderSide(color: Color(0xFFD4A574)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Clear Filters (if any active)
          if (_selectedCategories.isNotEmpty ||
              _minPrice > 0 ||
              _maxPrice < 10000000)
            InkWell(
              onTap: _clearFilters,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEAEA),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFFCCCC)),
                ),
                child: const Icon(
                  Icons.refresh,
                  color: Color(0xFFE74C3C),
                  size: 18,
                ),
              ),
            ),
        ],
      ),
    );
  }

  DropdownMenuItem<String> _buildDropdownMenuItem(
      String value, String label) {
    return DropdownMenuItem(
      value: value,
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 13,
          color: Color(0xFF1A1A1A),
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    return Consumer<ProductProvider>(
      builder: (context, productProvider, child) {
        if (productProvider.isLoading && productProvider.searchResults.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircularProgressIndicator(
                  color: Color(0xFFD4A574),
                  strokeWidth: 3,
                ),
                const SizedBox(height: 16),
                Text(
                  'Đang tìm kiếm...',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF999999),
                  ),
                ),
              ],
            ),
          );
        }

        if (productProvider.error != null &&
            productProvider.searchResults.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFEAEA),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.error_outline,
                    size: 48,
                    color: Color(0xFFE74C3C),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Có lỗi xảy ra',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: const Color(0xFF1A1A1A),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    productProvider.error ?? 'Lỗi không xác định',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF999999),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _performSearch,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD4A574),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
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
          color: const Color(0xFFD4A574),
          child: GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.7,
            ),
            itemCount: searchResults.length +
                (productProvider.searchHasMore ? 1 : 0),
            itemBuilder: (context, index) {
              // Load more indicator
              if (index == searchResults.length) {
                // Trigger load more
                Future.microtask(() {
                  productProvider.loadMoreSearchResults();
                });
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFFD4A574),
                      strokeWidth: 2,
                    ),
                  ),
                );
              }

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
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8F0),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.search,
                size: 64,
                color: Color(0xFFD4A574),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Bắt đầu tìm kiếm',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: const Color(0xFF1A1A1A),
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'Nhập từ khóa để tìm kiếm sản phẩm yêu thích của bạn',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF999999),
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            // Suggestions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tìm kiếm phổ biến:',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFFAAAAAA),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildSuggestionChip('Nhẫn bạc'),
                      _buildSuggestionChip('Dây chuyền'),
                      _buildSuggestionChip('Vòng tay'),
                      _buildSuggestionChip('Bông tai'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionChip(String label) {
    return InkWell(
      onTap: () {
        _searchController.text = label;
        setState(() => _searchQuery = label);
        _performSearch();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF8F0),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFEDD5C3)),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFFD4A574),
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildNoResults() {
    return Center(
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.search_off,
                size: 64,
                color: Color(0xFFCCCCCC),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Không tìm thấy sản phẩm',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: const Color(0xFF1A1A1A),
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF999999),
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                OutlinedButton.icon(
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                    _debounceTimer?.cancel();
                  },
                  icon: const Icon(Icons.clear),
                  label: const Text('Xóa tìm kiếm'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFD4A574),
                    side: const BorderSide(color: Color(0xFFD4A574)),
                  ),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: _showFiltersBottomSheet,
                  icon: const Icon(Icons.filter_list),
                  label: const Text('Bộ lọc'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFD4A574),
                    side: const BorderSide(color: Color(0xFFD4A574)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showFiltersBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildFiltersBottomSheet(),
    );
  }

  Widget _buildFiltersBottomSheet() {
    return StatefulBuilder(
      builder: (BuildContext context, StateSetter setModalState) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.8,
          decoration: const BoxDecoration(
            color: Color(0xFFFAFAFA),
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
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
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1A1A1A),
                    ),
                  ),
                  InkWell(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEEEEE),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.close,
                        color: Color(0xFF1A1A1A),
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Price Range
                      Text(
                        'Khoảng giá',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1A1A1A),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Price Input Fields
                      Row(
                        children: [
                          Expanded(
                            child: _buildPriceInputField(
                              label: 'Từ',
                              value: _minPrice,
                              onChanged: (value) {
                                setModalState(() {
                                  _minPrice = value;
                                });
                                setState(() {
                                  _minPrice = value;
                                });
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildPriceInputField(
                              label: 'Đến',
                              value: _maxPrice,
                              onChanged: (value) {
                                setModalState(() {
                                  _maxPrice = value;
                                });
                                setState(() {
                                  _maxPrice = value;
                                });
                              },
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 20),

                      // Slider with better UX
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF8F0),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: const Color(0xFFEDD5C3),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            // Slider
                            RangeSlider(
                              values: RangeValues(_minPrice, _maxPrice),
                              min: 0,
                              max: 10000000,
                              divisions: 100,
                              activeColor: const Color(0xFFD4A574),
                              inactiveColor: const Color(0xFFEDD5C3),
                              labels: RangeLabels(
                                _formatPrice(_minPrice),
                                _formatPrice(_maxPrice),
                              ),
                              onChanged: (values) {
                                setModalState(() {
                                  _minPrice = values.start;
                                  _maxPrice = values.end;
                                });
                                setState(() {
                                  _minPrice = values.start;
                                  _maxPrice = values.end;
                                });
                              },
                            ),
                            const SizedBox(height: 16),
                            
                            // Display price range
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: const Color(0xFFEDD5C3),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Giá thấp nhất',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF999999),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _formatPrice(_minPrice),
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFFD4A574),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    height: 30,
                                    width: 1,
                                    color: const Color(0xFFEDD5C3),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      const Text(
                                        'Giá cao nhất',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF999999),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _formatPrice(_maxPrice),
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFFD4A574),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
              
              // Apply Filters Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _performSearch();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD4A574),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Áp dụng bộ lọc',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPriceInputField({
    required String label,
    required double value,
    required Function(double) onChanged,
  }) {
    final controller = TextEditingController(
      text: value > 0 ? (value / 1000).toStringAsFixed(0) : '',
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Color(0xFF999999),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          onChanged: (val) {
            if (val.isNotEmpty) {
              onChanged(double.parse(val) * 1000);
            }
          },
          decoration: InputDecoration(
            hintText: 'Nhập giá',
            hintStyle: const TextStyle(color: Color(0xFFCCCCCC)),
            suffixText: 'K',
            suffixStyle: const TextStyle(
              color: Color(0xFFD4A574),
              fontWeight: FontWeight.w600,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFEDD5C3)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFFEDD5C3)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFFD4A574),
                width: 2,
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 12,
            ),
            filled: true,
            fillColor: Colors.white,
          ),
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF1A1A1A),
          ),
        ),
      ],
    );
  }

  String _formatPrice(double price) {
    if (price >= 1000000) {
      return '${(price / 1000000).toStringAsFixed(1)}M₫';
    } else if (price >= 1000) {
      return '${(price / 1000).toStringAsFixed(0)}K₫';
    }
    return '${price.toStringAsFixed(0)}₫';
  }
}
