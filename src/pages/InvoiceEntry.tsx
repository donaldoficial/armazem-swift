import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';
import { FileInput, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

const InvoiceEntry = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reference, setReference] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
  };

  const filtered = search.trim()
    ? products.filter(
        (p) => p.code.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 10)
    : [];

  const handleEntry = async () => {
    if (!selectedProduct || quantity <= 0) return;
    setProcessing(true);

    try {
      // Update stock
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock_quantity: selectedProduct.stock_quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      // Create movement
      const { error: movError } = await supabase.from('stock_movements').insert({
        product_id: selectedProduct.id,
        type: 'entrada',
        quantity,
        reference: reference || 'Entrada manual',
      });

      if (movError) throw movError;

      toast.success(`Entrada de ${quantity} ${selectedProduct.unit} de "${selectedProduct.name}" registrada!`);
      setSelectedProduct(null);
      setQuantity(1);
      setReference('');
      setSearch('');
      loadProducts();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileInput className="w-6 h-6 text-primary" /> Entrada de Mercadoria
        </h1>
        <p className="text-sm text-muted-foreground">Registre entradas de estoque</p>
      </div>

      {/* Search product */}
      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground">Buscar Produto</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" value={search} onChange={(e) => { setSearch(e.target.value); setSelectedProduct(null); }}
              placeholder="Código ou nome do produto..."
              className="pos-input w-full pl-10"
            />
          </div>
          {filtered.length > 0 && !selectedProduct && (
            <div className="mt-1 bg-popover border border-border rounded-md overflow-hidden">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProduct(p); setSearch(p.name); }}
                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{p.code}</span>
                    <span className="text-sm">{p.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Est: {p.stock_quantity}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="pos-card border-primary/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{selectedProduct.name}</p>
                <p className="text-xs text-muted-foreground font-mono">Código: {selectedProduct.code} | Estoque atual: {selectedProduct.stock_quantity} {selectedProduct.unit}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Quantidade</label>
                <input
                  type="number" min="1" value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="pos-input w-full mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Referência (NF, etc.)</label>
                <input
                  type="text" value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: NF 12345"
                  className="pos-input w-full mt-1"
                />
              </div>
            </div>

            <button
              onClick={handleEntry}
              disabled={processing}
              className="pos-btn-primary w-full flex items-center justify-center gap-2 h-10"
            >
              <Plus className="w-4 h-4" />
              {processing ? 'Registrando...' : `Registrar Entrada de ${quantity} ${selectedProduct.unit}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceEntry;
