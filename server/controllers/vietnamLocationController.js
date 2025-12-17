import axios from 'axios';

// https://provinces.open-api.vn/ (current) exposes REST endpoints under `/api/v1`:
// - /api/v1/ (provinces list, supports `depth` query)
// - /api/v1/p/ (provinces list)
// - /api/v1/p/:code?depth=2 (province with districts)
// - /api/v1/d/:code?depth=2 (district with wards)
const API_BASE_URL = 'https://provinces.open-api.vn/api/v1';

// Fallback data source (when provinces.open-api.vn is down/502).
// Dataset: https://github.com/madnh/hanhchinhvn
const FALLBACK_BASE_URL = 'https://raw.githubusercontent.com/madnh/hanhchinhvn/master/dist';
const FALLBACK_TTL_MS = 24 * 60 * 60 * 1000;

const fallbackCache = {
  provinces: { expiresAt: 0, list: null },
  districts: { expiresAt: 0, byProvince: null },
  wards: { expiresAt: 0, byDistrict: null },
};

function toCodeNumber(value) {
  const code = Number.parseInt(String(value), 10);
  return Number.isFinite(code) ? code : null;
}

function toLocationItem(record) {
  return {
    code: toCodeNumber(record.code),
    name: record.name_with_type ?? record.name,
  };
}

async function fetchFallbackJson(path) {
  const url = `${FALLBACK_BASE_URL}/${path}`;
  const response = await axios.get(url, { timeout: 15_000 });
  return response.data;
}

async function getFallbackProvinces() {
  const now = Date.now();
  if (fallbackCache.provinces.list && fallbackCache.provinces.expiresAt > now) {
    return fallbackCache.provinces.list;
  }

  const data = await fetchFallbackJson('tinh_tp.json');
  const list = Object.values(data)
    .map(toLocationItem)
    .filter((item) => item.code !== null)
    .sort((a, b) => a.code - b.code);

  fallbackCache.provinces = { list, expiresAt: now + FALLBACK_TTL_MS };
  return list;
}

async function getFallbackDistrictsByProvince(provinceCode) {
  const provinceNumber = toCodeNumber(provinceCode);
  if (provinceNumber === null) return [];

  const now = Date.now();
  if (!fallbackCache.districts.byProvince || fallbackCache.districts.expiresAt <= now) {
    const data = await fetchFallbackJson('quan_huyen.json');
    const byProvince = new Map();

    for (const record of Object.values(data)) {
      const parentNumber = toCodeNumber(record.parent_code);
      const item = toLocationItem(record);
      if (parentNumber === null || item.code === null) continue;

      const list = byProvince.get(parentNumber) ?? [];
      list.push(item);
      byProvince.set(parentNumber, list);
    }

    for (const list of byProvince.values()) {
      list.sort((a, b) => a.code - b.code);
    }

    fallbackCache.districts = { byProvince, expiresAt: now + FALLBACK_TTL_MS };
  }

  return fallbackCache.districts.byProvince.get(provinceNumber) ?? [];
}

async function getFallbackWardsByDistrict(districtCode) {
  const districtNumber = toCodeNumber(districtCode);
  if (districtNumber === null) return [];

  const now = Date.now();
  if (!fallbackCache.wards.byDistrict || fallbackCache.wards.expiresAt <= now) {
    const data = await fetchFallbackJson('xa_phuong.json');
    const byDistrict = new Map();

    for (const record of Object.values(data)) {
      const parentNumber = toCodeNumber(record.parent_code);
      const item = toLocationItem(record);
      if (parentNumber === null || item.code === null) continue;

      const list = byDistrict.get(parentNumber) ?? [];
      list.push(item);
      byDistrict.set(parentNumber, list);
    }

    for (const list of byDistrict.values()) {
      list.sort((a, b) => a.code - b.code);
    }

    fallbackCache.wards = { byDistrict, expiresAt: now + FALLBACK_TTL_MS };
  }

  return fallbackCache.wards.byDistrict.get(districtNumber) ?? [];
}

async function getFirstOk(urls, config) {
  let lastError;
  for (const url of urls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await axios.get(url, config);
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status === 404) continue;
      break;
    }
  }
  throw lastError;
}

/**
 * Lấy danh sách tỉnh/thành phố
 */
export async function getProvinces(req, res) {
  try {
    const depth = Number(req.query?.depth ?? 1);
    const safeDepth = Number.isFinite(depth) && depth >= 1 && depth <= 3 ? depth : 1;

    const response = await getFirstOk([`${API_BASE_URL}/`, `${API_BASE_URL}/p/`], {
      params: { depth: safeDepth },
    });
    res.set('X-VN-Location-Source', 'provinces.open-api.vn');
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching provinces from provinces.open-api.vn:', error.message);
    try {
      const list = await getFallbackProvinces();
      res.set('X-VN-Location-Source', 'hanhchinhvn (fallback)');
      return res.json(list);
    } catch (fallbackError) {
      console.error('Error fetching provinces fallback:', fallbackError.message);
      return res.status(502).json({ error: 'Lấy danh sách tỉnh/thành thất bại' });
    }
  }
}

/**
 * Lấy danh sách quận/huyện theo tỉnh/thành
 */
export async function getDistrictsByProvince(req, res) {
  const { provinceCode } = req.params;

  if (!provinceCode) {
    return res.status(400).json({ error: 'Thiếu mã tỉnh/thành' });
  }

  try {
    const response = await getFirstOk(
      [`${API_BASE_URL}/p/${provinceCode}`, `${API_BASE_URL}/${provinceCode}`],
      { params: { depth: 2 } }
    );
    const districts = response.data.districts || [];
    res.set('X-VN-Location-Source', 'provinces.open-api.vn');
    return res.json(districts);
  } catch (error) {
    console.error(`Error fetching districts for province ${provinceCode} from provinces.open-api.vn:`, error.message);
    try {
      const list = await getFallbackDistrictsByProvince(provinceCode);
      res.set('X-VN-Location-Source', 'hanhchinhvn (fallback)');
      return res.json(list);
    } catch (fallbackError) {
      console.error(`Error fetching districts fallback for province ${provinceCode}:`, fallbackError.message);
      return res.status(502).json({ error: 'Lấy danh sách quận/huyện thất bại' });
    }
  }
}

/**
 * Lấy danh sách phường/xã theo quận/huyện
 */
export async function getWardsByDistrict(req, res) {
  const { districtCode } = req.params;

  if (!districtCode) {
    return res.status(400).json({ error: 'Thiếu mã quận/huyện' });
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/d/${districtCode}`, { params: { depth: 2 } });
    const wards = response.data.wards || [];
    res.set('X-VN-Location-Source', 'provinces.open-api.vn');
    return res.json(wards);
  } catch (error) {
    console.error(`Error fetching wards for district ${districtCode} from provinces.open-api.vn:`, error.message);
    try {
      const list = await getFallbackWardsByDistrict(districtCode);
      res.set('X-VN-Location-Source', 'hanhchinhvn (fallback)');
      return res.json(list);
    } catch (fallbackError) {
      console.error(`Error fetching wards fallback for district ${districtCode}:`, fallbackError.message);
      return res.status(502).json({ error: 'Lấy danh sách phường/xã thất bại' });
    }
  }
}
