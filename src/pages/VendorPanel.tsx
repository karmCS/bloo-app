import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClerk, useUser, useSession, UserProfile } from '@clerk/react';
import { Meal } from '../lib/supabase';
import { getSupabaseWithAuth } from '../lib/supabaseWithAuth';
import { assertValidImage, extFor, errorMessage } from '../lib/uploads';
import Button from '../components/Button';
import ImageUpload from '../components/ImageUpload';
import DietaryTagPicker from '../components/DietaryTagPicker';
import { getCurrentWeekId, getWeekLabel } from '../lib/weekUtils';
import { Trash2, Plus, LogOut, UserCog, ChevronLeft, Sparkles, Instagram, Mail, Check } from 'lucide-react';

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-1.02-.09z" />
    </svg>
  );
}

const INPUT = 'w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors';
const LABEL = 'block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5';

export default function VendorPanel() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { session } = useSession();

  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [activeSection, setActiveSection] = useState<'menu' | 'profile'>('menu');
  const [profileFormData, setProfileFormData] = useState({ contact_email: '', instagram_handle: '', tiktok_handle: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [meals, setMeals] = useState<Meal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [macroInput, setMacroInput] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [macroError, setMacroError] = useState<string | null>(null);
  const [weekAvailability, setWeekAvailability] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const currentWeekId = getCurrentWeekId();
  const [formData, setFormData] = useState({
    name: '', description: '', image_url: '',
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

  useEffect(() => {
    if (!user || !session || !slug) return;
    const init = async () => {
      const client = await getSupabaseWithAuth(session);
      const { data: vendor } = await client.from('vendors').select('id, name, contact_email, instagram_handle, tiktok_handle').eq('slug', slug).maybeSingle();
      if (!vendor) { navigate('/unauthorized', { replace: true }); return; }

      const { data: vendorUser } = await client.from('vendor_users').select('role, vendor_id').eq('clerk_user_id', user.id).maybeSingle();
      if (!vendorUser || (vendorUser.role !== 'superadmin' && vendorUser.vendor_id !== vendor.id)) {
        navigate('/unauthorized', { replace: true }); return;
      }

      setIsSuperadmin(vendorUser.role === 'superadmin');
      setVendorId(vendor.id);
      setVendorName(vendor.name);
      setProfileFormData({
        contact_email: (vendor as { contact_email?: string | null }).contact_email ?? '',
        instagram_handle: (vendor as { instagram_handle?: string | null }).instagram_handle ?? '',
        tiktok_handle: (vendor as { tiktok_handle?: string | null }).tiktok_handle ?? '',
      });

      const { data: mealsData } = await client.from('meals').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false });
      if (mealsData) setMeals(mealsData as Meal[]);

      const { data: availData } = await client
        .from('meal_availability')
        .select('meal_id, is_available')
        .eq('vendor_id', vendor.id)
        .eq('week_id', currentWeekId);
      const availMap: Record<string, boolean> = {};
      for (const row of availData ?? []) availMap[row.meal_id] = row.is_available;
      setWeekAvailability(availMap);
      setPageReady(true);
    };
    init();
  }, [user?.id, session, slug]);

  const refetchMeals = async () => {
    if (!session || !vendorId) return;
    const client = await getSupabaseWithAuth(session);
    const { data } = await client.from('meals').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
    if (data) setMeals(data as Meal[]);
    const { data: availData } = await client
      .from('meal_availability')
      .select('meal_id, is_available')
      .eq('vendor_id', vendorId)
      .eq('week_id', currentWeekId);
    const map: Record<string, boolean> = {};
    for (const row of availData ?? []) map[row.meal_id] = row.is_available;
    setWeekAvailability(map);
  };

  const toggleAvailability = async (mealId: string) => {
    if (!session || !vendorId || togglingId) return;
    const current = weekAvailability[mealId] ?? false;
    const next = !current;
    setTogglingId(mealId);
    setWeekAvailability(prev => ({ ...prev, [mealId]: next }));
    try {
      const client = await getSupabaseWithAuth(session);
      const { error } = await client
        .from('meal_availability')
        .upsert(
          { meal_id: mealId, vendor_id: vendorId, week_id: currentWeekId, is_available: next, updated_at: new Date().toISOString() },
          { onConflict: 'meal_id,week_id' }
        );
      if (error) {
        setWeekAvailability(prev => ({ ...prev, [mealId]: current }));
        throw error;
      }
    } catch (err) {
      alert(`Failed to update availability: ${errorMessage(err)}`);
    } finally {
      setTogglingId(null);
    }
  };

  const uploadImage = async (file: File) => {
    const mime = assertValidImage(file);
    const client = await getSupabaseWithAuth(session);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extFor(mime)}`;
    const { error } = await client.storage.from('meal-images').upload(path, file, { cacheControl: '3600', upsert: false, contentType: mime });
    if (error) throw error;
    return client.storage.from('meal-images').getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !vendorId || !vendorName) return;
    setIsUploading(true);
    try {
      let imageUrl = formData.image_url;
      if (uploadedFile) imageUrl = await uploadImage(uploadedFile);
      if (!imageUrl) { alert('Please upload an image'); return; }

      const payload = {
        name: formData.name, vendor: vendorName, vendor_id: vendorId,
        description: formData.description || null, image_url: imageUrl,
        price: parseFloat(formData.price) || 0, calories: parseInt(formData.calories) || 0,
        protein: parseInt(formData.protein) || 0, carbs: parseInt(formData.carbs) || 0,
        fats: parseInt(formData.fats) || 0,
        ingredients: formData.ingredients.split(',').map(i => i.trim()),
        dietary_tags: formData.dietary_tags,
        ...(isSuperadmin ? { is_meal_of_week: formData.is_meal_of_week } : {}),
      };

      const client = await getSupabaseWithAuth(session);
      if (editingMeal) {
        const { error } = await client.from('meals').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingMeal.id).eq('vendor_id', vendorId);
        if (error) throw error;
      } else {
        const { error } = await client.from('meals').insert([payload]);
        if (error) throw error;
      }
      resetForm();
      await refetchMeals();
    } catch (err) {
      alert(`Failed to save meal: ${errorMessage(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name, description: meal.description || '', image_url: meal.image_url,
      price: meal.price.toString(), calories: meal.calories.toString(),
      protein: meal.protein.toString(), carbs: meal.carbs.toString(),
      fats: meal.fats.toString(), ingredients: meal.ingredients.join(', '),
      dietary_tags: meal.dietary_tags, is_meal_of_week: meal.is_meal_of_week ?? false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!session || !vendorId) return;
    const client = await getSupabaseWithAuth(session);
    const { error } = await client.from('meals').delete().eq('id', id).eq('vendor_id', vendorId);
    if (error) { alert('Failed to delete meal.'); return; }
    setConfirmDeleteId(null);
    await refetchMeals();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', image_url: '', price: '', calories: '', protein: '', carbs: '', fats: '', ingredients: '', dietary_tags: [], is_meal_of_week: false });
    setUploadedFile(null); setEditingMeal(null); setShowForm(false);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !vendorId) return;
    setProfileSaving(true);
    try {
      const client = await getSupabaseWithAuth(session);
      const { error } = await client.from('vendors').update({
        contact_email: profileFormData.contact_email.trim() || null,
        instagram_handle: profileFormData.instagram_handle.trim().replace(/^@/, '') || null,
        tiktok_handle: profileFormData.tiktok_handle.trim().replace(/^@/, '') || null,
      }).eq('id', vendorId);
      if (error) throw error;
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      alert(`Failed to save profile: ${errorMessage(err)}`);
    } finally {
      setProfileSaving(false);
    }
  };

  if (!pageReady) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-primary" />
      </div>
    );
  }

  const card = 'bg-card rounded-2xl border border-line overflow-hidden';

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-card border-b border-line sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="group flex items-center gap-2 hover:opacity-80 transition-opacity">
              <h1 className="font-display text-2xl font-semibold italic text-primary">bloo</h1>
            </button>
            <div className="border-l border-line pl-4">
              <p className="text-xs text-ink-muted font-sans uppercase tracking-wider">Vendor</p>
              <p className="text-sm font-semibold text-ink">{vendorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSuperadmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="font-display italic text-sm text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1"
              >
                <ChevronLeft size={14} /> return to admin panel
              </button>
            )}
            <Button variant="secondary" className="text-sm py-2" onClick={() => setShowProfile(true)}>
              <UserCog size={15} className="mr-1.5" /> Account
            </Button>
            <Button variant="secondary" className="text-sm py-2" onClick={() => signOut({ redirectUrl: '/' })}>
              <LogOut size={15} className="mr-1.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Section tabs */}
      <div className="border-b border-line bg-card">
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pt-1">
          {(['menu', 'profile'] as const).map(section => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize rounded-t-lg border-b-2 transition-colors duration-150 ${
                activeSection === section
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {section}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6 animate-fadeIn">
        {activeSection === 'menu' && <>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Menu</h2>
            <p className="text-ink-muted text-sm mt-0.5 inline-flex items-center gap-2">
              <span className="live-dot" />
              {meals.length} {meals.length === 1 ? 'dish' : 'dishes'} · catalog-only
            </p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }} className="sheen flex items-center gap-2">
            <Plus size={16} />{showForm ? 'Cancel' : 'Add meal'}
          </Button>
        </div>

        {/* This Week's Menu */}
        <div className={card}>
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-ink">This Week's Menu</h3>
              <p className="text-xs text-ink-muted mt-0.5">{getWeekLabel(currentWeekId)}</p>
            </div>
            <span className="text-xs font-medium text-ink-muted tabular-nums">
              {Object.values(weekAvailability).filter(Boolean).length}/{meals.length} available
            </span>
          </div>
          {meals.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-muted">Add meals to configure weekly availability.</p>
          ) : (
            <ul className="divide-y divide-line">
              {meals.map(meal => {
                const isAvailable = weekAvailability[meal.id] ?? false;
                const isToggling = togglingId === meal.id;
                return (
                  <li key={meal.id} className="flex items-center gap-3 px-5 py-3">
                    <img src={meal.image_url} alt={meal.name} className="w-10 h-10 rounded-xl object-cover border border-line flex-shrink-0" />
                    <span className="flex-1 min-w-0 text-sm font-medium text-ink truncate">{meal.name}</span>
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => toggleAvailability(meal.id)}
                      className={`flex-shrink-0 min-w-[140px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-60 ${
                        isAvailable
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-surface border-line text-ink-muted hover:bg-line'
                      }`}
                    >
                      {isToggling ? '…' : isAvailable ? '✓ Available this week' : 'Off this week'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Meal form */}
        {showForm && (
          <div className={`${card} p-6 animate-liftIn`}>
            <h3 className="font-display text-lg font-semibold text-ink mb-5">
              {editingMeal ? 'Edit meal' : 'New meal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-6 lg:grid-cols-12">
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
                    <label className={LABEL}>Price (USD)</label>
                    <input className={INPUT} type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData(d => ({ ...d, price: e.target.value }))} required placeholder="12.99" />
                    <p className="text-[10px] text-ink-faint mt-1">Displayed for reference — bloo is catalog-only.</p>
                  </div>
                  {isSuperadmin && (
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={formData.is_meal_of_week} onChange={e => setFormData(d => ({ ...d, is_meal_of_week: e.target.checked }))} className="w-4 h-4 accent-primary rounded" />
                      <span className="text-sm font-medium text-ink">Meal of the week</span>
                    </label>
                  )}
                </div>
                <div className="space-y-4 lg:col-span-8">
                  <div>
                    <label className={LABEL}>Description <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
                    <textarea className={`${INPUT} resize-none`} value={formData.description} onChange={e => e.target.value.length <= 500 && setFormData(d => ({ ...d, description: e.target.value }))} rows={2} placeholder="What makes this meal special…" />
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

        {/* Meals table */}
        <div className={card}>
          {meals.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-ink-muted">No meals yet. Click "Add meal" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface border-b border-line">
                  <tr>
                    {['Meal', 'Macros', 'MOTW', 'Actions'].map(h => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {meals.map(meal => (
                    <tr key={meal.id} className="hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={meal.image_url} alt={meal.name} className="w-12 h-12 rounded-xl object-cover border border-line" />
                          <span className="text-sm font-semibold text-ink">{meal.name}</span>
                        </div>
                      </td>
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
        </>}

        {/* Profile section */}
        {activeSection === 'profile' && (
          <div className={`${card} p-6 max-w-xl animate-liftIn`}>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-ink">Profile</h2>
              <p className="text-ink-muted text-sm mt-1">Social handles and contact info shown on your public page.</p>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div>
                <label className={LABEL}>Contact email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
                    <Mail size={15} />
                  </span>
                  <input
                    className={`${INPUT} pl-9`}
                    type="email"
                    value={profileFormData.contact_email}
                    onChange={e => setProfileFormData(d => ({ ...d, contact_email: e.target.value }))}
                    placeholder="orders@yourrestaurant.com"
                  />
                </div>
                <p className="text-[10px] text-ink-faint mt-1">Shown as a "Contact vendor" button on your public page.</p>
              </div>

              <div>
                <label className={LABEL}>Instagram <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
                    <Instagram size={15} />
                  </span>
                  <input
                    className={`${INPUT} pl-9`}
                    value={profileFormData.instagram_handle}
                    onChange={e => setProfileFormData(d => ({ ...d, instagram_handle: e.target.value }))}
                    placeholder="yourhandle"
                    autoComplete="off"
                  />
                </div>
                <p className="text-[10px] text-ink-faint mt-1">Without the @ — e.g. <span className="font-mono">yourhandle</span></p>
              </div>

              <div>
                <label className={LABEL}>TikTok <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
                    <TikTokIcon size={14} />
                  </span>
                  <input
                    className={`${INPUT} pl-9`}
                    value={profileFormData.tiktok_handle}
                    onChange={e => setProfileFormData(d => ({ ...d, tiktok_handle: e.target.value }))}
                    placeholder="yourhandle"
                    autoComplete="off"
                  />
                </div>
                <p className="text-[10px] text-ink-faint mt-1">Without the @ — e.g. <span className="font-mono">yourhandle</span></p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-line">
                <Button type="submit" disabled={profileSaving}>
                  {profileSaving ? 'Saving…' : 'Save profile'}
                </Button>
                {profileSaved && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-macro-green font-semibold animate-fadeIn">
                    <Check size={14} /> Saved
                  </span>
                )}
              </div>
            </form>
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

      {/* Clerk profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowProfile(false)}>
          <div onClick={e => e.stopPropagation()}>
            <UserProfile />
          </div>
        </div>
      )}
    </div>
  );
}
