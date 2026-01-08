import React, { useState, useEffect } from 'react';
import { getAttributesApiClient, CustomerAttribute } from '../../services/attributesApi';
import './CreateTargetGroupModal.css';

interface Condition {
  id: string;
  attribute: string;
  operator: string;
  value: string;
}

interface CreateTargetGroupModalProps {
  onClose: () => void;
  onCreate: (data: { crm_name: string; postgres_table: string; description?: string; sql_query?: string }) => void;
}

export default function CreateTargetGroupModal({ onClose, onCreate }: CreateTargetGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [creationMode, setCreationMode] = useState('rule');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM customer_360 WHERE total_deposit > 2000;');
  const [postgresTable, setPostgresTable] = useState('');
  const [attributes, setAttributes] = useState<CustomerAttribute[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([
    { id: '1', attribute: '', operator: '>', value: '' }
  ]);
  const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>('AND');

  // Auto-gerar nome da tabela baseado no nome do grupo
  React.useEffect(() => {
    if (groupName) {
      const tableName = groupName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      setPostgresTable(tableName || '');
    }
  }, [groupName]);

  // Carregar atributos quando o modo for "rule"
  useEffect(() => {
    if (creationMode === 'rule') {
      loadAttributes();
    }
  }, [creationMode]);

  const loadAttributes = async () => {
    try {
      setLoadingAttributes(true);
      const apiClient = getAttributesApiClient();
      const filterableAttrs = await apiClient.getFilterableAttributes();
      setAttributes(filterableAttrs);
    } catch (error) {
      console.error('Erro ao carregar atributos:', error);
      // Continuar mesmo sem atributos
    } finally {
      setLoadingAttributes(false);
    }
  };

  const addCondition = () => {
    setConditions([...conditions, { 
      id: Date.now().toString(), 
      attribute: '', 
      operator: '>', 
      value: '' 
    }]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id));
    }
  };

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const buildSqlQuery = (): string => {
    const validConditions = conditions.filter(c => c.attribute && (c.value || ['IS NULL', 'IS NOT NULL'].includes(c.operator)));
    
    if (validConditions.length === 0) {
      return 'SELECT * FROM customer_360;';
    }

    const whereClauses = validConditions.map(cond => {
      const attr = attributes.find(a => a.attribute_name === cond.attribute);
      if (!attr) return null;

      // Operadores que não precisam de valor
      if (cond.operator === 'IS NULL' || cond.operator === 'IS NOT NULL') {
        return `${cond.attribute} ${cond.operator}`;
      }

      // Operador IN precisa de valores entre parênteses
      if (cond.operator === 'IN') {
        const values = cond.value.split(',').map(v => v.trim()).filter(Boolean);
        if (values.length === 0) return null;
        
        const formattedValues = values.map(v => {
          if (attr.data_type === 'TEXT') {
            return `'${v.replace(/'/g, "''")}'`;
          } else if (attr.data_type === 'BOOLEAN') {
            return v.toLowerCase() === 'true' ? 'true' : 'false';
          } else if (attr.data_type === 'DATE' || attr.data_type === 'TIMESTAMP') {
            return `'${v}'`;
          }
          return v;
        });
        
        return `${cond.attribute} IN (${formattedValues.join(', ')})`;
      }

      // Operadores LIKE/ILIKE precisam de aspas mesmo para números
      if (cond.operator === 'LIKE' || cond.operator === 'ILIKE') {
        const escapedValue = cond.value.replace(/'/g, "''");
        return `${cond.attribute} ${cond.operator} '%${escapedValue}%'`;
      }

      // Operadores normais (=, !=, >, <, >=, <=)
      let value = cond.value;
      
      // Formatar valor baseado no tipo de dado
      if (attr.data_type === 'TEXT') {
        value = `'${value.replace(/'/g, "''")}'`; // Escapar aspas simples
      } else if (attr.data_type === 'BOOLEAN') {
        value = value.toLowerCase() === 'true' ? 'true' : 'false';
      } else if (attr.data_type === 'DATE' || attr.data_type === 'TIMESTAMP') {
        value = `'${value}'`;
      }
      // NUMERIC e INTEGER não precisam de aspas

      return `${cond.attribute} ${cond.operator} ${value}`;
    }).filter(Boolean);

    return `SELECT * FROM customer_360 WHERE ${whereClauses.join(` ${logicalOperator} `)};`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName || !postgresTable) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(postgresTable)) {
      alert('Nome da tabela inválido. Use apenas letras minúsculas, números e underscore.');
      return;
    }

    // Validar condições se estiver no modo rule
    if (creationMode === 'rule') {
      const validConditions = conditions.filter(c => 
        c.attribute && (c.value || ['IS NULL', 'IS NOT NULL'].includes(c.operator))
      );
      if (validConditions.length === 0) {
        alert('Adicione pelo menos uma condição válida.');
        return;
      }
    }

    // Gerar query SQL baseada nas condições ou usar a query manual
    const finalSqlQuery = creationMode === 'rule' ? buildSqlQuery() : sqlQuery;

    onCreate({
      crm_name: groupName,
      postgres_table: postgresTable,
      description: undefined,
      sql_query: finalSqlQuery,
    });
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-badge">NEW</span>
            <h2>Create Target Group</h2>
            <p className="modal-subtitle">
              Defina um conjunto de clientes baseado em regras ou em uma query SQL direta sobre a `customer_360`.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="field">
            <label>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. High Value Customers"
              required
            />
          </div>

          <div className="field">
            <label>Creation Mode</label>
            <select value={creationMode} onChange={(e) => setCreationMode(e.target.value)}>
              <option value="rule">Rule Builder (AND / OR)</option>
              <option value="sql">SQL Query (customer_360)</option>
            </select>
          </div>

          {creationMode === 'rule' && (
            <div className="conditions">
              <div className="conditions-header">
                <strong>Rule Builder</strong>
                {conditions.length > 1 && (
                  <div className="logical-operator-selector">
                    <label>Operador lógico:</label>
                    <select 
                      value={logicalOperator} 
                      onChange={(e) => setLogicalOperator(e.target.value as 'AND' | 'OR')}
                    >
                      <option value="AND">AND (todas as condições)</option>
                      <option value="OR">OR (qualquer condição)</option>
                    </select>
                  </div>
                )}
              </div>
              
              {loadingAttributes && (
                <div className="loading-attributes">Carregando atributos...</div>
              )}

              {!loadingAttributes && attributes.length === 0 && (
                <div className="no-attributes">
                  Nenhum atributo disponível. Configure a Supabase Service Key em Settings.
                </div>
              )}

              {!loadingAttributes && attributes.length > 0 && (
                <>
                  {conditions.map((condition, index) => (
                    <div key={condition.id} className="condition-row">
                      <select
                        value={condition.attribute}
                        onChange={(e) => updateCondition(condition.id, 'attribute', e.target.value)}
                        required
                      >
                        <option value="">Selecione um atributo</option>
                        {attributes.map(attr => (
                          <option key={attr.id} value={attr.attribute_name}>
                            {attr.display_name} ({attr.data_type})
                          </option>
                        ))}
                      </select>
                      
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                        required
                      >
                        <option value="=">=</option>
                        <option value="!=">≠</option>
                        <option value=">">&gt;</option>
                        <option value=">=">≥</option>
                        <option value="<">&lt;</option>
                        <option value="<=">≤</option>
                        <option value="LIKE">LIKE</option>
                        <option value="ILIKE">ILIKE (case-insensitive)</option>
                        <option value="IN">IN</option>
                        <option value="IS NULL">IS NULL</option>
                        <option value="IS NOT NULL">IS NOT NULL</option>
                      </select>
                      
                      {!['IS NULL', 'IS NOT NULL'].includes(condition.operator) && (
                        <input
                          type="text"
                          placeholder={
                            condition.operator === 'IN' 
                              ? 'Valores separados por vírgula (ex: valor1, valor2)'
                              : condition.operator === 'LIKE' || condition.operator === 'ILIKE'
                              ? 'Texto para buscar'
                              : 'Valor'
                          }
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                          required={!['IS NULL', 'IS NOT NULL'].includes(condition.operator)}
                        />
                      )}
                      
                      {conditions.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-condition"
                          onClick={() => removeCondition(condition.id)}
                          title="Remover condição"
                        >
                          ×
                        </button>
                      )}
                      
                      {index < conditions.length - 1 && (
                        <span className="condition-operator">{logicalOperator}</span>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    className="btn-ghost"
                    onClick={addCondition}
                  >
                    + Adicionar Condição
                  </button>
                  
                  <div className="sql-preview">
                    <strong>Preview SQL:</strong>
                    <code>{buildSqlQuery()}</code>
                  </div>
                </>
              )}
            </div>
          )}

          {creationMode === 'sql' && (
            <div className="field">
              <label>SQL Query</label>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={6}
                placeholder="SELECT * FROM customer_360 WHERE total_deposit > 2000;"
              />
              <div className="helper-text">
                A query pode selecionar de qualquer tabela do schema <code>public</code>. Exemplo:{' '}
                <code>SELECT * FROM customer_360 WHERE net_revenue &gt; 2000;</code>
              </div>
            </div>
          )}

          <div className="footer-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Target Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

