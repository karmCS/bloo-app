import { Fragment, useState, useEffect, useMemo } from 'react';
import { useClerk, useUser, useSession } from '@clerk/react';
import { supabase, Meal } from '../lib/supabase';
import { getSupabaseWithAuth } from '../lib/supabaseWithAuth';
import { useMeals } from '../hooks/useMeals';
import Button from '../components/Button';
import ImageUpload from '../components/ImageUpload';
import { Trash2, Plus, LogOut, UtensilsCrossed, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState<'meals' | 'team'>('meals');
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

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
    name: '',
    slug: '',
    contact_email: '',
    venmo_handle: '',
    zelle_contact: '',
  });
  const [superadminFormData, setSuperadminFormData] = useState({
    clerk_user_id: '',
    display_name: '',
  });
  const [vendorMemberFormData, setVendorMemberFormData] = useState({
    clerk_user_id: '',
    display_name: '',
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

  useEffect(() => {
    if (!user || !session) return;
    const fetchRole = async () => {
      const authedSupabase = await getSupabaseWithAuth(session);
      const { data } = await authedSupabase
        .from('vendor_users')
        .select('role')
        .eq('clerk_user_id', user.id)
        .maybeSingle();
      if (data?.role === 'superadmin') setWelcomeMessage('Welcome, Admin');
    };
    fetchRole();
  }, [user?.id, session]);

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
    if (activeTab !== 'team' || !session) return;
    fetchTeamData();
  }, [activeTab, session]);

  // ── Meals handlers ────────────────────────────────────────────────────────
  const handleLogout = () => {
    signOut({ redirectUrl: '/' });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('meal-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let imageUrl = formData.image_url;

      if (uploadedFile) {
        imageUrl = await uploadImage(uploadedFile);
      }

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

      console.log('Base meal data:', baseMealData);
      console.log('Editing meal?', !!editingMeal, editingMeal?.id);

      const authedSupabase = await getSupabaseWithAuth(session);

      if (editingMeal) {
        const updateData = {
          ...baseMealData,
          updated_at: new Date().toISOString(),
        };
        console.log('meal payload:', updateData);

        const { data, error } = await authedSupabase
          .from('meals')
          .update(updateData)
          .eq('id', editingMeal.id)
          .select();

        console.log('Update response:', { data, error });
        if (error) throw error;
      } else {
        console.log('meal payload:', baseMealData);

        const { data, error } = await authedSupabase.from('meals').insert([baseMealData]).select();
        console.log('Insert response:', { data, error });
        if (error) throw error;
      }
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error saving meal - Full error object:', error);
      console.error('Error message:', (error as any)?.message);
      console.error('Error details:', (error as any)?.details);
      console.error('Error hint:', (error as any)?.hint);
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
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
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
    setUploadedFile(null);
    setEditingMeal(null);
    setShowForm(false);
  };

  const handleImageSelect = (file: File) => {
    setUploadedFile(file);
  };

  const handleImageRemove = () => {
    setUploadedFile(null);
    setFormData({ ...formData, image_url: '' });
  };

  // ── Vendor row expand / edit / toggle handlers ───────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <UtensilsCrossed className="text-primary" size={28} />
              <div className="text-left">
                <h1 className="text-2xl font-bold text-primary font-brand tracking-wide">bloo</h1>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Admin Portal</p>
                {welcomeMessage && (
                  <p className="text-xs text-primary font-medium mt-0.5">{welcomeMessage}</p>
                )}
              </div>
            </button>
            <Button onClick={handleLogout} variant="secondary">
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Tab switcher ─────────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-gray-200 mb-8">
          {(['meals', 'team'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            MEALS TAB
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'meals' && (
          <>
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 font-sans mb-1">Manage Meals</h2>
                <p className="text-gray-600">Create and manage your weekly menu</p>
              </div>
              <Button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-6 py-3"
              >
                <Plus size={20} />
                {showForm ? 'Cancel' : 'Add New Meal'}
              </Button>
            </div>

            {showForm && (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-10 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-sans">
                  {editingMeal ? 'Edit Meal' : 'Add New Meal'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Meal Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="Grilled Salmon Bowl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Vendor
                      </label>
                      <select
                        value={formData.vendor_id}
                        onChange={(e) => {
                          const id = e.target.value;
                          const name = activeVendors.find((v) => v.id === id)?.name ?? '';
                          setFormData({ ...formData, vendor_id: id, vendor: name });
                        }}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white"
                      >
                        <option value="">— select a vendor —</option>
                        {activeVendors.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      placeholder="12.99"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 500) {
                          setFormData({ ...formData, description: value });
                        }
                      }}
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                      placeholder="Highlight what makes this meal special - ingredients, preparation style, or story..."
                    />
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs font-medium ${formData.description.length > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {formData.description.length}/500
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meal Image
                    </label>
                    <ImageUpload
                      onImageSelect={handleImageSelect}
                      currentImageUrl={formData.image_url}
                      onImageRemove={handleImageRemove}
                      disabled={isUploading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Nutrition Information
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(['calories', 'protein', 'carbs', 'fats'] as const).map((field) => (
                        <div key={field}>
                          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
                            {field === 'calories' ? 'Calories' : `${field.charAt(0).toUpperCase() + field.slice(1)} (g)`}
                          </label>
                          <input
                            type="number"
                            value={formData[field]}
                            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ingredients (comma-separated)
                    </label>
                    <textarea
                      value={formData.ingredients}
                      onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                      placeholder="Wild salmon, quinoa, avocado, cherry tomatoes, lemon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dietary Tags (comma-separated, optional)
                    </label>
                    <input
                      type="text"
                      value={formData.dietary_tags}
                      onChange={(e) => setFormData({ ...formData, dietary_tags: e.target.value })}
                      placeholder="keto, gluten-free, high-protein"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="px-8 py-3" disabled={isUploading}>
                      {isUploading ? 'Uploading...' : editingMeal ? 'Update Meal' : 'Add Meal'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={resetForm} className="px-8 py-3" disabled={isUploading}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {meals.length > 0 && (
              <div className="mb-6 -mx-1 px-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Filter by vendor</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth touch-pan-x [scrollbar-width:thin]">
                  <button
                    type="button"
                    onClick={() => setMealsVendorFilterId(null)}
                    className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-sans font-medium transition-colors ${
                      mealsVendorFilterId === null
                        ? 'bg-primary text-white shadow-sm'
                        : 'border-2 border-primary bg-white text-primary hover:bg-blue-50/80'
                    }`}
                  >
                    All
                  </button>
                  {activeVendors.map((v) => {
                    const active = mealsVendorFilterId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setMealsVendorFilterId(v.id)}
                        className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-sans font-medium transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-primary text-white shadow-sm'
                            : 'border-2 border-primary bg-white text-primary hover:bg-blue-50/80'
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {meals.length === 0 ? (
                <div className="p-16 text-center">
                  <UtensilsCrossed className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500 text-lg">No meals added yet. Click "Add New Meal" to get started.</p>
                </div>
              ) : filteredMeals.length === 0 ? (
                <div className="p-16 text-center">
                  <p className="text-gray-500 text-lg font-sans">No meals for this vendor. Choose another filter or add a meal.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-gray-200">
                      <tr>
                        {['Meal', 'Vendor', 'Price', 'Macros', 'Actions'].map((h) => (
                          <th
                            key={h}
                            className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-700 ${h === 'Actions' ? 'text-right' : 'text-left'}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredMeals.map((meal) => (
                        <tr key={meal.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={meal.image_url}
                                alt={meal.name}
                                className="w-16 h-16 rounded-lg object-cover mr-4 border border-gray-200"
                              />
                              <div className="text-base font-bold text-gray-900 font-meal">{meal.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-sans">
                            {meal.vendor}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            ${meal.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700 font-medium">
                            {meal.calories} cal | {meal.protein}g P | {meal.carbs}g C | {meal.fats}g F
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                            {confirmDeleteId === meal.id ? (
                              <div className="flex items-center justify-end gap-3">
                                <span className="text-gray-600 text-sm font-semibold">Delete this meal?</span>
                                <button
                                  onClick={() => handleDelete(meal.id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => handleEdit(meal)}
                                  className="px-4 py-2 bg-blue-100 text-primary rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(meal.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={20} />
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
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TEAM TAB
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'team' && (
          <div className="space-y-12">

            {/* ── Super admins (platform team) ─────────────────────────────── */}
            <section>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 font-sans mb-1">Super admins</h2>
                  <p className="text-gray-600">
                    Full access to this platform. Each admin must use their own Clerk account — do not share one login.
                  </p>
                </div>
                <Button
                  onClick={() => setShowSuperadminForm(!showSuperadminForm)}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <Plus size={20} />
                  {showSuperadminForm ? 'Cancel' : 'Add super admin'}
                </Button>
              </div>

              {showSuperadminForm && (
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Add super admin</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Invite a teammate by creating their user in Clerk, then paste their Clerk user ID here. Each person is a separate account.
                  </p>
                  <form onSubmit={handleSuperadminSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={superadminFormData.display_name}
                          onChange={(e) => setSuperadminFormData({ ...superadminFormData, display_name: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                          placeholder="Alex Chen"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Clerk User ID
                        </label>
                        <input
                          type="text"
                          value={superadminFormData.clerk_user_id}
                          onChange={(e) => setSuperadminFormData({ ...superadminFormData, clerk_user_id: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-mono text-sm"
                          placeholder="user_2abc..."
                        />
                        <p className="mt-1.5 text-xs text-gray-400">
                          Clerk Dashboard → Users → select the user → copy User ID
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="submit" className="px-8 py-3" disabled={superadminFormLoading}>
                        {superadminFormLoading ? 'Adding...' : 'Add super admin'}
                      </Button>
                      <Button type="button" variant="secondary" onClick={resetSuperadminForm} className="px-8 py-3">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {superadmins.length === 0 ? (
                  <div className="p-16 text-center">
                    <p className="text-gray-500 text-lg">No super admins yet. Add one to get started.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-700 text-left">Name</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-700 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {superadmins.map((member) => {
                        const isExpanded = expandedSuperadminId === member.id;
                        const addedOn = new Date(member.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        });
                        return (
                          <Fragment key={member.id}>
                            <tr
                              onClick={() => setExpandedSuperadminId(isExpanded ? null : member.id)}
                              className="hover:bg-blue-50/30 transition-colors cursor-pointer select-none"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-gray-800">{member.display_name}</span>
                                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                    superadmin
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <ChevronDown
                                  size={18}
                                  className={`ml-auto text-gray-400 transition-transform duration-200 inline-block ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-blue-50/40">
                                <td colSpan={2} className="px-6 py-5">
                                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm">
                                    <div>
                                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Display Name</dt>
                                      <dd className="text-gray-700">{member.display_name}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Clerk User ID</dt>
                                      <dd className="font-mono text-gray-700 break-all">{member.clerk_user_id}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Added On</dt>
                                      <dd className="text-gray-700">{addedOn}</dd>
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
            </section>

            {/* ── Vendors section ──────────────────────────────────────────── */}
            <section>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 font-sans mb-1">Vendors</h2>
                  <p className="text-gray-600">
                    Partner businesses on the platform. Open a row to manage the business and each vendor&apos;s separate sign-in accounts.
                  </p>
                </div>
                <Button
                  onClick={() => setShowVendorForm(!showVendorForm)}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <Plus size={20} />
                  {showVendorForm ? 'Cancel' : 'Add Vendor'}
                </Button>
              </div>

              {showVendorForm && (
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Add Vendor</h3>
                  <form onSubmit={handleVendorSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={vendorFormData.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setVendorFormData({ ...vendorFormData, name, slug: toSlug(name) });
                          }}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                          placeholder="Fresh Kitchen Co."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Slug
                        </label>
                        <input
                          type="text"
                          value={vendorFormData.slug}
                          onChange={(e) => setVendorFormData({ ...vendorFormData, slug: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-mono text-sm"
                          placeholder="fresh-kitchen-co"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={vendorFormData.contact_email}
                        onChange={(e) => setVendorFormData({ ...vendorFormData, contact_email: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="owner@freshkitchen.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Venmo Handle
                        </label>
                        <input
                          type="text"
                          value={vendorFormData.venmo_handle}
                          onChange={(e) => setVendorFormData({ ...vendorFormData, venmo_handle: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                          placeholder="@FreshKitchen"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Zelle Contact
                        </label>
                        <input
                          type="text"
                          value={vendorFormData.zelle_contact}
                          onChange={(e) => setVendorFormData({ ...vendorFormData, zelle_contact: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                          placeholder="owner@freshkitchen.com or phone"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="submit" className="px-8 py-3" disabled={vendorFormLoading}>
                        {vendorFormLoading ? 'Adding...' : 'Add Vendor'}
                      </Button>
                      <Button type="button" variant="secondary" onClick={resetVendorForm} className="px-8 py-3">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {vendors.length === 0 ? (
                  <div className="p-16 text-center">
                    <p className="text-gray-500 text-lg">No vendors yet. Add one to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-gray-200">
                        <tr>
                          {['Name', 'Slug', 'Contact Email', 'Venmo', 'Zelle', 'Status'].map((h) => (
                            <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-700 text-left">{h}</th>
                          ))}
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-700 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
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
                                className="hover:bg-blue-50/30 transition-colors cursor-pointer select-none"
                              >
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{vendor.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{vendor.slug}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{vendor.contact_email}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{vendor.venmo_handle ?? '—'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{vendor.zelle_contact ?? '—'}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${vendor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {vendor.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <ChevronDown size={18} className={`ml-auto text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-blue-50/40">
                                  <td colSpan={7} className="px-6 py-5">
                                    <div className="space-y-8">
                                      {isEditing ? (
                                        <form onSubmit={(e) => handleVendorUpdate(e, vendor.id)} className="space-y-4">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Business Name</label>
                                              <input type="text" value={editVendorFormData.name} onChange={(e) => setEditVendorFormData({ ...editVendorFormData, name: e.target.value })} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Slug</label>
                                              <input type="text" value={editVendorFormData.slug} onChange={(e) => setEditVendorFormData({ ...editVendorFormData, slug: e.target.value })} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono" />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Contact Email</label>
                                              <input type="email" value={editVendorFormData.contact_email} onChange={(e) => setEditVendorFormData({ ...editVendorFormData, contact_email: e.target.value })} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Venmo Handle</label>
                                              <input type="text" value={editVendorFormData.venmo_handle} onChange={(e) => setEditVendorFormData({ ...editVendorFormData, venmo_handle: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Zelle Contact</label>
                                              <input type="text" value={editVendorFormData.zelle_contact} onChange={(e) => setEditVendorFormData({ ...editVendorFormData, zelle_contact: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                                            </div>
                                          </div>
                                          <div className="flex gap-2 pt-1">
                                            <Button type="submit" className="px-5 py-2 text-sm" disabled={vendorUpdateLoading}>
                                              {vendorUpdateLoading ? 'Saving...' : 'Save'}
                                            </Button>
                                            <Button type="button" variant="secondary" className="px-5 py-2 text-sm" onClick={cancelVendorEdit}>
                                              Cancel
                                            </Button>
                                          </div>
                                        </form>
                                      ) : (
                                        <>
                                          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-3 text-sm mb-5">
                                            <div>
                                              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Business Name</dt>
                                              <dd className="text-gray-700">{vendor.name}</dd>
                                            </div>
                                            <div>
                                              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Slug</dt>
                                              <dd className="font-mono text-gray-700">{vendor.slug}</dd>
                                            </div>
                                            <div>
                                              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Contact Email</dt>
                                              <dd className="text-gray-700">{vendor.contact_email}</dd>
                                            </div>
                                            <div>
                                              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Venmo Handle</dt>
                                              <dd className="text-gray-700">{vendor.venmo_handle ?? '—'}</dd>
                                            </div>
                                            <div>
                                              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Zelle Contact</dt>
                                              <dd className="text-gray-700">{vendor.zelle_contact ?? '—'}</dd>
                                            </div>
                                            <div>
                                              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Added On</dt>
                                              <dd className="text-gray-700">{new Date(vendor.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</dd>
                                            </div>
                                          </dl>
                                          <div className="flex gap-2 flex-wrap">
                                            <Button className="px-5 py-2 text-sm" onClick={(e) => { e.stopPropagation(); startVendorEdit(vendor); }}>
                                              Edit
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              className="px-5 py-2 text-sm"
                                              onClick={(e) => { e.stopPropagation(); handleVendorToggleActive(vendor); }}
                                            >
                                              {vendor.is_active ? 'Deactivate' : 'Activate'}
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              className="px-5 py-2 text-sm"
                                              onClick={(e) => { e.stopPropagation(); navigate(`/admin/vendor/${vendor.slug}`); }}
                                            >
                                              View Panel
                                            </Button>
                                          </div>
                                        </>
                                      )}

                                      <div className="border-t border-gray-200 pt-6">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
                                          Vendor accounts
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-4">
                                          Each staff member signs in with their own Clerk account. Add one row per person — do not reuse a single &quot;master&quot; login for everyone.
                                        </p>

                                        {accountsForVendor.length > 0 ? (
                                          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white/80 mb-4">
                                            <table className="w-full text-sm">
                                              <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                                                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Clerk User ID</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-100">
                                                {accountsForVendor.map((acc) => (
                                                  <tr key={acc.id}>
                                                    <td className="px-4 py-2 font-medium text-gray-900">{acc.display_name}</td>
                                                    <td className="px-4 py-2 font-mono text-xs text-gray-700 break-all">{acc.clerk_user_id}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-gray-500 mb-4">No vendor accounts yet for this business.</p>
                                        )}

                                        {showVendorMemberFormVendorId === vendor.id ? (
                                          <form
                                            onSubmit={(e) => handleVendorMemberSubmit(e, vendor.id)}
                                            className="rounded-xl border border-primary/30 bg-white p-5 space-y-4"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                              <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Display name</label>
                                                <input
                                                  type="text"
                                                  value={vendorMemberFormData.display_name}
                                                  onChange={(e) => setVendorMemberFormData({ ...vendorMemberFormData, display_name: e.target.value })}
                                                  required
                                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                                  placeholder="Jamie Lee"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Clerk User ID</label>
                                                <input
                                                  type="text"
                                                  value={vendorMemberFormData.clerk_user_id}
                                                  onChange={(e) => setVendorMemberFormData({ ...vendorMemberFormData, clerk_user_id: e.target.value })}
                                                  required
                                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono"
                                                  placeholder="user_2..."
                                                />
                                              </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                              <Button type="submit" className="px-5 py-2 text-sm" disabled={vendorMemberFormLoading}>
                                                {vendorMemberFormLoading ? 'Adding...' : 'Add account'}
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="secondary"
                                                className="px-5 py-2 text-sm"
                                                onClick={() => resetVendorMemberForm()}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </form>
                                        ) : (
                                          <Button
                                            type="button"
                                            variant="secondary"
                                            className="px-5 py-2 text-sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setVendorMemberFormData({ clerk_user_id: '', display_name: '' });
                                              setShowVendorMemberFormVendorId(vendor.id);
                                            }}
                                          >
                                            <Plus size={16} className="inline mr-1.5 -mt-0.5" />
                                            Add vendor account
                                          </Button>
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
            </section>

          </div>
        )}
      </main>
    </div>
  );
}
