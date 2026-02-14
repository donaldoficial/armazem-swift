import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, CartItem } from '@/types/database';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const POS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [processing, setProcessing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(products.slice(0, 20));
    } else {
      const q = search.toLowerCase();
      setFiltered(
        products.filter(
          (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
        ).slice(0, 20)
      );
    }
  }, [search, products]);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').gt('stock_quantity', 0).order('name');
    setProducts(data || []);
  };

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error('Estoque insuficiente!');
          return prev;
        }
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearch('');
    searchRef.current?.focus();
  }, []);

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id !== productId) return c;
          const newQty = c.quantity + delta;
          if (newQty > c.product.stock_quantity) {
            toast.error('Estoque insuficiente!');
            return c;
          }
          return { ...c, quantity: newQty };
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const total = cart.reduce((sum, c) => sum + c.quantity * c.product.sale_price, 0);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filtered.length === 1) {
      addToCart(filtered[0]);
    }
  };

  const finalizeSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    try {
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({ total, payment_method: paymentMethod })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const items = cart.map((c) => ({
        sale_id: sale.id,
        product_id: c.product.id,
        product_name: c.product.name,
        quantity: c.quantity,
        unit_price: c.product.sale_price,
        subtotal: c.quantity * c.product.sale_price,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(items);
      if (itemsError) throw itemsError;

      // Update stock & create movements
      for (const c of cart) {
        await supabase
          .from('products')
          .update({ stock_quantity: c.product.stock_quantity - c.quantity })
          .eq('id', c.product.id);

        await supabase.from('stock_movements').insert({
          product_id: c.product.id,
          type: 'saida',
          quantity: c.quantity,
          reference: `Venda #${sale.id.slice(0, 8)}`,
        });
      }

      toast.success(`Venda finalizada! Total: R$ ${total.toFixed(2)}`);
      setCart([]);
      loadProducts();
      searchRef.current?.focus();
    } catch (err: any) {
      toast.error('Erro ao finalizar venda: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
    { value: 'cartao', label: 'Cartão', icon: CreditCard },
    { value: 'pix', label: 'PIX', icon: QrCode },
  ];

  return (
    <div className="flex h-screen">
      {/* Left - Product search */}
      <div className="flex-1 flex flex-col p-4 border-r border-border">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar por código ou nome... (Enter para adicionar)"
            className="pos-input w-full pl-10 text-base h-12"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="pos-card text-left hover:border-primary/50 transition-all cursor-pointer active:scale-[0.98]"
              >
                <p className="font-mono text-xs text-muted-foreground">{product.code}</p>
                <p className="font-medium text-sm truncate mt-1">{product.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-primary font-bold font-mono">
                    R$ {Number(product.sale_price).toFixed(2)}
                  </span>
                  <span className={`text-xs font-mono ${product.stock_quantity <= product.min_stock ? 'text-warning' : 'text-muted-foreground'}`}>
                    Est: {product.stock_quantity}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground mt-10">Nenhum produto encontrado</p>
          )}
        </div>
      </div>

      {/* Right - Cart */}
      <div className="w-96 flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">Carrinho</h2>
          <p className="text-xs text-muted-foreground">{cart.length} item(s)</p>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {cart.map((item) => (
            <div key={item.product.id} className="pos-card flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    R$ {Number(item.product.sale_price).toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <button onClick={() => removeFromCart(item.product.id)} className="text-destructive hover:brightness-125 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.product.id, -1)} className="pos-btn-secondary !p-1 !px-2">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-sm w-8 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, 1)} className="pos-btn-secondary !p-1 !px-2">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="font-bold font-mono text-primary">
                  R$ {(item.quantity * Number(item.product.sale_price)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <p className="text-center text-muted-foreground mt-10 text-sm">
              Busque e clique nos produtos para adicionar
            </p>
          )}
        </div>

        {/* Payment & total */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex gap-2">
            {paymentMethods.map((pm) => (
              <button
                key={pm.value}
                onClick={() => setPaymentMethod(pm.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md border transition-all text-xs font-medium ${
                  paymentMethod === pm.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                <pm.icon className="w-4 h-4" />
                {pm.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between py-3 border-t border-border">
            <span className="text-muted-foreground font-medium">TOTAL</span>
            <span className="text-3xl font-bold font-mono text-primary">
              R$ {total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={finalizeSale}
            disabled={cart.length === 0 || processing}
            className="pos-btn-primary w-full h-12 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            {processing ? 'Processando...' : 'Finalizar Venda (F2)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
