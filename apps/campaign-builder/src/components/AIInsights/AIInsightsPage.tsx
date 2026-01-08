import React, { useState, useRef, useEffect } from 'react';
import { Customer360Stats } from '../../services/customer360Api';
import { getCustomer360ApiClient } from '../../services/customer360Api';
import { getSupabaseServiceKey } from '../../services/auth';
import './AIInsightsPage.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIInsightsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu assistente de insights. Posso analisar seus dados de customer_360 e fornecer insights inteligentes. Como posso ajudar?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Customer360Stats | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    console.log('AIInsightsPage montado');
    loadStats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug: garantir que o componente renderiza
  console.log('AIInsightsPage renderizando', { messagesCount: messages.length });

  const loadStats = async () => {
    try {
      const serviceKey = getSupabaseServiceKey();
      if (!serviceKey) {
        return;
      }
      const apiClient = getCustomer360ApiClient();
      const data = await apiClient.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const generateInsight = (question: string, stats: Customer360Stats): string => {
    const lowerQuestion = question.toLowerCase();

    // Análise de Churn
    if (lowerQuestion.includes('churn') || lowerQuestion.includes('risco')) {
      const churnRate = (stats.churnRiskCount / stats.totalCustomers) * 100;
      if (churnRate > 15) {
        return `🚨 **Alerta de Churn Alto**: ${stats.churnRiskCount} clientes (${churnRate.toFixed(1)}%) estão em risco de churn. O score médio de churn é ${stats.avgChurnScore.toFixed(1)}. Recomendo criar campanhas de retenção urgentes focadas nesses clientes.`;
      } else if (churnRate > 10) {
        return `⚠️ **Atenção ao Churn**: ${stats.churnRiskCount} clientes (${churnRate.toFixed(1)}%) apresentam risco moderado. Score médio: ${stats.avgChurnScore.toFixed(1)}. Considere ações preventivas.`;
      } else {
        return `✅ **Churn Controlado**: Apenas ${churnRate.toFixed(1)}% dos clientes estão em risco. Score médio: ${stats.avgChurnScore.toFixed(1)}. Continue mantendo a qualidade do serviço.`;
      }
    }

    // Análise de Receita
    if (lowerQuestion.includes('receita') || lowerQuestion.includes('revenue') || lowerQuestion.includes('faturamento')) {
      const avgRevenuePerCustomer = stats.totalRevenue / stats.totalCustomers;
      return `💰 **Análise de Receita**:\n\n• Receita Total: R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n• Receita por Cliente: R$ ${avgRevenuePerCustomer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n• Total de Depósitos: R$ ${stats.totalDeposits.toLocaleString('pt-BR')}\n• Total de Saques: R$ ${stats.totalWithdraws.toLocaleString('pt-BR')}\n\n${avgRevenuePerCustomer > 3000 ? 'Excelente receita por cliente! Continue focado em valor.' : 'Há oportunidade de aumentar o ticket médio.'}`;
    }

    // Análise de Segmentos
    if (lowerQuestion.includes('segmento') || lowerQuestion.includes('segment')) {
      const topSegment = stats.segmentDistribution[0];
      return `📊 **Análise de Segmentos**:\n\nO maior segmento é "${topSegment?.segment || 'N/A'}" com ${topSegment?.count || 0} clientes.\n\nDistribuição:\n${stats.segmentDistribution.slice(0, 5).map(s => `• ${s.segment}: ${s.count} clientes`).join('\n')}\n\nRecomendação: Foque em campanhas personalizadas para cada segmento.`;
    }

    // Análise de Alto Valor
    if (lowerQuestion.includes('alto valor') || lowerQuestion.includes('high value') || lowerQuestion.includes('vip')) {
      const highValueRate = (stats.highValueCount / stats.totalCustomers) * 100;
      return `💎 **Clientes de Alto Valor**:\n\n• Total: ${stats.highValueCount} clientes (${highValueRate.toFixed(1)}%)\n• Score médio de valor: ${stats.avgValueScore.toFixed(1)}\n\n${highValueRate > 20 ? 'Excelente concentração de clientes premium! Foque em programas VIP.' : 'Oportunidade de upsell e cross-sell para aumentar o valor dos clientes.'}`;
    }

    // Análise de Engajamento
    if (lowerQuestion.includes('engajamento') || lowerQuestion.includes('engagement') || lowerQuestion.includes('ativo')) {
      const activeRate = (stats.activeCustomers / stats.totalCustomers) * 100;
      return `🎯 **Análise de Engajamento**:\n\n• Clientes Ativos: ${stats.activeCustomers} (${activeRate.toFixed(1)}%)\n• Score médio de engajamento: ${stats.avgEngagementScore.toFixed(1)}\n\n${activeRate < 70 ? `⚠️ ${stats.totalCustomers - stats.activeCustomers} clientes inativos. Considere campanhas de reativação.` : '✅ Excelente taxa de ativação! Mantenha o foco em retenção.'}`;
    }

    // Análise Geral
    if (lowerQuestion.includes('geral') || lowerQuestion.includes('resumo') || lowerQuestion.includes('overview') || lowerQuestion.includes('dashboard')) {
      return `📈 **Visão Geral do Negócio**:\n\n• **Total de Clientes**: ${stats.totalCustomers.toLocaleString('pt-BR')}\n• **Clientes Ativos**: ${stats.activeCustomers.toLocaleString('pt-BR')} (${((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1)}%)\n• **Receita Total**: R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n• **LTV Médio**: R$ ${stats.avgLTV.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n• **Risco de Churn**: ${stats.churnRiskCount} clientes\n• **Alto Valor**: ${stats.highValueCount} clientes\n\n**Scores Médios**:\n• Churn: ${stats.avgChurnScore.toFixed(1)}\n• Engajamento: ${stats.avgEngagementScore.toFixed(1)}\n• Valor: ${stats.avgValueScore.toFixed(1)}`;
    }

    // Resposta padrão
    return `Analisando seus dados de customer_360...\n\nPosso ajudar com:\n• Análise de churn e risco\n• Análise de receita e LTV\n• Segmentação de clientes\n• Análise de engajamento\n• Clientes de alto valor\n• Visão geral do negócio\n\nFaça uma pergunta específica para obter insights detalhados!`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simular processamento
    setTimeout(() => {
      if (!stats) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Não foi possível carregar os dados. Verifique se a Supabase Service Key está configurada em Settings.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setLoading(false);
        return;
      }

      const insight = generateInsight(input, stats);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: insight,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className="ai-insights-page"
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f6fa',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div 
        className="ai-insights-header"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #8a2be2, #9370db)',
          color: '#ffffff',
          flexShrink: 0
        }}
      >
        <div className="ai-insights-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <span className="ai-icon" style={{ fontSize: '32px' }}>🤖</span>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>AI Insights</h1>
        </div>
        <div className="ai-insights-subtitle" style={{ fontSize: '14px', opacity: 0.9, marginLeft: '48px' }}>
          Assistent inteligente para análise de dados
        </div>
      </div>

      <div className="ai-insights-chat">
        <div className="ai-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message ai-message-${message.role}`}
            >
              <div className="ai-message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="ai-message-content">
                <div className="ai-message-text">
                  {message.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="ai-message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-avatar">🤖</div>
              <div className="ai-message-content">
                <div className="ai-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pergunte sobre churn, receita, segmentos, engajamento..."
            className="ai-input"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="ai-send-button"
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}

