import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';
import { Plus, Pencil, Trash2, X, Save, Search } from 'lucide-react';
import { toast } from 'sonner';

const emptyProduct = {
  code: '', name: '', description: '', category: '', unit: 'UN',
  cost_price: 0, sale_price: 0, stock_quantity: 0, min_stock: 0,
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
    setLoading(false);
  };

  const filtered = products.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyProduct);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      code: p.code, name: p.name, description: p.description || '',
      category: p.category || '', unit: p.unit, cost_price: p.cost_price,
      sale_price: p.sale_price, stock_quantity: p.stock_quantity, min_stock: p.min_stock,
    });
    setEditing(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name || !form.sale_price) {
      toast.error('Preencha código, nome e preço de venda');
      return;
    }

    if (editing) {
      const { error } = await supabase.from('products').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing);
      if (error) { toast.error(error.message); return; }
      toast.success('Produto atualizado!');
    } else {
      const { error } = await supabase.from('products').insert(form);
      if (error) { toast.error(error.message); return; }
      toast.success('Produto cadastrado!');
    }

    setShowForm(false);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Produto excluído');
    loadProducts();
  };

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} produto(s) cadastrado(s)</p>
        </div>
        <button onClick={openAdd} className="pos-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código ou nome..."
          className="pos-input w-full pl-10"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Código *</label>
                <input className="pos-input w-full mt-1" value={form.code} onChange={(e) => updateField('code', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Unidade</label>
                <input className="pos-input w-full mt-1" value={form.unit} onChange={(e) => updateField('unit', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Nome *</label>
                <input className="pos-input w-full mt-1" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Descrição</label>
                <input className="pos-input w-full mt-1" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Categoria</label>
                <input className="pos-input w-full mt-1" value={form.category} onChange={(e) => updateField('category', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Estoque Mínimo</label>
                <input type="number" className="pos-input w-full mt-1" value={form.min_stock} onChange={(e) => updateField('min_stock', Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Preço Custo</label>
                <input type="number" step="0.01" className="pos-input w-full mt-1" value={form.cost_price} onChange={(e) => updateField('cost_price', Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Preço Venda *</label>
                <input type="number" step="0.01" className="pos-input w-full mt-1" value={form.sale_price} onChange={(e) => updateField('sale_price', Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Qtd Estoque</label>
                <input type="number" className="pos-input w-full mt-1" value={form.stock_quantity} onChange={(e) => updateField('stock_quantity', Number(e.target.value))} />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowForm(false)} className="pos-btn-secondary">Cancelar</button>
              <button onClick={handleSave} className="pos-btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="pos-card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3">Código</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Categoria</th>
              <th className="p-3 text-right">Custo</th>
              <th className="p-3 text-right">Venda</th>
              <th className="p-3 text-right">Estoque</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Nenhum produto encontrado</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="table-row-hover border-b border-border/50">
                  <td className="p-3 font-mono text-xs">{p.code}</td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.category || '-'}</td>
                  <td className="p-3 text-right font-mono">R$ {Number(p.cost_price).toFixed(2)}</td>
                  <td className="p-3 text-right font-mono text-primary">R$ {Number(p.sale_price).toFixed(2)}</td>
                  <td className="p-3 text-right font-mono">{p.stock_quantity}</td>
                  <td className="p-3 text-center">
                    {p.stock_quantity <= 0 ? (
                      <span className="badge-danger">Sem estoque</span>
                    ) : p.stock_quantity <= p.min_stock ? (
                      <span className="badge-warning">Baixo</span>
                    ) : (
                      <span className="badge-success">OK</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-destructive/20 text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
