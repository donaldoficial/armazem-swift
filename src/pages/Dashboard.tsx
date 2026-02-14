import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, AlertTriangle, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    salesToday: 0,
    salesMonth: 0,
    stockValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [productsRes, lowStockRes, salesTodayRes, salesMonthRes] = await Promise.all([
        supabase.from('products').select('id, stock_quantity, sale_price, cost_price', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }).lt('stock_quantity', 5),
        supabase.from('sales').select('total').gte('created_at', today + 'T00:00:00'),
        supabase.from('sales').select('total').gte('created_at', monthStart),
      ]);

      const products = productsRes.data || [];
      const stockValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0);
      const salesToday = (salesTodayRes.data || []).reduce((sum, s) => sum + Number(s.total), 0);
      const salesMonth = (salesMonthRes.data || []).reduce((sum, s) => sum + Number(s.total), 0);

      setStats({
        totalProducts: productsRes.count || 0,
        lowStock: lowStockRes.count || 0,
        salesToday,
        salesMonth,
        stockValue,
      });
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Vendas Hoje', value: `R$ ${stats.salesToday.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
    { label: 'Vendas no Mês', value: `R$ ${stats.salesMonth.toFixed(2)}`, icon: TrendingUp, color: 'text-info' },
    { label: 'Produtos Cadastrados', value: stats.totalProducts, icon: Package, color: 'text-foreground' },
    { label: 'Estoque Baixo', value: stats.lowStock, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Valor em Estoque', value: `R$ ${stats.stockValue.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do seu armazém</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold font-mono">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/pdv" className="stat-card group cursor-pointer hover:border-primary/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Abrir PDV</h3>
                    <p className="text-xs text-muted-foreground">Iniciar nova venda</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
            <Link to="/produtos" className="stat-card group cursor-pointer hover:border-primary/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Gerenciar Produtos</h3>
                    <p className="text-xs text-muted-foreground">Cadastrar e editar produtos</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
