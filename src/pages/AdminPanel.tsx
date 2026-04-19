import { Fragment, useState, useEffect, useMemo } from 'react';
import { useClerk, useUser, useSession } from '@clerk/react';
import { supabase, Meal } from '../lib/supabase';
import { getSupabaseWithAuth } from '../lib/supabaseWithAuth';
import { useMeals } from '../hooks/useMeals';
import ImageUpload from '../components/ImageUpload';
import { Trash2, Plus, ChevronDown, MoreHorizontal, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AdminTab = 'pulse' | 'vendors' | 'meals' | 'payouts' | 'team';

interface Vendor {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
  venmo_handle: string | null;
  zelle_contact: string | null;
  cuisine_tags: string[] | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface VendorUser {
  id: string;
  clerk_user_id: string;
  display_name: string;
  role: 'superadmin' | 'vendor';
  vendor_id: string | null;
  vendors: { name: string } | null;
  created_at: string;
}

const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AdminPanel() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { session } = useSession();
  const { meals, refetch } = useMeals();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<AdminTab>('pulse');

  // ── Meals state ───────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    vendor_id: '',
    description: '',
    image_url: '',
    price: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    ingredients: '',
    dietary_tags: '',
  });

  const [activeVendors, setActiveVendors] = useState<{ id: string; name: string }[]>([]);
  const [mealsVendorFilterId, setMealsVendorFilterId] = useState<string | null>(null);

  // ── Team state ────────────────────────────────────────────────────────────
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorUsers, setVendorUsers] = useState<VendorUser[]>([]);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showSuperadminForm, setShowSuperadminForm] = useState(false);
  const [expandedSuperadminId, setExpandedSuperadminId] = useState<string | null>(null);
  const [showVendorMemberFormVendorId, setShowVendorMemberFormVendorId] = useState<string | null>(null);
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editVendorFormData, setEditVendorFormData] = useState({
    name: '', slug: '', contact_email: '', venmo_handle: '', zelle_contact: '',
  });
  const [vendorUpdateLoading, setVendorUpdateLoading] = useState(false);
  const [vendorFormLoading, setVendorFormLoading] = useState(false);
  const [superadminFormLoading, setSuperadminFormLoading] = useState(false);
  const [vendorMemberFormLoading, setVendorMemberFormLoading] = useState(false);
  const [vendorFormData, setVendorFormData] = useState({
    name: '', slug: '', contact_email: '', venmo_handle: '', zelle_contact: '',
  });
  const [superadminFormData, setSuperadminFormData] = useState({
    clerk_user_id: '', display_name: '',
  });
  const [vendorMemberFormData, setVendorMemberFormData] = useState({
    clerk_user_id: '', display_name: '',
  });

  const superadmins = useMemo(
    () => vendorUsers.filter((u) => u.role === 'superadmin'),
    [vendorUsers],
  );

  const vendorMembersByVendorId = useMemo(() => {
    const map = new Map<string, VendorUser[]>();
    for (const u of vendorUsers) {
      if (u.role !== 'vendor' || !u.vendor_id) continue;
      const list = map.get(u.vendor_id) ?? [];
      list.push(u);
      map.set(u.vendor_id, list);
    }
    return map;
  }, [vendorUsers]);

  const filteredMeals = useMemo(() => {
    if (!mealsVendorFilterId) return meals;
    return meals.filter((m) => m.vendor_id === mealsVendorFilterId);
  }, [meals, mealsVendorFilterId]);

  const activeVendorsList = useMemo(() => vendors.filter((v) => v.is_active), [vendors]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const fetchActiveVendors = async () => {
      const authedSupabase = await getSupabaseWithAuth(session);
      const { data } = await authedSupabase
        .from('vendors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (data) setActiveVendors(data);
    };
    fetchActiveVendors();
  }, [session]);

  const fetchTeamData = async () => {
    if (!session) return;
    const authedSupabase = await getSupabaseWithAuth(session);
    const [{ data: vendorsData }, { data: usersData }] = await Promise.all([
      authedSupabase.from('vendors').select('*').order('name'),
      authedSupabase
        .from('vendor_users')
        .select('id, clerk_user_id, display_name, role, vendor_id, created_at, vendors(name)')
        .order('role'),
    ]);
    if (vendorsData) setVendors(vendorsData as Vendor[]);
    if (usersData) setVendorUsers(usersData as VendorUser[]);
  };

  useEffect(() => {
    if ((activeTab === 'vendors' || activeTab === 'team' || activeTab === 'pulse') && session) {
      fetchTeamData();
    }
  }, [activeTab, session]);

  // ── Meals handlers ────────────────────────────────────────────────────────
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('meal-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let imageUrl = formData.image_url;
      if (uploadedFile) imageUrl = await uploadImage(uploadedFile);

      if (!imageUrl) {
        alert('Please upload an image');
        setIsUploading(false);
        return;
      }

      const baseMealData = {
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
        ingredients: formData.ingredients.split(',').map((i) => i.trim()),
        dietary_tags: formData.dietary_tags
          ? formData.dietary_tags.split(',').map((t) => t.trim())
          : [],
      };

      const authedSupabase = await getSupabaseWithAuth(session);

      if (editingMeal) {
        const { error } = await authedSupabase
          .from('meals')
          .update({ ...baseMealData, updated_at: new Date().toISOString() })
          .eq('id', editingMeal.id)
          .select();
        if (error) throw error;
      } else {
        const { error } = await authedSupabase.from('meals').insert([baseMealData]).select();
        if (error) throw error;
      }
      resetForm();
      refetch();
    } catch (error) {
      alert(`Failed to save meal: ${(error as any)?.message || 'Please try again.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      vendor: meal.vendor,
      vendor_id: meal.vendor_id || '',
      description: meal.description || '',
      image_url: meal.image_url,
      price: meal.price.toString(),
      calories: meal.calories.toString(),
      protein: meal.protein.toString(),
      carbs: meal.carbs.toString(),
      fats: meal.fats.toString(),
      ingredients: meal.ingredients.join(', '),
      dietary_tags: meal.dietary_tags.join(', '),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const authedSupabase = await getSupabaseWithAuth(session);
      const { error } = await authedSupabase.from('meals').delete().eq('id', id);
      if (error) throw error;
      setConfirmDeleteId(null);
      refetch();
    } catch {
      alert('Failed to delete meal. Please try again.');
    }
  };

  const handleToggleMealOfWeek = async (meal: Meal) => {
    const authedSupabase = await getSupabaseWithAuth(session);
    if (meal.is_meal_of_week) {
      await authedSupabase.from('meals').update({ is_meal_of_week: false }).eq('id', meal.id);
    } else {
      await authedSupabase.from('meals').update({ is_meal_of_week: false }).neq('id', meal.id);
      await authedSupabase.from('meals').update({ is_meal_of_week: true }).eq('id', meal.id);
    }
    refetch();
  };

  const resetForm = () => {
    setFormData({
      name: '', vendor: '', vendor_id: '', description: '', image_url: '',
      price: '', calories: '', protein: '', carbs: '', fats: '',
      ingredients: '', dietary_tags: '',
    });
    setUploadedFile(null);
    setEditingMeal(null);
    setShowForm(false);
  };

  // ── Vendor row handlers ───────────────────────────────────────────────────
  const startVendorEdit = (vendor: Vendor) => {
    setEditVendorFormData({
      name: vendor.name,
      slug: vendor.slug,
      contact_email: vendor.contact_email,
      venmo_handle: vendor.venmo_handle ?? '',
      zelle_contact: vendor.zelle_contact ?? '',
    });
    setEditingVendorId(vendor.id);
  };

  const cancelVendorEdit = () => {
    setEditingVendorId(null);
    setEditVendorFormData({ name: '', slug: '', contact_email: '', venmo_handle: '', zelle_contact: '' });
  };

  const handleVendorUpdate = async (e: React.FormEvent, vendorId: string) => {
    e.preventDefault();
    setVendorUpdateLoading(true);
    try {
      const authedSupabase = await getSupabaseWithAuth(session);
      const { error } = await authedSupabase
        .from('vendors')
        .update({
          name: editVendorFormData.name,
          slug: editVendorFormData.slug,
          contact_email: editVendorFormData.contact_email,
          venmo_handle: editVendorFormData.venmo_handle || null,
          zelle_contact: editVendorFormData.zelle_contact || null,
        })
        .eq('id', vendorId);
      if (error) throw error;
      cancelVendorEdit();
      fetchTeamData();
    } catch (err) {
      alert(`Failed to update vendor: ${(err as any)?.message || 'Please try again.'}`);
    } finally {
      setVendorUpdateLoading(false);
    }
  };

  const handleVendorToggleActive = async (vendor: Vendor) => {
    try {
      const authedSupabase = await getSupabaseWithAuth(session);
      const { error } = await authedSupabase
        .from('vendors')
        .update({ is_active: !vendor.is_active })
        .eq('id', vendor.id);
      if (error) throw error;
      fetchTeamData();
    } catch (err) {
      alert(`Failed to update vendor status: ${(err as any)?.message || 'Please try again.'}`);
    }
  };

  // ── Team handlers ─────────────────────────────────────────────────────────
  const resetVendorForm = () => {
    setVendorFormData({ name: '', slug: '', contact_email: '', venmo_handle: '', zelle_contact: '' });
    setShowVendorForm(false);
  };

  const resetSuperadminForm = () => {
    setSuperadminFormData({ clerk_user_id: '', display_name: '' });
    setShowSuperadminForm(false);
  };

  const resetVendorMemberForm = () => {
    setVendorMemberFormData({ clerk_user_id: '', display_name: '' });
    setShowVendorMemberFormVendorId(null);
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVendorFormLoading(true);
    try {
      const authedSupabase = await getSupabaseWithAuth(session);
      const { error } = await authedSupabase.from('vendors').insert([{
        name: vendorFormData.name,
        slug: vendorFormData.slug,
        contact_email: vendorFormData.contact_email,
        venmo_handle: vendorFormData.venmo_handle || null,
        zelle_contact: vendorFormData.zelle_contact || null,
        is_active: true,
      }]);
      if (error) throw error;
      resetVendorForm();
      fetchTeamData();
    } catch (err) {
      alert(`Failed to add vendor: ${(err as any)?.message || 'Please try again.'}`);
    } finally {
      setVendorFormLoading(false);
    }
  };

  const handleSuperadminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuperadminFormLoading(true);
    try {
      const authedSupabase = await getSupabaseWithAuth(session);
      const { error } = await authedSupabase.from('vendor_users').insert([{
        clerk_user_id: superadminFormData.clerk_user_id.trim(),
        display_name: superadminFormData.display_name.trim(),
        role: 'superadmin' as const,
        vendor_id: null,
      }]);
      if (error) throw error;
      resetSuperadminForm();
      fetchTeamData();
    } catch (err) {
      alert(`Failed to add super admin: ${(err as any)?.message || 'Please try again.'}`);
    } finally {
      setSuperadminFormLoading(false);
    }
  };

  const handleVendorMemberSubmit = async (e: React.FormEvent, vendorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setVendorMemberFormLoading(true);
    try {
      const authedSupabase = await getSupabaseWithAuth(session);
      const { error } = await authedSupabase.from('vendor_users').insert([{
        clerk_user_id: vendorMemberFormData.clerk_user_id.trim(),
        display_name: vendorMemberFormData.display_name.trim(),
        role: 'vendor' as const,
        vendor_id: vendorId,
      }]);
      if (error) throw error;
      resetVendorMemberForm();
      fetchTeamData();
    } catch (err) {
      alert(`Failed to add vendor account: ${(err as any)?.message || 'Please try again.'}`);
    } finally {
      setVendorMemberFormLoading(false);
    }
  };

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.firstName?.[0] ?? '?';

  const TABS: { key: AdminTab; label: string }[] = [
    { key: 'pulse', label: 'Pulse' },
    { key: 'vendors', label: 'Vendors' },
    { key: 'meals', label: 'Meals' },
    { key: 'payouts', label: 'Payouts' },
    { key: 'team', label: 'Team' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-line px-6 flex items-center gap-5 h-[68px] shrink-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/')}
            className="font-brand text-2xl font-semibold text-primary tracking-tight hover:opacity-80 transition-opacity"
          >
            bloo
          </button>
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-primary/10 text-primary border border-primary/20">
            Admin
          </span>
        </div>

        <nav className="flex gap-1 ml-6 h-full">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 text-[13px] font-medium border-b-2 transition-colors h-full ${
                activeTab === t.key
                  ? 'border-primary text-ink font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="hidden lg:flex items-center gap-2 text-[12px] text-ink-muted">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          {activeVendorsList.length} kitchen{activeVendorsList.length !== 1 ? 's' : ''} open
        </div>

        <button
          onClick={() => { setShowVendorForm(true); setActiveTab('vendors'); }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus size={14} />
          Add vendor
        </button>

        <button
          onClick={() => signOut({ redirectUrl: '/' })}
          className="text-xs text-ink-muted hover:text-ink font-medium transition-colors shrink-0"
        >
          Sign out
        </button>

        <button
          onClick={() => {}}
          className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-[12px] flex items-center justify-center shrink-0"
        >
          {initials}
        </button>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">

        {/* ════════════════════════════════════════════════════════════════
            PULSE TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pulse' && (
          <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Active vendors', value: activeVendorsList.length.toString(), sub: `of ${vendors.length} total` },
                { label: 'Meals live', value: meals.filter(m => activeVendors.some(v => v.id === m.vendor_id)).length.toString(), sub: 'across all vendors' },
                { label: 'Super admins', value: superadmins.length.toString(), sub: 'platform team' },
                { label: 'All meals', value: meals.length.toString(), sub: 'in database' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl border border-line p-5 shadow-sm">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-ink-faint font-label mb-1">{kpi.label}</div>
                  <div className="font-brand text-3xl font-semibold text-ink leading-tight">{kpi.value}</div>
                  <div className="text-[11.5px] text-ink-muted mt-1">{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Vendor grid */}
            {vendors.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
                  Vendors
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-primary/10 text-primary">
                    {activeVendorsList.length} open
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.map((v) => (
                    <div
                      key={v.id}
                      className={`bg-white rounded-xl border border-line p-5 shadow-sm ${!v.is_active ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {v.name.split(' ').map(s => s[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[14px] text-ink truncate">{v.name}</span>
                            {v.is_active
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />open</span>
                              : <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface text-ink-muted border border-line shrink-0">paused</span>
                            }
                          </div>
                          <div className="text-[10.5px] text-ink-faint font-mono mt-0.5">/{v.slug}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-line">
                        <span className="text-[11px] text-ink-muted">{v.contact_email}</span>
                        <button
                          onClick={() => navigate(`/admin/vendor/${v.slug}`)}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Open →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Super admins quick list */}
            {superadmins.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-ink mb-4">Super admins</h2>
                <div className="bg-white rounded-xl border border-line shadow-sm overflow-hidden">
                  {superadmins.map((a, idx) => (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 px-5 py-3.5 ${idx > 0 ? 'border-t border-line' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                        {a.display_name.split(' ').map(s => s[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[13px] text-ink">{a.display_name}</span>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-primary/10 text-primary">superadmin</span>
                        </div>
                        <div className="text-[10.5px] text-ink-faint font-mono truncate">{a.clerk_user_id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vendors.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4">
                  <Plus size={22} className="text-ink-faint" />
                </div>
                <p className="text-ink-muted text-sm">No vendors yet. Add one to get started.</p>
                <button
                  onClick={() => { setShowVendorForm(true); setActiveTab('vendors'); }}
                  className="mt-3 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Add vendor
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            MEALS TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'meals' && (
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-ink font-body">Meals</h2>
                <p className="text-sm text-ink-muted mt-0.5">All meals across every vendor</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={15} />
                {showForm ? 'Cancel' : 'Add meal'}
              </button>
            </div>

            {showForm && (
              <div className="bg-white rounded-xl border border-line shadow-sm p-6 mb-6">
                <h3 className="text-base font-bold text-ink mb-4">
                  {editingMeal ? 'Edit meal' : 'Add new meal'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
                    <div className="space-y-4 lg:col-span-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Meal image
                        </label>
                        <ImageUpload
                          onImageSelect={(file) => setUploadedFile(file)}
                          currentImageUrl={formData.image_url}
                          onImageRemove={() => {
                            setUploadedFile(null);
                            setFormData({ ...formData, image_url: '' });
                          }}
                          disabled={isUploading}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Meal name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Grilled Salmon Bowl"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Price (USD)</label>
                        <input
                          type="number" step="0.01" min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          className="w-full max-w-[11rem] rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="12.99"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 lg:col-span-8">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Vendor</label>
                        <select
                          value={formData.vendor_id}
                          onChange={(e) => {
                            const id = e.target.value;
                            const name = activeVendors.find((v) => v.id === id)?.name ?? '';
                            setFormData({ ...formData, vendor_id: id, vendor: name });
                          }}
                          required
                          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">— select a vendor —</option>
                          {activeVendors.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Description <span className="font-normal normal-case text-ink-faint">(optional)</span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => {
                            if (e.target.value.length <= 500)
                              setFormData({ ...formData, description: e.target.value });
                          }}
                          rows={2}
                          maxLength={500}
                          className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm leading-relaxed text-ink shadow-sm placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Highlight what makes this meal special..."
                        />
                        <div className="mt-1 flex justify-end">
                          <span className={`text-xs font-medium ${formData.description.length > 450 ? 'text-orange-600' : 'text-ink-faint'}`}>
                            {formData.description.length}/500
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Nutrition</label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {(['calories', 'protein', 'carbs', 'fats'] as const).map((field) => (
                            <div key={field}>
                              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                                {field === 'calories' ? 'Cal' : `${field.charAt(0).toUpperCase() + field.slice(1)} (g)`}
                              </label>
                              <input
                                type="number"
                                value={formData[field]}
                                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                required
                                className="w-full rounded-lg border border-line bg-white px-2.5 py-2 text-sm tabular-nums text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Ingredients <span className="font-normal normal-case text-ink-faint">(comma-separated)</span>
                        </label>
                        <textarea
                          value={formData.ingredients}
                          onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                          required rows={3}
                          className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm leading-relaxed text-ink shadow-sm placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Wild salmon, quinoa, avocado, cherry tomatoes, lemon"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Dietary tags <span className="font-normal normal-case text-ink-faint">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.dietary_tags}
                          onChange={(e) => setFormData({ ...formData, dietary_tags: e.target.value })}
                          placeholder="keto, gluten-free, high-protein"
                          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {isUploading ? 'Uploading...' : editingMeal ? 'Update meal' : 'Add meal'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={isUploading}
                      className="px-5 py-2 bg-surface text-ink-muted text-sm font-semibold rounded-lg hover:bg-line transition-colors disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {meals.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-2">Filter by vendor</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setMealsVendorFilterId(null)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                      mealsVendorFilterId === null
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-line bg-white text-ink-muted hover:bg-surface'
                    }`}
                  >
                    All
                  </button>
                  {activeVendors.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setMealsVendorFilterId(v.id)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        mealsVendorFilterId === v.id
                          ? 'bg-primary text-white shadow-sm'
                          : 'border border-line bg-white text-ink-muted hover:bg-surface'
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-line shadow-sm overflow-hidden">
              {meals.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
                    <Plus size={24} className="text-ink-faint" />
                  </div>
                  <p className="text-ink-muted text-sm">No meals added yet. Click "Add meal" to get started.</p>
                </div>
              ) : filteredMeals.length === 0 ? (
                <div className="p-16 text-center">
                  <p className="text-ink-muted text-sm">No meals for this vendor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line">
                        {['Meal', 'Vendor', 'Price', 'Macros', 'Actions'].map((h) => (
                          <th
                            key={h}
                            className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint bg-surface/50 ${h === 'Actions' ? 'text-right' : 'text-left'}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filteredMeals.map((meal) => (
                        <tr key={meal.id} className="hover:bg-surface/30 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <img
                                src={meal.image_url}
                                alt={meal.name}
                                className="w-12 h-12 rounded-lg object-cover border border-line shrink-0"
                              />
                              <span className="text-sm font-semibold text-ink">{meal.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-ink-muted">{meal.vendor}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-ink tabular-nums">
                            ${meal.price.toFixed(2)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs text-ink-muted font-medium tabular-nums">
                            {meal.calories} cal · {meal.protein}g P · {meal.carbs}g C · {meal.fats}g F
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            {confirmDeleteId === meal.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-ink-muted text-xs font-medium">Delete?</span>
                                <button
                                  onClick={() => handleDelete(meal.id)}
                                  className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors font-semibold"
                                >Delete</button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-3 py-1.5 bg-surface text-ink-muted text-xs rounded-lg hover:bg-line transition-colors font-medium"
                                >Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleMealOfWeek(meal)}
                                  title={meal.is_meal_of_week ? 'Remove meal of the week' : 'Set as meal of the week'}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    meal.is_meal_of_week
                                      ? 'text-amber-400 bg-amber-50 hover:bg-amber-100'
                                      : 'text-ink-faint hover:bg-surface hover:text-amber-400'
                                  }`}
                                >
                                  <Star size={15} fill={meal.is_meal_of_week ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  onClick={() => handleEdit(meal)}
                                  className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-lg hover:bg-primary/20 transition-colors font-semibold"
                                >Edit</button>
                                <button
                                  onClick={() => setConfirmDeleteId(meal.id)}
                                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
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

        {/* ════════════════════════════════════════════════════════════════
            VENDORS TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'vendors' && (
          <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-ink font-body">Vendors</h2>
                <p className="text-sm text-ink-muted mt-0.5">
                  Partner businesses on the platform
                </p>
              </div>
              <button
                onClick={() => setShowVendorForm(!showVendorForm)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={15} />
                {showVendorForm ? 'Cancel' : 'Add vendor'}
              </button>
            </div>

            {showVendorForm && (
              <div className="bg-white rounded-xl border border-line shadow-sm p-6">
                <h3 className="text-base font-bold text-ink mb-4">Add vendor</h3>
                <form onSubmit={handleVendorSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">Business name</label>
                      <input
                        type="text"
                        value={vendorFormData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setVendorFormData({ ...vendorFormData, name, slug: toSlug(name) });
                        }}
                        required
                        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Fresh Kitchen Co."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">Slug</label>
                      <input
                        type="text"
                        value={vendorFormData.slug}
                        onChange={(e) => setVendorFormData({ ...vendorFormData, slug: e.target.value })}
                        required
                        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="fresh-kitchen-co"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">Contact email</label>
                      <input
                        type="email"
                        value={vendorFormData.contact_email}
                        onChange={(e) => setVendorFormData({ ...vendorFormData, contact_email: e.target.value })}
                        required
                        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="owner@freshkitchen.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">Venmo handle</label>
                      <input
                        type="text"
                        value={vendorFormData.venmo_handle}
                        onChange={(e) => setVendorFormData({ ...vendorFormData, venmo_handle: e.target.value })}
                        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="@FreshKitchen"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">Zelle contact</label>
                      <input
                        type="text"
                        value={vendorFormData.zelle_contact}
                        onChange={(e) => setVendorFormData({ ...vendorFormData, zelle_contact: e.target.value })}
                        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="owner@freshkitchen.com or phone"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={vendorFormLoading}
                      className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {vendorFormLoading ? 'Adding...' : 'Add vendor'}
                    </button>
                    <button
                      type="button"
                      onClick={resetVendorForm}
                      className="px-5 py-2 bg-surface text-ink-muted text-sm font-semibold rounded-lg hover:bg-line transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl border border-line shadow-sm overflow-hidden">
              {vendors.length === 0 ? (
                <div className="p-16 text-center">
                  <p className="text-ink-muted text-sm">No vendors yet. Add one to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line">
                        {['Name', 'Slug', 'Contact Email', 'Venmo', 'Zelle', 'Status', ''].map((h, i) => (
                          <th
                            key={i}
                            className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint bg-surface/50 ${i === 6 ? 'text-right' : 'text-left'}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {vendors.map((vendor) => {
                        const isExpanded = expandedVendorId === vendor.id;
                        const isEditing = editingVendorId === vendor.id;
                        const accountsForVendor = [...(vendorMembersByVendorId.get(vendor.id) ?? [])].sort(
                          (a, b) => a.display_name.localeCompare(b.display_name),
                        );
                        return (
                          <Fragment key={vendor.id}>
                            <tr
                              onClick={() => {
                                if (isEditing) return;
                                if (isExpanded) {
                                  setExpandedVendorId(null);
                                  setShowVendorMemberFormVendorId(null);
                                } else {
                                  setExpandedVendorId(vendor.id);
                                  setShowVendorMemberFormVendorId(null);
                                  setVendorMemberFormData({ clerk_user_id: '', display_name: '' });
                                }
                              }}
                              className="hover:bg-surface/30 transition-colors cursor-pointer select-none"
                            >
                              <td className="px-5 py-4 text-sm font-semibold text-ink whitespace-nowrap">{vendor.name}</td>
                              <td className="px-5 py-4 text-sm text-ink-muted font-mono whitespace-nowrap">{vendor.slug}</td>
                              <td className="px-5 py-4 text-sm text-ink-muted whitespace-nowrap">{vendor.contact_email}</td>
                              <td className="px-5 py-4 text-sm text-ink-muted whitespace-nowrap">{vendor.venmo_handle ?? '—'}</td>
                              <td className="px-5 py-4 text-sm text-ink-muted whitespace-nowrap">{vendor.zelle_contact ?? '—'}</td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  vendor.is_active
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-surface text-ink-muted border border-line'
                                }`}>
                                  {vendor.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <ChevronDown
                                  size={16}
                                  className={`ml-auto text-ink-faint transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-primary/[0.03]">
                                <td colSpan={7} className="px-5 py-5">
                                  <div className="space-y-6">
                                    {isEditing ? (
                                      <form onSubmit={(e) => handleVendorUpdate(e, vendor.id)} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {[
                                            { label: 'Business name', key: 'name', type: 'text' },
                                            { label: 'Slug', key: 'slug', type: 'text', mono: true },
                                            { label: 'Contact email', key: 'contact_email', type: 'email' },
                                            { label: 'Venmo handle', key: 'venmo_handle', type: 'text' },
                                            { label: 'Zelle contact', key: 'zelle_contact', type: 'text' },
                                          ].map(({ label, key, type, mono }) => (
                                            <div key={key}>
                                              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-faint mb-1">{label}</label>
                                              <input
                                                type={type}
                                                value={editVendorFormData[key as keyof typeof editVendorFormData]}
                                                onChange={(e) => setEditVendorFormData({ ...editVendorFormData, [key]: e.target.value })}
                                                required={['name', 'slug', 'contact_email'].includes(key)}
                                                className={`w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white ${mono ? 'font-mono' : ''}`}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <button
                                            type="submit"
                                            disabled={vendorUpdateLoading}
                                            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60"
                                          >
                                            {vendorUpdateLoading ? 'Saving...' : 'Save'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={cancelVendorEdit}
                                            className="px-4 py-2 bg-surface text-ink-muted text-sm font-semibold rounded-lg hover:bg-line"
                                          >Cancel</button>
                                        </div>
                                      </form>
                                    ) : (
                                      <>
                                        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
                                          {[
                                            { label: 'Business Name', value: vendor.name },
                                            { label: 'Slug', value: vendor.slug, mono: true },
                                            { label: 'Contact Email', value: vendor.contact_email },
                                            { label: 'Venmo Handle', value: vendor.venmo_handle ?? '—' },
                                            { label: 'Zelle Contact', value: vendor.zelle_contact ?? '—' },
                                            { label: 'Added On', value: new Date(vendor.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
                                          ].map(({ label, value, mono }) => (
                                            <div key={label}>
                                              <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint mb-0.5">{label}</dt>
                                              <dd className={`text-ink-muted ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
                                            </div>
                                          ))}
                                        </dl>
                                        <div className="flex gap-2 flex-wrap">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); startVendorEdit(vendor); }}
                                            className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90"
                                          >Edit</button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleVendorToggleActive(vendor); }}
                                            className="px-4 py-1.5 bg-surface text-ink-muted text-xs font-semibold rounded-lg hover:bg-line border border-line"
                                          >
                                            {vendor.is_active ? 'Deactivate' : 'Activate'}
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/vendor/${vendor.slug}`); }}
                                            className="px-4 py-1.5 bg-surface text-ink-muted text-xs font-semibold rounded-lg hover:bg-line border border-line"
                                          >View Panel</button>
                                        </div>
                                      </>
                                    )}

                                    <div className="border-t border-line pt-5">
                                      <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-1">Vendor accounts</h4>
                                      <p className="text-xs text-ink-muted mb-4">
                                        Each staff member uses their own Clerk account.
                                      </p>

                                      {accountsForVendor.length > 0 && (
                                        <div className="rounded-lg border border-line bg-white/70 mb-4 overflow-hidden">
                                          <table className="w-full text-sm">
                                            <thead className="bg-surface/50 border-b border-line">
                                              <tr>
                                                <th className="px-4 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Name</th>
                                                <th className="px-4 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Clerk User ID</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-line">
                                              {accountsForVendor.map((acc) => (
                                                <tr key={acc.id}>
                                                  <td className="px-4 py-2 font-medium text-ink text-sm">{acc.display_name}</td>
                                                  <td className="px-4 py-2 font-mono text-xs text-ink-muted break-all">{acc.clerk_user_id}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}

                                      {showVendorMemberFormVendorId === vendor.id ? (
                                        <form
                                          onSubmit={(e) => handleVendorMemberSubmit(e, vendor.id)}
                                          className="rounded-xl border border-primary/25 bg-white p-4 space-y-3"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                              <label className="block text-xs font-semibold text-ink-muted mb-1">Display name</label>
                                              <input
                                                type="text"
                                                value={vendorMemberFormData.display_name}
                                                onChange={(e) => setVendorMemberFormData({ ...vendorMemberFormData, display_name: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                placeholder="Jamie Lee"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-semibold text-ink-muted mb-1">Clerk User ID</label>
                                              <input
                                                type="text"
                                                value={vendorMemberFormData.clerk_user_id}
                                                onChange={(e) => setVendorMemberFormData({ ...vendorMemberFormData, clerk_user_id: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
                                                placeholder="user_2..."
                                              />
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <button
                                              type="submit"
                                              disabled={vendorMemberFormLoading}
                                              className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60"
                                            >
                                              {vendorMemberFormLoading ? 'Adding...' : 'Add account'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => resetVendorMemberForm()}
                                              className="px-4 py-1.5 bg-surface text-ink-muted text-xs font-semibold rounded-lg hover:bg-line"
                                            >Cancel</button>
                                          </div>
                                        </form>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setVendorMemberFormData({ clerk_user_id: '', display_name: '' });
                                            setShowVendorMemberFormVendorId(vendor.id);
                                          }}
                                          className="flex items-center gap-1.5 px-3 py-1.5 border border-line bg-surface text-ink-muted text-xs font-semibold rounded-lg hover:bg-line transition-colors"
                                        >
                                          <Plus size={12} />
                                          Add vendor account
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TEAM TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'team' && (
          <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-ink font-body">Super admins</h2>
                <p className="text-sm text-ink-muted mt-0.5">
                  Full access to this platform
                </p>
              </div>
              <button
                onClick={() => setShowSuperadminForm(!showSuperadminForm)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={15} />
                {showSuperadminForm ? 'Cancel' : 'Add super admin'}
              </button>
            </div>

            {showSuperadminForm && (
              <div className="bg-white rounded-xl border border-line shadow-sm p-6">
                <h3 className="text-base font-bold text-ink mb-1">Add super admin</h3>
                <p className="text-xs text-ink-muted mb-4">
                  Create the user in Clerk, then paste their Clerk user ID here. Each person is a separate account.
                </p>
                <form onSubmit={handleSuperadminSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">Display name</label>
                      <input
                        type="text"
                        value={superadminFormData.display_name}
                        onChange={(e) => setSuperadminFormData({ ...superadminFormData, display_name: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Alex Chen"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">Clerk User ID</label>
                      <input
                        type="text"
                        value={superadminFormData.clerk_user_id}
                        onChange={(e) => setSuperadminFormData({ ...superadminFormData, clerk_user_id: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
                        placeholder="user_2abc..."
                      />
                      <p className="mt-1 text-[10.5px] text-ink-faint">Clerk Dashboard → Users → copy User ID</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={superadminFormLoading}
                      className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60"
                    >
                      {superadminFormLoading ? 'Adding...' : 'Add super admin'}
                    </button>
                    <button
                      type="button"
                      onClick={resetSuperadminForm}
                      className="px-5 py-2 bg-surface text-ink-muted text-sm font-semibold rounded-lg hover:bg-line"
                    >Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl border border-line shadow-sm overflow-hidden">
              {superadmins.length === 0 ? (
                <div className="p-16 text-center">
                  <p className="text-ink-muted text-sm">No super admins yet. Add one to get started.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint bg-surface/50 text-left">Name</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint bg-surface/50 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {superadmins.map((member) => {
                      const isExpanded = expandedSuperadminId === member.id;
                      const addedOn = new Date(member.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      });
                      return (
                        <Fragment key={member.id}>
                          <tr
                            onClick={() => setExpandedSuperadminId(isExpanded ? null : member.id)}
                            className="hover:bg-surface/30 transition-colors cursor-pointer select-none"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                                  {member.display_name.split(' ').map(s => s[0]).join('')}
                                </div>
                                <span className="text-sm font-semibold text-ink">{member.display_name}</span>
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-primary/10 text-primary">superadmin</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <ChevronDown
                                size={16}
                                className={`ml-auto text-ink-faint transition-transform duration-200 inline-block ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-primary/[0.03]">
                              <td colSpan={2} className="px-5 py-4">
                                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
                                  <div>
                                    <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint mb-0.5">Display Name</dt>
                                    <dd className="text-ink-muted">{member.display_name}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint mb-0.5">Clerk User ID</dt>
                                    <dd className="font-mono text-xs text-ink-muted break-all">{member.clerk_user_id}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint mb-0.5">Added On</dt>
                                    <dd className="text-ink-muted">{addedOn}</dd>
                                  </div>
                                </dl>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PAYOUTS TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'payouts' && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <MoreHorizontal size={22} className="text-ink-faint" />
            </div>
            <h3 className="text-base font-semibold text-ink mb-1">Payouts</h3>
            <p className="text-sm text-ink-muted">Coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
}
