import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, StockMovement, Sale, SaleItem } from '@/types/database';
import { Search, Package, DollarSign, TrendingUp } from 'lucide-react';

type Tab = 'estoque' | 'financeiro' | 'produto';

const Reports = () => {
  const [tab, setTab] = useState<Tab>('estoque');

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {([
          { key: 'estoque' as Tab, label: 'Estoque', icon: Package },
          { key: 'financeiro' as Tab, label: 'Financeiro', icon: DollarSign },
          { key: 'produto' as Tab, label: 'Buscar Produto', icon: Search },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'estoque' && <StockReport />}
      {tab === 'financeiro' && <FinancialReport />}
      {tab === 'produto' && <ProductSearch />}
    </div>
  );
};

const StockReport = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    supabase.from('products').select('*').order('name').then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = products.filter((p) => {
    if (filter === 'low') return p.stock_quantity > 0 && p.stock_quantity <= p.min_stock;
    if (filter === 'out') return p.stock_quantity <= 0;
    return true;
  });

  const totalValue = products.reduce((s, p) => s + p.stock_quantity * p.cost_price, 0);
  const totalSaleValue = products.reduce((s, p) => s + p.stock_quantity * p.sale_price, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Valor em Estoque (Custo)</p>
          <p className="text-xl font-bold font-mono text-foreground">R$ {totalValue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Valor em Estoque (Venda)</p>
          <p className="text-xl font-bold font-mono text-primary">R$ {totalSaleValue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Total de Produtos</p>
          <p className="text-xl font-bold font-mono">{products.length}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'low', 'out'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'low' ? 'Estoque Baixo' : 'Sem Estoque'}
          </button>
        ))}
      </div>

      <div className="pos-card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3">Código</th><th className="p-3">Produto</th>
              <th className="p-3 text-right">Estoque</th><th className="p-3 text-right">Mínimo</th>
              <th className="p-3 text-right">Valor Unit.</th><th className="p-3 text-right">Valor Total</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="table-row-hover border-b border-border/50">
                <td className="p-3 font-mono text-xs">{p.code}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3 text-right font-mono">{p.stock_quantity}</td>
                <td className="p-3 text-right font-mono text-muted-foreground">{p.min_stock}</td>
                <td className="p-3 text-right font-mono">R$ {Number(p.sale_price).toFixed(2)}</td>
                <td className="p-3 text-right font-mono text-primary">R$ {(p.stock_quantity * p.sale_price).toFixed(2)}</td>
                <td className="p-3 text-center">
                  {p.stock_quantity <= 0 ? <span className="badge-danger">Sem estoque</span>
                    : p.stock_quantity <= p.min_stock ? <span className="badge-warning">Baixo</span>
                    : <span className="badge-success">OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FinancialReport = () => {
  const [salesToday, setSalesToday] = useState<Sale[]>([]);
  const [salesMonth, setSalesMonth] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    Promise.all([
      supabase.from('sales').select('*').gte('created_at', today + 'T00:00:00').order('created_at', { ascending: false }),
      supabase.from('sales').select('*').gte('created_at', monthStart).order('created_at', { ascending: false }),
    ]).then(([todayRes, monthRes]) => {
      setSalesToday(todayRes.data || []);
      setSalesMonth(monthRes.data || []);
      setLoading(false);
    });
  }, []);

  const totalToday = salesToday.reduce((s, v) => s + Number(v.total), 0);
  const totalMonth = salesMonth.reduce((s, v) => s + Number(v.total), 0);
  const avgTicket = salesMonth.length > 0 ? totalMonth / salesMonth.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Vendas Hoje</p>
          <p className="text-xl font-bold font-mono text-primary">R$ {totalToday.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{salesToday.length} venda(s)</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Vendas no Mês</p>
          <p className="text-xl font-bold font-mono text-info">R$ {totalMonth.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{salesMonth.length} venda(s)</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Ticket Médio</p>
          <p className="text-xl font-bold font-mono">R$ {avgTicket.toFixed(2)}</p>
        </div>
      </div>

      <h3 className="font-semibold mt-4">Vendas de Hoje</h3>
      <div className="pos-card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3">Hora</th><th className="p-3">Pagamento</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
            ) : salesToday.length === 0 ? (
              <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Nenhuma venda hoje</td></tr>
            ) : salesToday.map((s) => (
              <tr key={s.id} className="table-row-hover border-b border-border/50">
                <td className="p-3 font-mono text-xs">{new Date(s.created_at).toLocaleTimeString('pt-BR')}</td>
                <td className="p-3 capitalize">{s.payment_method}</td>
                <td className="p-3 text-right font-mono text-primary">R$ {Number(s.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProductSearch = () => {
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setProduct(null);

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .or(`code.ilike.%${search}%,name.ilike.%${search}%`)
      .limit(1);

    if (products && products.length > 0) {
      const p = products[0];
      setProduct(p);

      const { data: movs } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', p.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setMovements(movs || []);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Código ou nome do produto..."
            className="pos-input w-full pl-10"
          />
        </div>
        <button onClick={handleSearch} className="pos-btn-primary">Buscar</button>
      </div>

      {loading && <p className="text-muted-foreground">Buscando...</p>}

      {product && (
        <div className="space-y-4">
          <div className="pos-card space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{product.name}</p>
                <p className="text-sm text-muted-foreground font-mono">Código: {product.code}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold font-mono text-primary">{product.stock_quantity}</p>
                <p className="text-xs text-muted-foreground">em estoque</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              <div><p className="text-xs text-muted-foreground">Preço Venda</p><p className="font-mono font-bold">R$ {Number(product.sale_price).toFixed(2)}</p></div>
              <div><p className="text-xs text-muted-foreground">Preço Custo</p><p className="font-mono">R$ {Number(product.cost_price).toFixed(2)}</p></div>
              <div><p className="text-xs text-muted-foreground">Estoque Mín.</p><p className="font-mono">{product.min_stock}</p></div>
            </div>
          </div>

          <h3 className="font-semibold">Movimentações</h3>
          <div className="pos-card !p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="p-3">Data</th><th className="p-3">Tipo</th>
                  <th className="p-3 text-right">Qtd</th><th className="p-3">Referência</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem movimentações</td></tr>
                ) : movements.map((m) => (
                  <tr key={m.id} className="table-row-hover border-b border-border/50">
                    <td className="p-3 font-mono text-xs">{new Date(m.created_at).toLocaleString('pt-BR')}</td>
                    <td className="p-3">
                      {m.type === 'entrada' ? <span className="badge-success">Entrada</span> : <span className="badge-danger">Saída</span>}
                    </td>
                    <td className="p-3 text-right font-mono">{m.quantity}</td>
                    <td className="p-3 text-muted-foreground">{m.reference || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !product && search && (
        <p className="text-muted-foreground">Produto não encontrado</p>
      )}
    </div>
  );
};

export default Reports;
