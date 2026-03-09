import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { localDB } from '../../utils/indexedDB';
import Button from '../../components/ui/Button';

// ── Shield icon ──
const ShieldIcon = () => (
  <svg width="28" height="33" viewBox="0 0 36 42" fill="none">
    <path d="M18 2L3 8V22C3 31 10 38.5 18 41C26 38.5 33 31 33 22V8L18 2Z" fill="#0A2463" stroke="#C9A84C" strokeWidth="1.5" />
    <path d="M18 7L7 12V22C7 28.5 12 34 18 36C24 34 29 28.5 29 22V12L18 7Z" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
    <line x1="18" y1="11" x2="18" y2="33" stroke="#C9A84C" strokeWidth="1.2" opacity="0.8" />
    <line x1="9" y1="20" x2="27" y2="20" stroke="#C9A84C" strokeWidth="1.2" opacity="0.8" />
    <circle cx="18" cy="20" r="2.5" fill="#C9A84C" opacity="0.9" />
  </svg>
);

// ── Level badge helper ──
const levelBadgeClass = (level = '') => {
  const l = level.toUpperCase();
  if (l.startsWith('A')) return 'bg-green-50 text-green-700 border border-green-200';
  if (l.startsWith('B')) return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (l.startsWith('C')) return 'bg-purple-50 text-purple-700 border border-purple-200';
  return 'border border-gray-200 text-gray-500';
};

// ── Reusable rule dividers ──
const RedRule = ({ opacity = 1 }) => <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #BF0A30 25%, #BF0A30 75%, transparent)', opacity }} />;
const GoldRule = () => <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #C8B99A 30%, #C8B99A 70%, transparent)' }} />;

// ─────────────────────────────────────────────
// DETAIL CONTENT — shared antara side panel & bottom sheet
// ─────────────────────────────────────────────
const DetailContent = ({ item, relatedItems, onClose, onSelectRelated, langMode }) => (
  <div className="p-6 flex flex-col gap-5">
    {/* Header */}
    <div className="flex items-center justify-between">
      <span style={{ color: '#C9A84C', letterSpacing: 6, fontSize: 10 }}>✦ ✦ ✦</span>
      <button
        onClick={onClose}
        className="p-1.5 rounded-sm transition-colors"
        style={{ color: '#6B5A42' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE4CC')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    {/* Term + Level */}
    <div className="flex items-start justify-between">
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0A2463', fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{item.term}</h2>
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-sm flex-shrink-0 ml-3 mt-1 ${levelBadgeClass(item.level)}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {item.level || '—'}
      </span>
    </div>

    {/* Category + Sub */}
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B5A42', fontFamily: "'DM Sans', sans-serif" }}>
        {item.category}
      </span>
      <span style={{ color: '#C8B99A' }}>•</span>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0A2463', fontFamily: "'DM Sans', sans-serif" }}>
        {item.sub_category}
      </span>
    </div>

    <GoldRule />

    {/* Definition */}
    <div className="space-y-4">
      {(langMode === 'EN' || langMode === 'BOTH') && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60" style={{ color: '#6B5A42', fontFamily: "'DM Sans', sans-serif" }}>
            Definition (EN)
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#2C1F0E', fontFamily: "'DM Sans', sans-serif" }}>
            {item.definition}
          </p>
        </div>
      )}

      {(langMode === 'ID' || langMode === 'BOTH') && item.definition_bahasa && (
        <div className="pt-1">
          <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60" style={{ color: '#BF0A30', fontFamily: "'DM Sans', sans-serif" }}>
            Definisi (ID)
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#2C1F0E', fontFamily: "'DM Sans', sans-serif" }}>
            {item.definition_bahasa}
          </p>
        </div>
      )}
    </div>

    {/* Example sentence */}
    {(item.example_sentence || item.example_sentence_bahasa) && (
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#6B5A42', fontFamily: "'DM Sans', sans-serif" }}>
          Contoh / Examples
        </p>
        <div className="px-4 py-3 rounded-r-sm space-y-3" style={{ background: '#EDE4CC', borderLeft: '3px solid #C9A84C' }}>
          {(langMode === 'EN' || langMode === 'BOTH') && item.example_sentence && (
            <p className="text-sm italic leading-relaxed" style={{ fontFamily: "'IM Fell English', serif", color: '#6B5A42' }}>
              "{item.example_sentence}"
            </p>
          )}
          {(langMode === 'ID' || langMode === 'BOTH') && item.example_sentence_bahasa && (
            <p className="text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", color: '#2C1F0E', opacity: 0.8 }}>
              "{item.example_sentence_bahasa}"
            </p>
          )}
        </div>
      </div>
    )}

    <GoldRule />

    {/* Related terms */}
    {relatedItems.length > 0 && (
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#6B5A42', fontFamily: "'DM Sans', sans-serif" }}>
          Istilah Terkait
        </p>
        <div className="flex flex-wrap gap-2">
          {relatedItems.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectRelated(r)}
              className="px-3 py-1.5 text-xs font-semibold rounded-sm transition-all"
              style={{ background: '#EDE4CC', border: '1px solid #C8B99A', color: '#2C1F0E', fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0A2463';
                e.currentTarget.style.color = '#0A2463';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#C8B99A';
                e.currentTarget.style.color = '#2C1F0E';
              }}
            >
              {r.term}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const Dictionary = () => {
  // ── Semua state asli (tidak diubah) ──
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [langMode, setLangMode] = useState('BOTH'); // EN, ID, BOTH
  const [displayLimit, setDisplayLimit] = useState(24);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // ── State baru: hanya ini yang ditambahkan ──
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    initData();
    window.addEventListener('scroll', handleScroll);

    const handleOnline = () => syncWithRemote();
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setDisplayLimit(24); // Reset pagination on search
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
      setDisplayLimit((prev) => prev + 12);
    }
  };

  // ── Semua fungsi asli tidak diubah ──
  const initData = async () => {
    try {
      setLoading(true);
      const localData = await localDB.getMaterials();
      if (localData.length > 0) {
        setMaterials(localData);
        setLoading(false);
      }
      syncWithRemote();
    } catch (error) {
      console.error('Error init dictionary:', error);
      setLoading(false);
    }
  };

  const syncWithRemote = async () => {
    try {
      setSyncStatus('syncing');
      const lastSync = localStorage.getItem('scholara_dict_last_sync');

      const { data, error } = await db.getLearningMaterials(null, lastSync);
      if (error) throw error;

      if (data && data.length > 0) {
        // Merge with existing local data if it's a delta sync
        if (lastSync) {
          const currentLocal = await localDB.getMaterials();
          const merged = [...currentLocal];
          data.forEach((newItem) => {
            const idx = merged.findIndex((m) => m.id === newItem.id);
            if (idx > -1) merged[idx] = newItem;
            else merged.push(newItem);
          });
          await localDB.saveMaterials(merged);
          setMaterials(merged);
        } else {
          await localDB.saveMaterials(data);
          setMaterials(data);
        }

        // Save newest timestamp
        const newest = data.reduce((a, b) => (a.updated_at > b.updated_at ? a : b)).updated_at;
        localStorage.setItem('scholara_dict_last_sync', newest);

        setSyncStatus('complete');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('idle');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const term = m.term.toLowerCase();
    const def = m.definition?.toLowerCase() || '';
    const defId = m.definition_bahasa?.toLowerCase() || '';
    const s = debouncedSearchTerm.toLowerCase();

    const matchesSearch = term.includes(s) || def.includes(s) || defId.includes(s);
    const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const displayedMaterials = filteredMaterials.slice(0, displayLimit);

  const categories = ['All', 'Vocabulary', 'Grammar', 'Phrases'];

  // ── Handler baru: buka/tutup/navigasi detail ──
  const openDetail = (item) => setSelectedItem(item);
  const closeDetail = () => setSelectedItem(null);
  const selectRelated = (item) => setSelectedItem(item);

  const relatedItems = selectedItem ? materials.filter((m) => m.category === selectedItem.category && m.id !== selectedItem.id).slice(0, 5) : [];

  const isPanelOpen = !!selectedItem;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans', sans-serif" }}>
      {/* ══ OVERLAY ══ */}
      <div
        onClick={closeDetail}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(10,36,99,0.25)',
          backdropFilter: 'blur(1px)',
          opacity: isPanelOpen ? 1 : 0,
          pointerEvents: isPanelOpen ? 'auto' : 'none',
        }}
      />

      {/* ══ SIDE PANEL — Desktop only (md ke atas) ══ */}
      <aside
        className="fixed top-0 right-0 h-full z-50 overflow-y-auto hidden md:block"
        style={{
          width: 420,
          background: '#FAF6EC',
          border: '1px solid #C9A84C',
          boxShadow: '-4px 0 32px rgba(10,36,99,0.15)',
          transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <RedRule />
        {selectedItem && <DetailContent item={selectedItem} relatedItems={relatedItems} onClose={closeDetail} onSelectRelated={selectRelated} langMode={langMode} />}
        <RedRule />
      </aside>

      {/* ══ BOTTOM SHEET — Mobile only (di bawah md) ══ */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 overflow-y-auto block md:hidden"
        style={{
          maxHeight: '88vh',
          background: '#FAF6EC',
          boxShadow: '0 -4px 32px rgba(10,36,99,0.2)',
          borderRadius: '20px 20px 0 0',
          transform: isPanelOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <RedRule />
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C8B99A' }} />
        </div>
        {selectedItem && <DetailContent item={selectedItem} relatedItems={relatedItems} onClose={closeDetail} onSelectRelated={selectRelated} langMode={langMode} />}
      </div>

      {/* ══════════ STICKY HEADER ══════════ */}
      <header
        className="sticky top-0 z-30 shadow-lg"
        style={{
          backgroundColor: '#0A2463',
          backgroundImage: `
          repeating-linear-gradient(0deg,  rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 36px),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 36px)
        `,
        }}
      >
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #C9A84C 25%, #C9A84C 75%, transparent)' }} />

        <div className="max-w-5xl mx-auto px-4 py-5">
          {/* Row 1: Branding + Sync */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <ShieldIcon size={24} />
              <div className="min-w-0">
                <h1 className="text-white text-base md:text-xl font-bold leading-none truncate" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Kamus Scholara
                </h1>
                <p className="hidden xs:block text-[10px] md:text-xs italic opacity-75 mt-0.5" style={{ fontFamily: "'IM Fell English', serif", color: '#C9A84C' }}>
                  "Gold of the mind."
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={() => setLangMode((l) => (l === 'EN' ? 'ID' : l === 'ID' ? 'BOTH' : 'EN'))}
                className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-sm border text-[9px] md:text-[10px] font-bold tracking-widest transition-all"
                style={{
                  color: '#C9A84C',
                  borderColor: 'rgba(201,168,76,0.3)',
                  backgroundColor: 'rgba(201,168,76,0.05)',
                }}
              >
                🌍 {langMode}
              </button>

              {syncStatus === 'syncing' && (
                <div
                  className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest animate-pulse px-2 py-1 rounded-full border"
                  style={{ color: '#93C5FD', backgroundColor: 'rgba(147,197,253,0.1)', borderColor: 'rgba(147,197,253,0.2)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
                  <span className="hidden sm:inline">SYNCING</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Search + Dropdown */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#A8946C' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Cari kata atau konsep belajar..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-sm transition-all"
                style={{ background: '#EDE4CC', border: '1px solid #C8B99A', color: '#2C1F0E', outline: 'none' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1A4FAD';
                  e.target.style.background = '#F2ECD8';
                  e.target.style.boxShadow = '0 0 0 3px rgba(26,79,173,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#C8B99A';
                  e.target.style.background = '#EDE4CC';
                  e.target.style.boxShadow = 'none';
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full md:w-48 px-4 py-2.5 text-white text-sm font-bold flex items-center justify-between rounded-sm transition-all"
                style={{ background: '#1A4FAD' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#2460C8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#1A4FAD')}
              >
                <span>{activeCategory}</span>
                <span style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 w-full mt-1 z-40 overflow-hidden rounded-sm shadow-2xl" style={{ background: '#FAF6EC', border: '1px solid #C9A84C' }}>
                  <RedRule />
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-5 py-3 text-sm font-bold transition-colors"
                      style={{
                        color: activeCategory === cat ? '#0A2463' : '#6B5A42',
                        background: activeCategory === cat ? '#EDE4CC' : 'transparent',
                        borderLeft: activeCategory === cat ? '3px solid #0A2463' : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (activeCategory !== cat) e.currentTarget.style.background = '#F2ECD8';
                      }}
                      onMouseLeave={(e) => {
                        if (activeCategory !== cat) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <RedRule />
      </header>

      {/* ══════════ CARD GRID ══════════ */}
      <div className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Loading */}
        {loading && materials.length === 0 ? (
          <div className="col-span-full py-24 text-center">
            <div className="text-5xl mb-4 opacity-40" style={{ color: '#C9A84C' }}>
              📖
            </div>
            <p className="text-lg italic uppercase tracking-widest" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#6B5A42' }}>
              Membuka lembaran pustaka...
            </p>
          </div>
        ) : displayedMaterials.length > 0 ? (
          displayedMaterials.map((m) => {
            const isActive = selectedItem?.id === m.id;
            return (
              <div
                key={m.id}
                onClick={() => openDetail(m)}
                className="group flex flex-col rounded-sm overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: isActive ? '#EDE4CC' : '#FAF6EC',
                  border: `1px solid ${isActive ? '#1A4FAD' : '#C8B99A'}`,
                  boxShadow: isActive ? '0 0 0 2px rgba(26,79,173,0.2)' : '0 1px 3px rgba(10,36,99,0.06)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#1A4FAD';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(10,36,99,0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#C8B99A';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(10,36,99,0.06)';
                  }
                }}
              >
                {/* Crimson top rule */}
                <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #BF0A30 25%, #BF0A30 75%, transparent)', opacity: 0.6 }} />

                <div className="p-5 flex flex-col flex-1">
                  {/* Term + Level */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", color: isActive ? '#BF0A30' : '#0A2463' }}>
                      {m.term}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm flex-shrink-0 ml-2 mt-0.5 ${levelBadgeClass(m.level)}`}>{m.level || 'B1'}</span>
                  </div>

                  {/* Category + Sub */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm" style={{ background: 'rgba(10,36,99,0.06)', color: '#0A2463', border: '1px solid rgba(10,36,99,0.12)' }}>
                      {m.category}
                    </span>
                    {m.sub_category && (
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm" style={{ background: 'rgba(201,168,76,0.08)', color: '#A8893A', border: '1px solid rgba(201,168,76,0.2)' }}>
                        {m.sub_category}
                      </span>
                    )}
                  </div>

                  {/* Definition */}
                  <div className="space-y-2 mb-5 flex-1">
                    {(langMode === 'EN' || langMode === 'BOTH') && (
                      <p className="text-sm leading-relaxed" style={{ color: '#2C1F0E', opacity: 0.85 }}>
                        {m.definition}
                      </p>
                    )}
                    {(langMode === 'ID' || langMode === 'BOTH') && m.definition_bahasa && (
                      <p className="text-sm leading-relaxed border-l-2 border-crimson/20 pl-3 italic" style={{ color: '#2C1F0E', opacity: 0.7 }}>
                        {m.definition_bahasa}
                      </p>
                    )}
                  </div>

                  {/* Example */}
                  {(m.example_sentence || m.example_sentence_bahasa) && (
                    <div className="px-4 py-3 rounded-r-sm mt-auto" style={{ background: '#EDE4CC', borderLeft: '3px solid #C9A84C' }}>
                      {(langMode === 'EN' || langMode === 'BOTH') && m.example_sentence && (
                        <p className="text-xs leading-relaxed italic mb-1" style={{ fontFamily: "'IM Fell English', serif", color: '#6B5A42' }}>
                          "{m.example_sentence}"
                        </p>
                      )}
                      {(langMode === 'ID' || langMode === 'BOTH') && m.example_sentence_bahasa && (
                        <p className="text-[11px] leading-relaxed opacity-70" style={{ color: '#2C1F0E' }}>
                          "{m.example_sentence_bahasa}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="px-5 py-2.5 flex justify-between items-center" style={{ background: '#EDE4CC', borderTop: '1px solid #C8B99A' }}>
                  <button
                    className="text-[10px] font-bold flex items-center gap-1.5 transition-colors"
                    style={{ color: '#0A2463' }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#BF0A30')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#0A2463')}
                  >
                    <span>🔊</span> HEAR
                  </button>
                  <span style={{ color: '#C9A84C', letterSpacing: '4px', fontSize: 9 }}>✦ ✦</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-sm overflow-hidden" style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
            <RedRule opacity={0.5} />
            <div className="py-16 px-8 text-center">
              <p className="text-xl italic opacity-60" style={{ fontFamily: "'IM Fell English', serif", color: '#6B5A42' }}>
                Maaf, pencarian untuk "{searchTerm}" belum ditemukan dalam arsip kami ✦
              </p>
            </div>
          </div>
        )}

        {/* Loading more indicator */}
        {displayLimit < filteredMaterials.length && (
          <div className="col-span-full py-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-crimson/20 border-t-crimson rounded-full animate-spin" />
            <p className="text-[10px] font-bold tracking-widest text-crimson mt-2 opacity-60">MEMUAT LEBIH BANYAK...</p>
          </div>
        )}
      </div>

      {/* ══ FLOATING BACK BUTTON ══ */}
      <div className="fixed bottom-24 md:bottom-8 right-6 z-20">
        <button
          onClick={() => window.history.back()}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{ background: '#0A2463', color: 'white', border: '2px solid #C9A84C', boxShadow: '0 8px 24px rgba(10,36,99,0.3)' }}
        >
          <span className="text-xl">←</span>
        </button>
      </div>
    </div>
  );
};

export default Dictionary;
