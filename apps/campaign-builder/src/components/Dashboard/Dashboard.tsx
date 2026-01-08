import React, { useState, useEffect } from 'react';
import { getCustomer360ApiClient, Customer360Stats } from '../../services/customer360Api';
import { getSupabaseServiceKey } from '../../services/auth';
import InsightsPanel from './InsightsPanel';
import Chart from './Chart';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState<Customer360Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const serviceKey = getSupabaseServiceKey();
      if (!serviceKey) {
        setError('Configure a Supabase Service Key em Settings');
        setStats(null);
        return;
      }

      const apiClient = getCustomer360ApiClient();
      const data = await apiClient.getStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="dashboard">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadStats}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard">
        <div className="error-state">
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="topbar">
        <h1>Mission Control</h1>
        <div className="user">👤 Guilherme</div>
      </div>

      {/* KPIs Principais */}
      <div className="kpis">
        <div className="kpi kpi-primary">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <h3>Total de Clientes</h3>
            <p className="kpi-value">{formatNumber(stats.totalCustomers)}</p>
            <span className="kpi-change positive">+12% vs mês anterior</span>
          </div>
        </div>

        <div className="kpi kpi-primary">
          <div className="kpi-icon">✅</div>
          <div className="kpi-content">
            <h3>Clientes Ativos</h3>
            <p className="kpi-value">{formatNumber(stats.activeCustomers)}</p>
            <span className="kpi-change positive">
              {((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1)}% do total
            </span>
          </div>
        </div>

        <div className="kpi kpi-primary">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>Receita Total</h3>
            <p className="kpi-value">{formatCurrency(stats.totalRevenue)}</p>
            <span className="kpi-change positive">+8.5% vs mês anterior</span>
          </div>
        </div>

        <div className="kpi kpi-primary">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <h3>LTV Médio</h3>
            <p className="kpi-value">{formatCurrency(stats.avgLTV)}</p>
            <span className="kpi-change positive">+5.2% vs mês anterior</span>
          </div>
        </div>
      </div>

      {/* KPIs Secundários */}
      <div className="kpis kpis-secondary">
        <div className="kpi">
          <h3>Total Deposits</h3>
          <p>{formatCurrency(stats.totalDeposits)}</p>
        </div>

        <div className="kpi">
          <h3>Total Withdraws</h3>
          <p>{formatCurrency(stats.totalWithdraws)}</p>
        </div>

        <div className="kpi">
          <h3>Avg Deposit</h3>
          <p>{formatCurrency(stats.avgDeposit)}</p>
        </div>

        <div className="kpi">
          <h3>Churn Risk</h3>
          <p className="kpi-danger">{formatNumber(stats.churnRiskCount)}</p>
          <span className="kpi-subtext">
            {((stats.churnRiskCount / stats.totalCustomers) * 100).toFixed(1)}% do total
          </span>
        </div>

        <div className="kpi">
          <h3>High Value</h3>
          <p className="kpi-success">{formatNumber(stats.highValueCount)}</p>
          <span className="kpi-subtext">
            {((stats.highValueCount / stats.totalCustomers) * 100).toFixed(1)}% do total
          </span>
        </div>

        <div className="kpi">
          <h3>Avg Churn Score</h3>
          <p>{stats.avgChurnScore.toFixed(1)}</p>
        </div>

        <div className="kpi">
          <h3>Avg Engagement</h3>
          <p>{stats.avgEngagementScore.toFixed(1)}</p>
        </div>

        <div className="kpi">
          <h3>Avg Value Score</h3>
          <p>{stats.avgValueScore.toFixed(1)}</p>
        </div>
      </div>

      {/* AI Insights */}
      <InsightsPanel stats={stats} />

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="section">
          <Chart
            title="Receita por Mês"
            data={stats.revenueByMonth.map(m => ({ label: m.month, value: m.revenue }))}
            type="line"
            height={200}
          />
        </div>

        <div className="section">
          <Chart
            title="Distribuição por Segmento"
            data={stats.segmentDistribution.map(s => ({ label: s.segment, value: s.count }))}
            type="pie"
            height={200}
          />
        </div>

        <div className="section">
          <Chart
            title="Distribuição por Tier"
            data={stats.tierDistribution.map(t => ({ label: t.tier, value: t.count }))}
            type="bar"
            height={200}
          />
        </div>
      </div>

      {/* Top Segmentos por Receita */}
      {stats.topSegments.length > 0 && (
        <div className="section">
          <h2>Top Segmentos por Receita</h2>
          <table>
            <thead>
              <tr>
                <th>Segmento</th>
                <th>Receita</th>
                <th>Clientes</th>
                <th>Receita/Cliente</th>
              </tr>
            </thead>
            <tbody>
              {stats.topSegments.map((segment, index) => (
                <tr key={index}>
                  <td><strong>{segment.segment}</strong></td>
                  <td>{formatCurrency(segment.revenue)}</td>
                  <td>{formatNumber(segment.customers)}</td>
                  <td>{formatCurrency(segment.revenue / segment.customers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Campaigns */}
      <div className="section">
        <h2>Active Campaigns</h2>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Target Group</th>
              <th>Action</th>
              <th>Channel</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="status">Running</span></td>
              <td>High Value Buyers</td>
              <td>Free Shipping</td>
              <td>Email</td>
              <td>25</td>
            </tr>
            <tr>
              <td><span className="status">Running</span></td>
              <td>Churn Risk</td>
              <td>Bonus Offer</td>
              <td>Push</td>
              <td>20</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
