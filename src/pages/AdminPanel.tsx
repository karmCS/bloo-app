import { useState } from 'react';
import { supabase, Meal } from '../lib/supabase';
import { useMeals } from '../hooks/useMeals';
import Button from '../components/Button';
import ImageUpload from '../components/ImageUpload';
import { Trash2, Plus, LogOut, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { meals, refetch } = useMeals();
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    description: '',
    image_url: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    ingredients: '',
    dietary_tags: '',
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
        description: formData.description || null,
        image_url: imageUrl,
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

      if (editingMeal) {
        const updateData = {
          ...baseMealData,
          updated_at: new Date().toISOString(),
        };
        console.log('Update data being sent to Supabase:', updateData);

        const { data, error } = await supabase
          .from('meals')
          .update(updateData)
          .eq('id', editingMeal.id)
          .select();

        console.log('Update response:', { data, error });
        if (error) throw error;
      } else {
        const insertData = {
          ...baseMealData,
          week_id: '2026-W13',
        };
        console.log('Insert data being sent to Supabase:', insertData);

        const { data, error } = await supabase.from('meals').insert([insertData]).select();
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
      description: meal.description || '',
      image_url: meal.image_url,
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
      const { error } = await supabase.from('meals').delete().eq('id', id);
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
      description: '',
      image_url: '',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="text-primary" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-primary font-brand tracking-wide">bloo</h1>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Admin Portal</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="secondary">
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 font-meal mb-1">Manage Meals</h2>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-meal">
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
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="Fresh Kitchen Co."
                  />
                </div>
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

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {meals.length === 0 ? (
            <div className="p-16 text-center">
              <UtensilsCrossed className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 text-lg">No meals added yet. Click "Add New Meal" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-gray-200">
                  <tr>
                    {['Meal', 'Vendor', 'Macros', 'Actions'].map((h) => (
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
                  {meals.map((meal) => (
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
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-vendor">
                        {meal.vendor}
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
      </main>
    </div>
  );
}