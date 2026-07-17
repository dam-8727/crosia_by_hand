import { useEffect, useState } from 'react';
import { api } from '../../api';
import AdminNav from './AdminNav';
import './Admin.css';

const CATEGORIES = ['Decor', 'Storage', 'Living', 'Wear & Carry'];

const emptyForm = {
  name: '',
  category: 'Decor',
  price: '',
  stock: '',
  color: '',
  material: 'Handmade crochet',
  description: '',
  imageUrl: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function startEdit(p) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      color: p.color || '',
      material: p.material || 'Handmade crochet',
      description: p.description || '',
      imageUrl: p.imageUrl,
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: form.stock === '' ? undefined : Number(form.stock),
      };
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await api.deleteProduct(p._id);
    await load();
  }

  return (
    <section className="admin">
      <AdminNav />

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit product' : 'Add new product'}</h2>
        {error && <p className="form-error">{error}</p>}

        <div className="admin-form-grid">
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Category
            <select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Price (₹)
            <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
          </label>
          <label>
            Stock
            <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="10" />
          </label>
          <label>
            Color
            <input name="color" value={form.color} onChange={handleChange} />
          </label>
          <label>
            Material
            <input name="material" value={form.material} onChange={handleChange} />
          </label>
          <label className="span-2">
            Product image
            <div className="image-input-row">
              {form.imageUrl && (
                <img src={form.imageUrl} alt="preview" className="image-preview" />
              )}
              <div className="image-input-fields">
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="Paste image URL, or upload a file below"
                  required
                />
                <div className="upload-line">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && <span className="upload-status">Uploading…</span>}
                </div>
              </div>
            </div>
          </label>
          <label className="span-2">
            Description
            <textarea name="description" rows={2} value={form.description} onChange={handleChange} />
          </label>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
            {saving ? 'Saving…' : editingId ? 'Update product' : 'Add product'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="admin-list-title">All products ({products.length})</h2>
      {loading ? (
        <p className="page-status">Loading…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td><img src={p.imageUrl} alt={p.name} className="admin-thumb" /></td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>₹{p.price}</td>
                  <td>{p.stock}</td>
                  <td className="admin-row-actions">
                    <button className="linkish" onClick={() => startEdit(p)}>Edit</button>
                    <button className="linkish danger" onClick={() => handleDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
