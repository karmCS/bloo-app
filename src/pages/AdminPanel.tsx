import { useState, useEffect, useMemo, useRef } from 'react';
import { useClerk, useUser, useSession } from '@clerk/react';
import { supabase, Meal } from '../lib/supabase';
import { getSupabaseWithAuth } from '../lib/supabaseWithAuth';
import { assertValidImage, extFor, errorMessage } from '../lib/uploads';
import { useMeals } from '../hooks/useMeals';
import { useReveal } from '../hooks/useReveal';
import { useCountUp } from '../hooks/useCountUp';
import Button from '../components/Button';
import ImageUpload from '../components/ImageUpload';
import DietaryTagPicker from '../components/DietaryTagPicker';
import { Trash2, Plus, LogOut, ChevronDown, UtensilsCrossed, BarChart2, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function CountUpStat({ target, label }: { target: number; label: string }) {
  const { ref, value } = useCountUp(target);
  return (
    <div className="bg-card rounded-2xl border border-line p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">{label}</div>
      <div ref={ref as React.RefObject<HTMLDivElement>} className="font-display text-3xl font-semibold text-ink truncate">{value}</div>
    </div>
  );
}

function MealsByVendor({ card, activeVendors, meals }: { card: string; activeVendors: { id: string; name: string }[]; meals: Meal[] }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`${card} reveal`}>
      <div className="px-6 py-4 border-b border-line">
        <h3 className="font-display text-lg font-semibold text-ink">Meals by vendor</h3>
      </div>
      {activeVendors.length === 0 ? (
        <div className="p-10 text-center text-ink-muted text-sm">No vendors yet.</div>
      ) : (
        <div className="divide-y divide-line">
          {activeVendors.map((v, i) => {
            const count = meals.filter(m => m.vendor_id === v.id).length;
            const pct = meals.length ? Math.round((count / meals.length) * 100) : 0;
            return (
              <div key={v.id} className="flex items-center gap-4 px-6 py-4">
                <span className="text-sm font-medium text-ink w-40 truncate">{v.name}</span>
                <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full pulse-bar"
                    style={{ ['--w' as any]: `${pct}%`, transitionDelay: `${i * 80}ms` }}
                  />
                </div>
                <span className="text-sm font-semibold text-ink w-16 text-right">{count} meals</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentlyAdded({ card, meals }: { card: string; meals: Meal[] }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`${card} reveal`}>
      <div className="px-6 py-4 border-b border-line">
        <h3 className="font-display text-lg font-semibold text-ink">Recently added</h3>
      </div>
      <div className="divide-y divide-line reveal stagger in">
        {meals.map(meal => (
          <div key={meal.id} className="flex items-center gap-4 px-6 py-3">
            <img src={meal.image_url} alt={meal.name} className="w-10 h-10 rounded-lg object-cover border border-line" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{meal.name}</p>
              <p className="text-xs text-ink-muted">{meal.vendor}</p>
            </div>
            <span className="text-xs text-ink-faint">{meal.calories} cal</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Vendor {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
  venmo_handle: string | null;
  zelle_contact: string | null;
  cuisine_tags: string[] | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface VendorUser {
  id: string;
  clerk_user_id: string | null;
  email: string | null;
  display_name: string;
  role: 'superadmin' | 'vendor';
  vendor_id: string | null;
  vendors: { name: string } | null;
  created_at: string;
}

const INPUT = 'w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors';
const LABEL = 'block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5';

const TABS = ['pulse', 'meals', 'team'] as const;
type Tab = typeof TABS[number];

export default function AdminPanel() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { session } = useSession();
  const { meals, refetch } = useMeals();

  const [activeTab, setActiveTab] = useState<Tab>('meals');
  const tabRowRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ pulse: null, meals: null, team: null });
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const update = () => {
      const row = tabRowRef.current;
      const tab = tabRefs.current[activeTab];
      if (!row || !tab) return;
      const r = tab.getBoundingClientRect();
      const p = row.getBoundingClientRect();
      setIndicator({ left: r.left - p.left, width: r.width });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [activeTab]);

  // ── Meals ────────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mealsVendorFilterId, setMealsVendorFilterId] = useState<string | null>(null);
  const [activeVendors, setActiveVendors] = useState<{ id: string; name: string }[]>([]);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [macroInput, setMacroInput] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [macroError, setMacroError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', vendor: '', vendor_id: '', description: '', image_url: '',
    price: '', calories: '', protein: '', carbs: '', fats: '',
    ingredients: '', dietary_tags: [] as string[], is_meal_of_week: false,
  });

  const estimateMacros = async () => {
    if (!macroInput.trim()) return;
    setIsEstimating(true);
    setMacroError(null);
    try {
      const res = await fetch('/api/estimate-macros', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ingredients: macroInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(d => ({
          ...d,
          calories: String(data.calories ?? ''),
          protein: String(data.protein ?? ''),
          carbs: String(data.carbs ?? ''),
          fats: String(data.fats ?? ''),
        }));
        setMacroError(null);
        setShowMacroModal(false);
        setMacroInput('');
      } else if (res.status === 400) {
        setMacroError(data.error ?? 'Please enter food ingredients only.');
      } else {
        setMacroError('Estimation failed — please try again.');
      }
    } catch {
      setMacroError('Estimation failed — please try again.');
    } finally {
      setIsEstimating(false);
    }
  };

  // ── Team ─────────────────────────────────────────────────────────────────
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorUsers, setVendorUsers] = useState<VendorUser[]>([]);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showSuperadminForm, setShowSuperadminForm] = useState(false);
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [expandedSuperadminId, setExpandedSuperadminId] = useState<string | null>(null);
  const [showVendorMemberFormVendorId, setShowVendorMemberFormVendorId] = useState<string | null>(null);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editVendorFormData, setEditVendorFormData] = useState({ name: '', slug: '', contact_email: '', venmo_handle: '', zelle_contact: '', description: '', logo_url: '' });
  const [editVendorLogoFile, setEditVendorLogoFile] = useState<File | null>(null);
  const [vendorFormData, setVendorFormData] = useState({ name: '', slug: '', contact_email: '', venmo_handle: '', zelle_contact: '', description: '', logo_url: '' });
  const [vendorLogoFile, setVendorLogoFile] = useState<File | null>(null);
  const [superadminFormData, setSuperadminFormData] = useState({ clerk_user_id: '', display_name: '' });
  const [vendorMemberFormData, setVendorMemberFormData] = useState({ email: '', display_name: '' });
  const [vendorUpdateLoading, setVendorUpdateLoading] = useState(false);
  const [vendorFormLoading, setVendorFormLoading] = useState(false);
  const [superadminFormLoading, setSuperadminFormLoading] = useState(false);
  const [vendorMemberFormLoading, setVendorMemberFormLoading] = useState(false);

  const superadmins = useMemo(() => vendorUsers.filter(u => u.role === 'superadmin'), [vendorUsers]);
  const vendorMembersByVendorId = useMemo(() => {
    const map = new Map<string, VendorUser[]>();
    for (const u of vendorUsers) {
      if (u.role !== 'vendor' || !u.vendor_id) continue;
      map.set(u.vendor_id, [...(map.get(u.vendor_id) ?? []), u]);
    }
    return map;
  }, [vendorUsers]);

  const filteredMeals = useMemo(() =>
    mealsVendorFilterId ? meals.filter(m => m.vendor_id === mealsVendorFilterId) : meals,
    [meals, mealsVendorFilterId]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    getSupabaseWithAuth(session).then(client =>
      client.from('vendors').select('id, name').eq('is_active', true).order('name')
        .then(({ data }) => { if (data) setActiveVendors(data); })
    );
  }, [session]);

  const fetchTeamData = async () => {
    if (!session) return;
    const client = await getSupabaseWithAuth(session);
    const [{ data: vData }, { data: uData }] = await Promise.all([
      client.from('vendors').select('*').order('name'),
      client.from('vendor_users').select('id, clerk_user_id, email, display_name, role, vendor_id, created_at, vendors(name)').order('role'),
    ]);
    if (vData) setVendors(vData as Vendor[]);
    if (uData) setVendorUsers(uData as unknown as VendorUser[]);
  };

  useEffect(() => {
    if (activeTab === 'team' && session) fetchTeamData();
  }, [activeTab, session]);

  // ── Meal handlers ─────────────────────────────────────────────────────────
  const uploadImage = async (file: File) => {
    const mime = assertValidImage(file);
    const client = await getSupabaseWithAuth(session);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extFor(mime)}`;
    const { error } = await client.storage.from('meal-images').upload(path, file, { cacheControl: '3600', upsert: false, contentType: mime });
    if (error) throw error;
    return client.storage.from('meal-images').getPublicUrl(path).data.publicUrl;
  };

  const uploadVendorLogo = async (file: File) => {
    const mime = assertValidImage(file);
    const client = await getSupabaseWithAuth(session);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extFor(mime)}`;
    const { error } = await client.storage.from('vendor-logos').upload(path, file, { cacheControl: '3600', upsert: false, contentType: mime });
    if (error) throw error;
    return client.storage.from('vendor-logos').getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let imageUrl = formData.image_url;
      if (uploadedFile) imageUrl = await uploadImage(uploadedFile);
      if (!imageUrl) { alert('Please upload an image'); return; }

      const payload = {
        name: formData.name,
        vendor: formData.vendor,
        vendor_id: formData.vendor_id || null,
        description: formData.description || null,
        image_url: imageUrl,
        price: parseFloat(formData.price) || 0,
        calories: parseInt(formData.calories) || 0,
        protein: parseInt(formData.protein) || 0,
        carbs: parseInt(formData.carbs) || 0,
        fats: parseInt(formData.fats) || 0,
        ingredients: formData.ingredients.split(',').map(i => i.trim()),
        dietary_tags: formData.dietary_tags,
        is_meal_of_week: formData.is_meal_of_week,
      };

      const client = await getSupabaseWithAuth(session);
      if (editingMeal) {
        const { error } = await client.from('meals').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingMeal.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('meals').insert([payload]);
        if (error) throw error;
      }
      resetForm();
      refetch();
    } catch (err) {
      alert(`Failed to save meal: ${errorMessage(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name, vendor: meal.vendor, vendor_id: meal.vendor_id || '',
      description: meal.description || '', image_url: meal.image_url,
      price: meal.price.toString(), calories: meal.calories.toString(),
      protein: meal.protein.toString(), carbs: meal.carbs.toString(),
      fats: meal.fats.toString(), ingredients: meal.ingredients.join(', '),
      dietary_tags: meal.dietary_tags,
      is_meal_of_week: meal.is_meal_of_week ?? false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const client = await getSupabaseWithAuth(session);
    const { error } = await client.from('meals').delete().eq('id', id);
    if (error) { alert('Failed to delete meal.'); return; }
    setConfirmDeleteId(null);
    refetch();
  };

  const resetForm = () => {
    setFormData({ name: '', vendor: '', vendor_id: '', description: '', image_url: '', price: '', calories: '', protein: '', carbs: '', fats: '', ingredients: '', dietary_tags: [], is_meal_of_week: false });
    setUploadedFile(null); setEditingMeal(null); setShowForm(false);
  };

  // ── Team handlers ─────────────────────────────────────────────────────────
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setVendorFormLoading(true);
    try {
      let logoUrl = vendorFormData.logo_url || null;
      if (vendorLogoFile) logoUrl = await uploadVendorLogo(vendorLogoFile);
      const client = await getSupabaseWithAuth(session);
      const { error } = await client.from('vendors').insert([{ name: vendorFormData.name, slug: vendorFormData.slug, contact_email: vendorFormData.contact_email, venmo_handle: vendorFormData.venmo_handle || null, zelle_contact: vendorFormData.zelle_contact || null, description: vendorFormData.description || null, logo_url: logoUrl, is_active: true }]);
      if (error) throw error;
      setVendorFormData({ name: '', slug: '', contact_email: '', venmo_handle: '', zelle_contact: '', description: '', logo_url: '' });
      setVendorLogoFile(null); setShowVendorForm(false);
      fetchTeamData();
    } catch (err) { alert(`Failed: ${errorMessage(err)}`); }
    finally { setVendorFormLoading(false); }
  };

  const handleSuperadminSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSuperadminFormLoading(true);
    try {
      const client = await getSupabaseWithAuth(session);
      const { error } = await client.from('vendor_users').insert([{ clerk_user_id: superadminFormData.clerk_user_id.trim(), display_name: superadminFormData.display_name.trim(), role: 'superadmin', vendor_id: null }]);
      if (error) throw error;
      setSuperadminFormData({ clerk_user_id: '', display_name: '' }); setShowSuperadminForm(false);
      fetchTeamData();
    } catch (err) { alert(`Failed: ${errorMessage(err)}`); }
    finally { setSuperadminFormLoading(false); }
  };

  const handleVendorMemberSubmit = async (e: React.FormEvent, vendorId: string) => {
    e.preventDefault(); e.stopPropagation(); setVendorMemberFormLoading(true);
    try {
      const client = await getSupabaseWithAuth(session);
      const { error } = await client.from('vendor_users').insert([{ email: vendorMemberFormData.email.trim().toLowerCase(), display_name: vendorMemberFormData.display_name.trim(), role: 'vendor', vendor_id: vendorId }]);
      if (error) throw error;
      setVendorMemberFormData({ email: '', display_name: '' }); setShowVendorMemberFormVendorId(null);
      fetchTeamData();
    } catch (err) { alert(`Failed: ${errorMessage(err)}`); }
    finally { setVendorMemberFormLoading(false); }
  };

  const handleVendorUpdate = async (e: React.FormEvent, vendorId: string) => {
    e.preventDefault(); setVendorUpdateLoading(true);
    try {
      let logoUrl = editVendorFormData.logo_url || null;
      if (editVendorLogoFile) logoUrl = await uploadVendorLogo(editVendorLogoFile);
      const client = await getSupabaseWithAuth(session);
      const { error } = await client.from('vendors').update({ name: editVendorFormData.name, slug: editVendorFormData.slug, contact_email: editVendorFormData.contact_email, venmo_handle: editVendorFormData.venmo_handle || null, zelle_contact: editVendorFormData.zelle_contact || null, description: editVendorFormData.description || null, logo_url: logoUrl }).eq('id', vendorId);
      if (error) throw error;
      setEditingVendorId(null); setEditVendorLogoFile(null); fetchTeamData();
    } catch (err) { alert(`Failed: ${errorMessage(err)}`); }
    finally { setVendorUpdateLoading(false); }
  };

  const handleVendorToggleActive = async (vendor: Vendor) => {
    const client = await getSupabaseWithAuth(session);
    await client.from('vendors').update({ is_active: !vendor.is_active }).eq('id', vendor.id);
    fetchTeamData();
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card = 'bg-card rounded-2xl border border-line overflow-hidden';
  const sectionTitle = 'font-display text-2xl font-semibold text-ink';

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-card border-b border-line sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="group flex items-center gap-3 hover:opacity-80 transition-opacity">
            <h1 className="font-display text-2xl font-semibold italic text-primary">bloo</h1>
            <span className="text-xs text-ink-muted font-sans uppercase tracking-wider border-l border-line pl-3">Admin</span>
          </button>
          <div className="flex items-center gap-2">
            {user && <span className="text-xs text-ink-muted font-sans hidden sm:block">{user.primaryEmailAddress?.emailAddress}</span>}
            <Button variant="secondary" className="text-sm py-2" onClick={() => signOut({ redirectUrl: '/' })}>
              <LogOut size={15} className="mr-1.5" /> Sign out
            </Button>
          </div>
        </div>

        {/* Tabs with sliding indicator */}
        <div className="max-w-7xl mx-auto px-6 border-t border-line">
          <div ref={tabRowRef} className="relative flex gap-0">
            {TABS.map(tab => (
              <button
                key={tab}
                ref={el => { tabRefs.current[tab] = el; }}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'text-primary' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {tab === 'pulse' && <BarChart2 size={14} className="inline mr-1.5 -mt-0.5" />}
                {tab === 'team' && <Users size={14} className="inline mr-1.5 -mt-0.5" />}
                {tab === 'meals' && <UtensilsCrossed size={14} className="inline mr-1.5 -mt-0.5" />}
                {tab}
              </button>
            ))}
            <div
              className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ left: indicator.left, width: indicator.width }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ══ PULSE TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'pulse' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className={sectionTitle}>Pulse</h2>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-muted">
                <span className="live-dot" />Live
              </span>
            </div>

            {/* Stats row with count-up */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CountUpStat label="Total meals" target={meals.length} />
              <CountUpStat label="Active vendors" target={activeVendors.length} />
              <div className={`${card} p-5`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">Meal of the week</div>
                <div className="font-display text-lg font-semibold text-accent truncate mt-2">{meals.find(m => m.is_meal_of_week)?.name ?? '—'}</div>
              </div>
              <CountUpStat label="Vendors" target={vendors.length} />
            </div>

            {/* Meals by vendor */}
            <MealsByVendor card={card} activeVendors={activeVendors} meals={meals} />

            {/* Recent meals */}
            <RecentlyAdded card={card} meals={meals.slice(0, 5)} />
          </div>
        )}

        {/* ══ MEALS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'meals' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className={sectionTitle}>Meals</h2>
              <Button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }} className="sheen flex items-center gap-2">
                <Plus size={16} /> {showForm ? 'Cancel' : 'Add meal'}
              </Button>
            </div>

            {/* Meal form */}
            {showForm && (
              <div className={`${card} p-6`}>
                <h3 className="font-display text-lg font-semibold text-ink mb-5">
                  {editingMeal ? 'Edit meal' : 'New meal'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-6 lg:grid-cols-12">
                    {/* Left column */}
                    <div className="space-y-4 lg:col-span-4">
                      <div>
                        <label className={LABEL}>Image</label>
                        <ImageUpload
                          onImageSelect={f => setUploadedFile(f)}
                          currentImageUrl={formData.image_url}
                          onImageRemove={() => { setUploadedFile(null); setFormData(d => ({ ...d, image_url: '' })); }}
                          disabled={isUploading}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Meal name</label>
                        <input className={INPUT} value={formData.name} onChange={e => setFormData(d => ({ ...d, name: e.target.value }))} required placeholder="Grilled Salmon Bowl" />
                      </div>
                      <div>
                        <label className={LABEL}>Vendor</label>
                        <select className={INPUT} value={formData.vendor_id} onChange={e => { const id = e.target.value; setFormData(d => ({ ...d, vendor_id: id, vendor: activeVendors.find(v => v.id === id)?.name ?? '' })); }} required>
                          <option value="">— select vendor —</option>
                          {activeVendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>Price (USD)</label>
                        <input className={INPUT} type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData(d => ({ ...d, price: e.target.value }))} required placeholder="12.99" />
                      </div>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={formData.is_meal_of_week} onChange={e => setFormData(d => ({ ...d, is_meal_of_week: e.target.checked }))} className="w-4 h-4 accent-primary rounded" />
                        <span className="text-sm font-medium text-ink">Meal of the week</span>
                      </label>
                    </div>

                    {/* Right column */}
                    <div className="space-y-4 lg:col-span-8">
                      <div>
                        <label className={LABEL}>Description <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
                        <textarea className={`${INPUT} resize-none`} value={formData.description} onChange={e => e.target.value.length <= 500 && setFormData(d => ({ ...d, description: e.target.value }))} rows={2} placeholder="What makes this meal special…" />
                        <p className={`text-right text-xs mt-1 ${formData.description.length > 450 ? 'text-accent' : 'text-ink-faint'}`}>{formData.description.length}/500</p>
                      </div>
                      <div>
                        <label className={LABEL}>Nutrition</label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {(['calories', 'protein', 'carbs', 'fats'] as const).map(f => (
                            <div key={f}>
                              <label className="block text-[11px] font-medium uppercase tracking-wide text-ink-faint mb-1">{f === 'calories' ? 'Cal' : `${f[0].toUpperCase() + f.slice(1)} (g)`}</label>
                              <input className={INPUT} type="number" value={formData[f]} onChange={e => setFormData(d => ({ ...d, [f]: e.target.value }))} required />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={LABEL}>Ingredients <span className="normal-case font-normal text-ink-faint">(comma-separated)</span></label>
                        <textarea className={`${INPUT} resize-none`} value={formData.ingredients} onChange={e => setFormData(d => ({ ...d, ingredients: e.target.value }))} required rows={3} placeholder="Salmon, quinoa, avocado, lemon" />
                        <button
                          type="button"
                          onClick={() => setShowMacroModal(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-active border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <Sparkles size={11} className="anim-spin-slow" />
                          Estimate with AI
                        </button>
                      </div>
                      <div>
                        <label className={LABEL}>Dietary tags <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
                        <DietaryTagPicker
                          selected={formData.dietary_tags}
                          onChange={tags => setFormData(d => ({ ...d, dietary_tags: tags }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-line">
                    <Button type="submit" disabled={isUploading}>{isUploading ? 'Saving…' : editingMeal ? 'Update meal' : 'Add meal'}</Button>
                    <Button type="button" variant="secondary" onClick={resetForm} disabled={isUploading}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}

            {/* Vendor filter */}
            {meals.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {[{ id: null, name: 'All' }, ...activeVendors].map(v => (
                  <button key={v.id ?? 'all'} onClick={() => setMealsVendorFilterId(v.id)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mealsVendorFilterId === v.id ? 'bg-primary text-white' : 'bg-card border border-line text-ink-muted hover:text-ink'}`}>
                    {v.name}
                  </button>
                ))}
              </div>
            )}

            {/* Meals table */}
            <div className={card}>
              {filteredMeals.length === 0 ? (
                <div className="p-16 text-center">
                  <UtensilsCrossed className="mx-auto text-ink-faint mb-4" size={48} />
                  <p className="text-ink-muted">{meals.length === 0 ? 'No meals yet. Click "Add meal" to get started.' : 'No meals for this vendor.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface border-b border-line">
                      <tr>
                        {['Meal', 'Vendor', 'Macros', 'MOTW', 'Actions'].map(h => (
                          <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filteredMeals.map(meal => (
                        <tr key={meal.id} className="hover:bg-surface/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img src={meal.image_url} alt={meal.name} className="w-12 h-12 rounded-xl object-cover border border-line" />
                              <span className="text-sm font-semibold text-ink">{meal.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-ink-muted">{meal.vendor}</td>
                          <td className="px-5 py-4 text-sm text-ink-muted font-mono">
                            {meal.calories} cal · {meal.protein}g P · {meal.carbs}g C · {meal.fats}g F
                          </td>
                          <td className="px-5 py-4 text-center">
                            {meal.is_meal_of_week && <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">★ MOTW</span>}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {confirmDeleteId === meal.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-ink-muted">Delete?</span>
                                <button onClick={() => handleDelete(meal.id)} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 font-semibold">Delete</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-surface text-ink text-xs rounded-lg hover:bg-line font-semibold">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleEdit(meal)} className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-lg hover:bg-primary/20 font-semibold">Edit</button>
                                <button onClick={() => setConfirmDeleteId(meal.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TEAM TAB ═══════════════════════════════════════════════════════ */}
        {activeTab === 'team' && (
          <div className="space-y-12 animate-fadeIn">

            {/* Super admins */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className={sectionTitle}>Super admins</h2>
                  <p className="text-ink-muted text-sm mt-1">Full platform access. Each person needs their own Clerk account.</p>
                </div>
                <Button onClick={() => setShowSuperadminForm(!showSuperadminForm)} className="sheen flex items-center gap-2">
                  <Plus size={16} />{showSuperadminForm ? 'Cancel' : 'Add admin'}
                </Button>
              </div>

              {showSuperadminForm && (
                <div className={`${card} p-6 mb-5`}>
                  <h3 className="font-display text-base font-semibold text-ink mb-4">Add super admin</h3>
                  <form onSubmit={handleSuperadminSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={LABEL}>Display name</label><input className={INPUT} value={superadminFormData.display_name} onChange={e => setSuperadminFormData(d => ({ ...d, display_name: e.target.value }))} required placeholder="Alex Chen" /></div>
                    <div><label className={LABEL}>Clerk User ID</label><input className={`${INPUT} font-mono`} value={superadminFormData.clerk_user_id} onChange={e => setSuperadminFormData(d => ({ ...d, clerk_user_id: e.target.value }))} required placeholder="user_2abc…" /><p className="text-xs text-ink-faint mt-1">Clerk Dashboard → Users → User ID</p></div>
                    <div className="md:col-span-2 flex gap-3"><Button type="submit" disabled={superadminFormLoading}>{superadminFormLoading ? 'Adding…' : 'Add super admin'}</Button><Button type="button" variant="secondary" onClick={() => { setSuperadminFormData({ clerk_user_id: '', display_name: '' }); setShowSuperadminForm(false); }}>Cancel</Button></div>
                  </form>
                </div>
              )}

              <div className={card}>
                {superadmins.length === 0 ? (
                  <div className="p-10 text-center text-ink-muted text-sm">No super admins yet.</div>
                ) : (
                  <div className="divide-y divide-line">
                    {superadmins.map(admin => (
                      <div key={admin.id}>
                        <button
                          className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface/60 transition-colors"
                          onClick={() => setExpandedSuperadminId(expandedSuperadminId === admin.id ? null : admin.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-semibold">{admin.display_name[0]}</div>
                            <span className="text-sm font-semibold text-ink">{admin.display_name}</span>
                          </div>
                          <ChevronDown size={16} className={`text-ink-muted transition-transform ${expandedSuperadminId === admin.id ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedSuperadminId === admin.id && (
                          <div className="px-5 pb-4 bg-surface/40 border-t border-line text-xs text-ink-muted font-mono space-y-1">
                            <p>ID: {admin.clerk_user_id}</p>
                            <p>Added: {new Date(admin.created_at).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Vendors */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className={sectionTitle}>Vendors</h2>
                  <p className="text-ink-muted text-sm mt-1">Manage restaurants and their team members.</p>
                </div>
                <Button onClick={() => setShowVendorForm(!showVendorForm)} className="sheen flex items-center gap-2">
                  <Plus size={16} />{showVendorForm ? 'Cancel' : 'Add vendor'}
                </Button>
              </div>

              {showVendorForm && (
                <div className={`${card} p-6 mb-5`}>
                  <h3 className="font-display text-base font-semibold text-ink mb-4">New vendor</h3>
                  <form onSubmit={handleVendorSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
                      <div>
                        <label className={LABEL}>Logo <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
                        <ImageUpload onImageSelect={f => setVendorLogoFile(f)} currentImageUrl={vendorFormData.logo_url} onImageRemove={() => { setVendorLogoFile(null); setVendorFormData(d => ({ ...d, logo_url: '' })); }} disabled={vendorFormLoading} />
                      </div>
                      <div>
                        <label className={LABEL}>Description <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
                        <textarea className={`${INPUT} resize-none`} rows={4} value={vendorFormData.description} onChange={e => setVendorFormData(d => ({ ...d, description: e.target.value }))} placeholder="Tell customers about this restaurant…" />
                      </div>
                    </div>
                    <div><label className={LABEL}>Name</label><input className={INPUT} value={vendorFormData.name} onChange={e => setVendorFormData(d => ({ ...d, name: e.target.value }))} required /></div>
                    <div><label className={LABEL}>Slug</label><input className={`${INPUT} font-mono`} value={vendorFormData.slug} onChange={e => setVendorFormData(d => ({ ...d, slug: e.target.value }))} required placeholder="its-va-meals" /></div>
                    <div><label className={LABEL}>Contact email</label><input className={INPUT} type="email" value={vendorFormData.contact_email} onChange={e => setVendorFormData(d => ({ ...d, contact_email: e.target.value }))} required /></div>
                    <div><label className={LABEL}>Venmo <span className="normal-case font-normal text-ink-faint">(optional)</span></label><input className={INPUT} value={vendorFormData.venmo_handle} onChange={e => setVendorFormData(d => ({ ...d, venmo_handle: e.target.value }))} /></div>
                    <div className="md:col-span-2 flex gap-3"><Button type="submit" disabled={vendorFormLoading}>{vendorFormLoading ? 'Adding…' : 'Add vendor'}</Button><Button type="button" variant="secondary" onClick={() => { setVendorFormData({ name: '', slug: '', contact_email: '', venmo_handle: '', zelle_contact: '', description: '', logo_url: '' }); setVendorLogoFile(null); setShowVendorForm(false); }}>Cancel</Button></div>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                {vendors.length === 0 ? (
                  <div className={`${card} p-10 text-center text-ink-muted text-sm`}>No vendors yet.</div>
                ) : vendors.map(vendor => (
                  <div key={vendor.id} className={card}>
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface/40 transition-colors"
                      onClick={() => setExpandedVendorId(expandedVendorId === vendor.id ? null : vendor.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${vendor.is_active ? 'bg-macro-green' : 'bg-ink-faint'}`} />
                        <span className="text-sm font-semibold text-ink">{vendor.name}</span>
                        <span className="text-xs text-ink-faint font-mono">/{vendor.slug}</span>
                      </div>
                      <ChevronDown size={16} className={`text-ink-muted transition-transform ${expandedVendorId === vendor.id ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedVendorId === vendor.id && (
                      <div className="border-t border-line p-5 space-y-5 bg-surface/30">
                        {/* Edit form */}
                        {editingVendorId === vendor.id ? (
                          <form onSubmit={e => handleVendorUpdate(e, vendor.id)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
                              <div>
                                <label className={LABEL}>Logo <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
                                <ImageUpload onImageSelect={f => setEditVendorLogoFile(f)} currentImageUrl={editVendorFormData.logo_url} onImageRemove={() => { setEditVendorLogoFile(null); setEditVendorFormData(d => ({ ...d, logo_url: '' })); }} disabled={vendorUpdateLoading} />
                              </div>
                              <div>
                                <label className={LABEL}>Description <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
                                <textarea className={`${INPUT} resize-none`} rows={4} value={editVendorFormData.description} onChange={e => setEditVendorFormData(d => ({ ...d, description: e.target.value }))} placeholder="Tell customers about this restaurant…" />
                              </div>
                            </div>
                            <div><label className={LABEL}>Name</label><input className={INPUT} value={editVendorFormData.name} onChange={e => setEditVendorFormData(d => ({ ...d, name: e.target.value }))} required /></div>
                            <div><label className={LABEL}>Slug</label><input className={`${INPUT} font-mono`} value={editVendorFormData.slug} onChange={e => setEditVendorFormData(d => ({ ...d, slug: e.target.value }))} required /></div>
                            <div><label className={LABEL}>Email</label><input className={INPUT} type="email" value={editVendorFormData.contact_email} onChange={e => setEditVendorFormData(d => ({ ...d, contact_email: e.target.value }))} required /></div>
                            <div><label className={LABEL}>Venmo</label><input className={INPUT} value={editVendorFormData.venmo_handle} onChange={e => setEditVendorFormData(d => ({ ...d, venmo_handle: e.target.value }))} /></div>
                            <div className="md:col-span-2 flex gap-2"><Button type="submit" className="text-sm py-2" disabled={vendorUpdateLoading}>{vendorUpdateLoading ? 'Saving…' : 'Save'}</Button><Button type="button" variant="secondary" className="text-sm py-2" onClick={() => { setEditingVendorId(null); setEditVendorLogoFile(null); }}>Cancel</Button></div>
                          </form>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => { setEditVendorFormData({ name: vendor.name, slug: vendor.slug, contact_email: vendor.contact_email, venmo_handle: vendor.venmo_handle ?? '', zelle_contact: vendor.zelle_contact ?? '', description: vendor.description ?? '', logo_url: vendor.logo_url ?? '' }); setEditVendorLogoFile(null); setEditingVendorId(vendor.id); }} className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20">Edit details</button>
                            <button onClick={() => handleVendorToggleActive(vendor)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${vendor.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-macro-green/10 text-macro-green hover:bg-macro-green/20'}`}>{vendor.is_active ? 'Deactivate' : 'Activate'}</button>
                            <button onClick={() => navigate(`/admin/vendor/${vendor.slug}`)} className="px-3 py-1.5 text-xs font-semibold bg-surface text-ink border border-line rounded-lg hover:bg-line">Open vendor panel →</button>
                          </div>
                        )}

                        {/* Members */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Members</p>
                            <button onClick={() => setShowVendorMemberFormVendorId(showVendorMemberFormVendorId === vendor.id ? null : vendor.id)} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"><Plus size={12} />Add member</button>
                          </div>

                          {showVendorMemberFormVendorId === vendor.id && (
                            <form onSubmit={e => handleVendorMemberSubmit(e, vendor.id)} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-4 bg-card rounded-xl border border-line">
                              <div><label className={LABEL}>Display name</label><input className={INPUT} value={vendorMemberFormData.display_name} onChange={e => setVendorMemberFormData(d => ({ ...d, display_name: e.target.value }))} required placeholder="Jane's Kitchen" /></div>
                              <div><label className={LABEL}>Email</label><input className={INPUT} type="email" value={vendorMemberFormData.email} onChange={e => setVendorMemberFormData(d => ({ ...d, email: e.target.value }))} required placeholder="vendor@email.com" /></div>
                              <div className="md:col-span-2 flex gap-2"><Button type="submit" className="text-sm py-2" disabled={vendorMemberFormLoading}>{vendorMemberFormLoading ? 'Adding…' : 'Add member'}</Button><Button type="button" variant="secondary" className="text-sm py-2" onClick={() => { setVendorMemberFormData({ email: '', display_name: '' }); setShowVendorMemberFormVendorId(null); }}>Cancel</Button></div>
                            </form>
                          )}

                          {(vendorMembersByVendorId.get(vendor.id) ?? []).length === 0 ? (
                            <p className="text-xs text-ink-faint">No members yet.</p>
                          ) : (vendorMembersByVendorId.get(vendor.id) ?? []).map(member => (
                            <div key={member.id} className="flex items-center gap-3 py-2">
                              <div className="w-7 h-7 rounded-full bg-surface border border-line flex items-center justify-center text-xs font-semibold text-ink-muted">{member.display_name[0]}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-ink font-medium">{member.display_name}</p>
                                {member.email && <p className="text-xs text-ink-muted">{member.email}</p>}
                              </div>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${member.clerk_user_id ? 'bg-macro-green/10 text-macro-green' : 'bg-surface text-ink-faint border border-line'}`}>
                                {member.clerk_user_id ? '● linked' : '○ pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Macro estimation modal */}
      {showMacroModal && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => { if (!isEstimating) { setShowMacroModal(false); setMacroError(null); setMacroInput(''); } }}>
          <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl border border-line w-full max-w-md animate-liftIn shadow-2xl">
            <div className="p-5 border-b border-line flex items-center gap-2">
              <Sparkles size={18} className="text-primary anim-spin-slow" />
              <h3 className="font-display text-lg font-semibold text-ink">Estimate macros</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-ink-muted">Describe the meal ingredients and we'll estimate the nutrition. Powered by Claude.</p>
              <div className={isEstimating ? 'scan-wrap bg-card border border-line rounded-xl p-3 text-sm leading-relaxed text-ink' : ''}>
                {isEstimating ? (
                  <div>{macroInput}<span className="caret" /></div>
                ) : (
                  <textarea
                    value={macroInput}
                    onChange={e => { setMacroInput(e.target.value); setMacroError(null); }}
                    placeholder="e.g., 2 cups chicken breast, 1 cup brown rice, steamed broccoli"
                    rows={4}
                    className={INPUT}
                  />
                )}
              </div>
              {macroError && <span className="block text-xs text-accent">{macroError}</span>}
              <div className="flex items-center gap-2">
                <button
                  onClick={estimateMacros}
                  disabled={isEstimating || !macroInput.trim()}
                  className={`glow-cta px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isEstimating ? '' : 'hover:bg-primary-hover'} transition-colors`}
                >
                  <Sparkles size={13} className={isEstimating ? 'animate-spin' : 'anim-spin-slow'} />
                  {isEstimating ? 'Estimating…' : 'Estimate'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMacroModal(false); setMacroError(null); setMacroInput(''); }}
                  disabled={isEstimating}
                  className="px-4 py-2.5 rounded-xl bg-card border border-line text-sm font-semibold text-ink hover:bg-surface transition-colors disabled:opacity-50"
                >Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
