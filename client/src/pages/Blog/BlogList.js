import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import newsApi from '../../api/newsApi';
import newsCategoryApi from '../../api/newsCategoryApi';
import tagApi from '../../api/tagApi';
import MainLayout from '../../layout/MainLayout';
import HotNewsTicker from '../../components/HotNewsTicker';
import SearchPopover from '../../components/SearchPopover';

export default function BlogList() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total_pages: 1, total: 0, limit: 9 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [categories, setCategories] = useState([]);

  const [allTags, setAllTags] = useState([]);

  const [sp, setSp] = useSearchParams();
  const page = Math.max(1, Number(sp.get('page') || 1));
  const q = sp.get('q') || '';
  const article_category_id = sp.get('article_category_id') || '';
  const tags = sp.get('tags') || ''; // "ai,blockchain" hoặc "1,2"

  // Load danh mục tin & tags một lần
  useEffect(() => {
    (async () => {
      try {
        const [cats, tg] = await Promise.all([
          newsCategoryApi.getNewsCategories(),
          tagApi.getTags(),
        ]);

        const catsData = Array.isArray(cats) ? cats : (cats?.data ?? []);
        const tagsData = Array.isArray(tg) ? tg : (tg?.data ?? []);

        setCategories(catsData);
        setAllTags(tagsData);
      } catch (e) {
        console.error('Lỗi tải danh mục/tags:', e);
      }
    })();
  }, []);

  // Load danh sách bài viết theo bộ lọc
  useEffect(() => {
    setLoading(true);
    setErr(null);
    newsApi
      .getNews({
        page,
        limit: 9,
        status: 'published',
        q,
        article_category_id: article_category_id || undefined,
        tags: tags || undefined, // BE hỗ trợ slug hoặc id, nhiều giá trị phẩy
      })
      .then((res) => {
        const data = res?.data || [];
        const total = res?.meta?.total ?? data.length;
        const limit = 9;
        const total_pages = Math.max(1, Math.ceil(total / limit));
        setItems(data);
        setMeta({ page, total_pages, total, limit });
      })
      .catch((e) => setErr(e?.message || 'Lỗi tải dữ liệu'))
      .finally(() => setLoading(false));
  }, [page, q, article_category_id, tags]);

  const goPage = (p) =>
    setSp({
      page: String(p),
      ...(q ? { q } : {}),
      ...(article_category_id ? { article_category_id } : {}),
      ...(tags ? { tags } : {}),
    });

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const q2 = new FormData(e.currentTarget).get('q')?.toString().trim() || '';
    setSp({
      page: '1',
      ...(q2 ? { q: q2 } : {}),
      ...(article_category_id ? { article_category_id } : {}),
      ...(tags ? { tags } : {}),
    });
  };

  // Đổi danh mục
  const onChangeCategory = (e) => {
    const val = e.target.value;
    setSp({
      page: '1',
      ...(q ? { q } : {}),
      ...(val ? { article_category_id: val } : {}),
      ...(tags ? { tags } : {}),
    });
  };

  // Đổi tags (multi-select)
  const onChangeTags = (e) => {
    const arr = Array.from(e.target.selectedOptions).map((o) => o.value);
    const value = arr.join(',');
    setSp({
      page: '1',
      ...(q ? { q } : {}),
      ...(article_category_id ? { article_category_id } : {}),
      ...(value ? { tags: value } : {}),
    });
  };

  return (
    <MainLayout>
      <HotNewsTicker />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Tin tức</h1>
          {/* Bộ lọc */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Danh mục */}
            <select
              value={article_category_id}
              onChange={onChangeCategory}
              className="h-10 rounded-full border px-3 text-sm bg-white"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.article_category_id} value={c.article_category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>

            {/* Tags (chip toggle) */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tag:</span>
              <div className="flex gap-2 overflow-x-auto max-w-[520px] py-1">
                {allTags.map((t) => {
                  const selected = (tags ? tags.split(',') : []).includes(t.slug); // hoặc t.tag_id
                  return (
                    <button
                      key={t.tag_id}
                      type="button"
                      onClick={() => {
                        const cur = new Set(tags ? tags.split(',') : []);
                        if (selected) cur.delete(t.slug);
                        else cur.add(t.slug);
                        const next = Array.from(cur).filter(Boolean).join(',');
                        setSp({
                          page: '1',
                          ...(q ? { q } : {}),
                          ...(article_category_id ? { article_category_id } : {}),
                          ...(next ? { tags: next } : {}),
                        });
                      }}
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition
              ${selected ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white hover:bg-gray-50'}`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon kính lúp + popover */}
            <SearchPopover
              defaultValue={q}
              onSubmit={(keyword) => {
                setSp({
                  page: '1',
                  ...(keyword ? { q: keyword } : {}),
                  ...(article_category_id ? { article_category_id } : {}),
                  ...(tags ? { tags } : {}),
                });
              }}
            />
          </div>
        </div>

        {loading && <div>Đang tải bài viết…</div>}
        {err && <div className="text-red-600">{err}</div>}

        {!loading && !err && items.length === 0 && <div>Không có bài viết phù hợp.</div>}

        {!loading && !err && items.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const href = `/tin-tuc/${item.slug}`;
                const img = item.thumbnail_url || '/placeholder.jpg';
                const cat = item.category?.category_name;
                const dateStr = item.published_at
                  ? dayjs(item.published_at).format('DD/MM/YYYY')
                  : '';
                return (
                  <Link
                    key={item.article_id || item.slug}
                    to={href}
                    className="group overflow-hidden rounded-2xl border bg-white shadow hover:shadow-lg"
                  >
                    <div className="relative h-44 w-full bg-gray-100">
                      <img
                        src={img}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.jpg';
                        }}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{cat || '—'}</span>
                        <span>{dateStr}</span>
                      </div>
                      <h3 className="mt-1 line-clamp-2 font-medium">{item.title}</h3>
                      {item.excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.excerpt}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                disabled={meta.page <= 1}
                onClick={() => goPage(meta.page - 1)}
                className="rounded-full border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                ← Trước
              </button>
              <span className="text-sm">
                Trang {meta.page}/{meta.total_pages}
              </span>
              <button
                disabled={meta.page >= meta.total_pages}
                onClick={() => goPage(meta.page + 1)}
                className="rounded-full border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau →
              </button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
