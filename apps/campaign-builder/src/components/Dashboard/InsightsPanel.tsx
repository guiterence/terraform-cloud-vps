import React from 'react';
import { Customer360Stats } from '../../services/customer360Api';
import './InsightsPanel.css';

interface InsightsPanelProps {
  stats: Customer360Stats;
}

interface Insight {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  icon: string;
}

export default function InsightsPanel({ stats }: InsightsPanelProps) {
  const insights: Insight[] = [];

  // Lógica de insights baseada em métricas
  const churnRate = (stats.churnRiskCount / stats.totalCustomers) * 100;
  const activeRate = (stats.activeCustomers / stats.totalCustomers) * 100;
  const avgRevenuePerCustomer = stats.totalRevenue / stats.totalCustomers;

  // Insight 1: Churn Risk
  if (churnRate > 15) {
    insights.push({
      type: 'danger',
      title: 'Alto Risco de Churn',
      message: `${stats.churnRiskCount} clientes (${churnRate.toFixed(1)}%) estão em risco de churn. Considere criar campanhas de retenção urgentes.`,
      icon: '⚠️'
    });
  } else if (churnRate > 10) {
    insights.push({
      type: 'warning',
      title: 'Atenção ao Churn',
      message: `${stats.churnRiskCount} clientes (${churnRate.toFixed(1)}%) apresentam risco de churn. Monitore de perto e considere ações preventivas.`,
      icon: '📊'
    });
  } else {
    insights.push({
      type: 'success',
      title: 'Churn Controlado',
      message: `Apenas ${churnRate.toFixed(1)}% dos clientes estão em risco de churn. Continue mantendo a qualidade do serviço.`,
      icon: '✅'
    });
  }

  // Insight 2: Active Customers
  if (activeRate < 70) {
    insights.push({
      type: 'warning',
      title: 'Taxa de Ativação Baixa',
      message: `Apenas ${activeRate.toFixed(1)}% dos clientes estão ativos. Considere campanhas de reativação para os ${stats.totalCustomers - stats.activeCustomers} clientes inativos.`,
      icon: '📉'
    });
  } else {
    insights.push({
      type: 'success',
      title: 'Excelente Engajamento',
      message: `${activeRate.toFixed(1)}% dos clientes estão ativos. Mantenha o foco em retenção e crescimento.`,
      icon: '🚀'
    });
  }

  // Insight 3: High Value Customers
  const highValueRate = (stats.highValueCount / stats.totalCustomers) * 100;
  if (highValueRate > 20) {
    insights.push({
      type: 'success',
      title: 'Alta Concentração de Alto Valor',
      message: `${stats.highValueCount} clientes (${highValueRate.toFixed(1)}%) são de alto valor. Foque em programas VIP e retenção premium.`,
      icon: '💎'
    });
  } else if (highValueRate < 10) {
    insights.push({
      type: 'warning',
      title: 'Oportunidade de Upsell',
      message: `Apenas ${highValueRate.toFixed(1)}% são clientes de alto valor. Considere estratégias de upsell e cross-sell.`,
      icon: '📈'
    });
  }

  // Insight 4: Revenue per Customer
  if (avgRevenuePerCustomer > 3000) {
    insights.push({
      type: 'success',
      title: 'Receita por Cliente Excelente',
      message: `Receita média de R$ ${avgRevenuePerCustomer.toFixed(2)} por cliente. Continue focado em valor, não apenas volume.`,
      icon: '💰'
    });
  } else if (avgRevenuePerCustomer < 2000) {
    insights.push({
      type: 'warning',
      title: 'Oportunidade de Aumentar Receita',
      message: `Receita média de R$ ${avgRevenuePerCustomer.toFixed(2)} por cliente. Há espaço para aumentar o ticket médio.`,
      icon: '💡'
    });
  }

  // Insight 5: Engagement Score
  if (stats.avgEngagementScore > 70) {
    insights.push({
      type: 'success',
      title: 'Engajamento Alto',
      message: `Score médio de engajamento de ${stats.avgEngagementScore.toFixed(1)}. Clientes estão muito engajados com a marca.`,
      icon: '🎯'
    });
  } else if (stats.avgEngagementScore < 50) {
    insights.push({
      type: 'danger',
      title: 'Engajamento Preocupante',
      message: `Score médio de engajamento de apenas ${stats.avgEngagementScore.toFixed(1)}. Revise estratégias de comunicação e experiência.`,
      icon: '🔔'
    });
  }

  // Insight 6: Churn Score
  if (stats.avgChurnScore > 60) {
    insights.push({
      type: 'danger',
      title: 'Risco de Churn Elevado',
      message: `Score médio de churn de ${stats.avgChurnScore.toFixed(1)}. Ação imediata necessária para retenção.`,
      icon: '🚨'
    });
  } else if (stats.avgChurnScore < 30) {
    insights.push({
      type: 'success',
      title: 'Baixo Risco de Churn',
      message: `Score médio de churn de apenas ${stats.avgChurnScore.toFixed(1)}. Clientes estão bem retidos.`,
      icon: '🛡️'
    });
  }

  return (
    <div className="insights-panel">
      <h2>
        <span className="insights-icon">🤖</span>
        AI Insights
      </h2>
      <div className="insights-list">
        {insights.slice(0, 6).map((insight, index) => (
          <div key={index} className={`insight insight-${insight.type}`}>
            <div className="insight-header">
              <span className="insight-icon">{insight.icon}</span>
              <h3>{insight.title}</h3>
            </div>
            <p>{insight.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

