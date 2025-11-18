import 'package:flutter/foundation.dart';
import '../services/location_service.dart';

class LocationProvider extends ChangeNotifier {
  // Provinces
  List<Map<String, dynamic>> _provinces = [];
  bool _provincesLoading = false;
  String? _provincesError;

  List<Map<String, dynamic>> get provinces => _provinces;
  bool get provincesLoading => _provincesLoading;
  String? get provincesError => _provincesError;

  // Districts
  List<Map<String, dynamic>> _districts = [];
  bool _districtsLoading = false;
  String? _districtsError;

  List<Map<String, dynamic>> get districts => _districts;
  bool get districtsLoading => _districtsLoading;
  String? get districtsError => _districtsError;

  // Wards
  List<Map<String, dynamic>> _wards = [];
  bool _wardsLoading = false;
  String? _wardsError;

  List<Map<String, dynamic>> get wards => _wards;
  bool get wardsLoading => _wardsLoading;
  String? get wardsError => _wardsError;

  // Load provinces on init
  void loadProvinces() async {
    _provincesLoading = true;
    _provincesError = null;
    notifyListeners();

    try {
      _provinces = await LocationService.getProvinces();
      _provincesError = null;
    } catch (e) {
      _provincesError = e.toString();
      _provinces = [];
    } finally {
      _provincesLoading = false;
      notifyListeners();
    }
  }

  // Load districts by province
  Future<void> loadDistricts(String provinceCode) async {
    if (provinceCode.isEmpty) {
      _districts = [];
      _wards = [];
      notifyListeners();
      return;
    }

    _districtsLoading = true;
    _districtsError = null;
    _districts = [];
    _wards = [];
    notifyListeners();

    try {
      _districts = await LocationService.getDistricts(provinceCode);
      _districtsError = null;
    } catch (e) {
      _districtsError = e.toString();
      _districts = [];
    } finally {
      _districtsLoading = false;
      notifyListeners();
    }
  }

  // Load wards by district
  Future<void> loadWards(String districtCode) async {
    if (districtCode.isEmpty) {
      _wards = [];
      notifyListeners();
      return;
    }

    _wardsLoading = true;
    _wardsError = null;
    _wards = [];
    notifyListeners();

    try {
      _wards = await LocationService.getWards(districtCode);
      _wardsError = null;
    } catch (e) {
      _wardsError = e.toString();
      _wards = [];
    } finally {
      _wardsLoading = false;
      notifyListeners();
    }
  }

  // Helper function to find location name by code
  String findNameByCode(List<Map<String, dynamic>> locations, String code) {
    if (code.isEmpty) return '';
    try {
      final location = locations.firstWhere(
        (item) => item['code'] == code || item['id'] == code,
      );
      return location['name'] ?? '';
    } catch (e) {
      return '';
    }
  }

  // Reset all
  void reset() {
    _provinces = [];
    _provincesLoading = false;
    _provincesError = null;
    _districts = [];
    _districtsLoading = false;
    _districtsError = null;
    _wards = [];
    _wardsLoading = false;
    _wardsError = null;
    notifyListeners();
  }
}
