import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClerk, useUser, useSession, UserProfile } from '@clerk/react';
import { supabase, Meal } from '../lib/supabase';
import { getSupabaseWithAuth } from '../lib/supabaseWithAuth';
import ImageUpload from '../components/ImageUpload';
import { Trash2, Plus, ChevronLeft, MoreHorizontal } from 'lucide-react';

type VendorTab = 'pass' | 'menu' | 'analytics' | 'payouts' | 'settings';

export default function VendorPanel() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { session } = useSession();

  // ── Vendor / page state ───────────────────────────────────────────────────
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [activeTab, setActiveTab] = useState<VendorTab>('menu');

  // ── Meals state ───────────────────────────────────────────────────────────
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
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

  // ── Profile modal ─────────────────────────────────────────────────────────
  const [showProfile, setShowProfile] = useState(false);

  // ── Initialise: verify access, then fetch meals ───────────────────────────
  useEffect(() => {
    if (!user || !session || !slug) return;

    const init = async () => {
      const authedSupabase = await getSupabaseWithAuth(session);

      const { data: vendor } = await authedSupabase
        .from('vendors')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle();

      if (!vendor) {
        navigate('/unauthorized', { replace: true });
        return;
      }

      const { data: vendorUser } = await authedSupabase
        .from('vendor_users')
        .select('role, vendor_id')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      const hasAccess =
        vendorUser?.role === 'superadmin' ||
        vendorUser?.vendor_id === vendor.id;

      if (!hasAccess) {
        navigate('/unauthorized', { replace: true });
        return;
      }

      setIsSuperadmin(vendorUser?.role === 'superadmin');
      setVendorId(vendor.id);
      setVendorName(vendor.name);

      const { data: mealsData } = await authedSupabase
        .from('meals')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (mealsData) setMeals(mealsData as Meal[]);
      setPageReady(true);
    };

    init();
  }, [user?.id, session, slug]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const refetchMeals = async () => {
    if (!session || !vendorId) return;
    const authedSupabase = await getSupabaseWithAuth(session);
    const { data } = await authedSupabase
      .from('meals')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    if (data) setMeals(data as Meal[]);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('meal-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ── Meals handlers ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !vendorId || !vendorName) return;
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
        vendor: vendorName,
        vendor_id: vendorId,
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
          .eq('vendor_id', vendorId);
        if (error) throw error;
      } else {
        const { error } = await authedSupabase
          .from('meals')
          .insert([baseMealData]);
        if (error) throw error;
      }

      resetForm();
      await refetchMeals();
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
    if (!session || !vendorId) return;
    try {
      const authedSupabase = await getSupabaseWithAuth(session);
      const { error } = await authedSupabase
        .from('meals')
        .delete()
        .eq('id', id)
        .eq('vendor_id', vendorId);
      if (error) throw error;
      setConfirmDeleteId(null);
      await refetchMeals();
    } catch {
      alert('Failed to delete meal. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
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

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.firstName?.[0] ?? '?';

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!pageReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const TABS: { key: VendorTab; label: string }[] = [
    { key: 'pass', label: 'Pass' },
    { key: 'menu', label: 'Menu' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'payouts', label: 'Payouts' },
    { key: 'settings', label: 'Settings' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-line px-6 py-0 flex items-center gap-5 h-[68px] shrink-0">
        {/* Brand + vendor */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/')}
            className="font-brand text-2xl font-semibold text-primary tracking-tight hover:opacity-80 transition-opacity"
          >
            bloo
          </button>
          <div className="w-px h-6 bg-line" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink text-[15px]">{vendorName}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              kitchen open
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex gap-1 ml-8 h-full">
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

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-6 text-right">
          <div>
            <div className="text-[9.5px] uppercase tracking-wider font-label text-ink-faint font-semibold">Meals live</div>
            <div className="font-brand text-xl font-semibold text-ink leading-tight">{meals.length}</div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => { setShowForm(true); setActiveTab('menu'); }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus size={14} />
          New meal
        </button>

        {isSuperadmin && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1 px-3 py-2 text-[13px] font-medium text-ink-muted border border-line rounded-lg hover:bg-surface transition-colors shrink-0"
          >
            <ChevronLeft size={14} />
            Admin
          </button>
        )}

        <button
          onClick={() => setShowProfile(true)}
          className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-[12px] flex items-center justify-center shrink-0 hover:bg-primary/25 transition-colors"
        >
          {initials}
        </button>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">

        {/* ── Pass tab: orders kanban ──────────────────────────────────── */}
        {activeTab === 'pass' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 grid grid-cols-4 gap-3.5 p-6 overflow-auto">
              {(['New', 'In the pass', 'Ready', 'Picked up'] as const).map((col) => (
                <div key={col} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 px-1">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${
                      col === 'New' ? 'bg-primary/10 text-primary' :
                      col === 'In the pass' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      col === 'Ready' ? 'bg-green-50 text-green-700 border border-green-200' :
                      'bg-surface text-ink-muted'
                    }`}>{col}</span>
                    <span className="text-[11.5px] text-ink-faint">0</span>
                    {col === 'New' && (
                      <span className="ml-auto flex items-center gap-1 text-[10.5px] text-primary font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                        live
                      </span>
                    )}
                  </div>
                  <div
                    className="p-6 border-2 border-dashed border-line rounded-xl text-center text-[11.5px] text-ink-faint"
                  >
                    No tickets yet
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Menu tab: meal management ────────────────────────────────── */}
        {activeTab === 'menu' && (
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-ink font-body">Menu</h2>
                <p className="text-sm text-ink-muted mt-0.5">
                  {meals.length} meal{meals.length !== 1 ? 's' : ''} on your menu
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={15} />
                {showForm ? 'Cancel' : 'Add meal'}
              </button>
            </div>

            {/* Meal form */}
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
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Meal name
                        </label>
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
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Price (USD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
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
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Nutrition
                        </label>
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
                          required
                          rows={3}
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

            {/* Meals table */}
            <div className="bg-white rounded-xl border border-line shadow-sm overflow-hidden">
              {meals.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
                    <Plus size={24} className="text-ink-faint" />
                  </div>
                  <p className="text-ink-muted text-sm">No meals yet. Add your first meal above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line">
                        {['Meal', 'Price', 'Macros', 'Actions'].map((h) => (
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
                      {meals.map((meal) => (
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
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-ink tabular-nums">
                            ${meal.price.toFixed(2)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs text-ink-muted font-medium tabular-nums">
                            {meal.calories} cal · {meal.protein}g P · {meal.carbs}g C · {meal.fats}g F
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {confirmDeleteId === meal.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-ink-muted text-xs font-medium">Delete?</span>
                                <button
                                  onClick={() => handleDelete(meal.id)}
                                  className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors font-semibold"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-3 py-1.5 bg-surface text-ink-muted text-xs rounded-lg hover:bg-line transition-colors font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(meal)}
                                  className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-lg hover:bg-primary/20 transition-colors font-semibold"
                                >
                                  Edit
                                </button>
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

        {/* ── Placeholder tabs ─────────────────────────────────────────── */}
        {(activeTab === 'analytics' || activeTab === 'payouts' || activeTab === 'settings') && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <MoreHorizontal size={22} className="text-ink-faint" />
            </div>
            <h3 className="text-base font-semibold text-ink mb-1 capitalize">{activeTab}</h3>
            <p className="text-sm text-ink-muted">Coming soon</p>
          </div>
        )}
      </main>

      {/* ── Logout footer ─────────────────────────────────────────────────── */}
      <div className="border-t border-line bg-white px-6 py-3 flex items-center justify-end gap-3">
        <button
          onClick={() => signOut({ redirectUrl: '/' })}
          className="text-xs text-ink-muted hover:text-ink font-medium transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* ── Clerk UserProfile modal ───────────────────────────────────────── */}
      {showProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowProfile(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <UserProfile />
          </div>
        </div>
      )}
    </div>
  );
}
