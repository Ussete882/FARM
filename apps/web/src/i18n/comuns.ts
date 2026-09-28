/**
 * Rótulos que se repetem por todo o sistema.
 *
 * «Código», «Talhão», «Data», «Estado» aparecem em quase todas as tabelas.
 * Escrever as três línguas em cada ecrã seria copiar a mesma tradução vinte
 * vezes — e bastaria uma cópia ficar para trás para o mesmo cabeçalho aparecer
 * em duas línguas no mesmo ecrã.
 */

import type { T } from '@bastet/nucleo/i18n';

/** Cabeçalhos de coluna comuns. */
export const COL = {
  codigo: { pt: 'Código', en: 'Code', zh: '编码' },
  designacao: { pt: 'Designação', en: 'Name', zh: '名称' },
  nome: { pt: 'Nome', en: 'Name', zh: '姓名' },
  tipo: { pt: 'Tipo', en: 'Type', zh: '类型' },
  estado: { pt: 'Estado', en: 'Status', zh: '状态' },
  data: { pt: 'Data', en: 'Date', zh: '日期' },
  talhao: { pt: 'Talhão', en: 'Plot', zh: '地块' },
  bloco: { pt: 'Bloco', en: 'Block', zh: '区' },
  equipa: { pt: 'Equipa', en: 'Team', zh: '班组' },
  cultura: { pt: 'Cultura', en: 'Crop', zh: '作物' },
  area: { pt: 'Área', en: 'Area', zh: '面积' },
  quantidade: { pt: 'Quantidade', en: 'Quantity', zh: '数量' },
  responsavel: { pt: 'Responsável', en: 'Supervisor', zh: '负责人' },
  trabalhador: { pt: 'Trabalhador', en: 'Worker', zh: '工人' },
  categoria: { pt: 'Categoria', en: 'Category', zh: '类别' },
  observacoes: { pt: 'Observações', en: 'Notes', zh: '备注' },
  meta: { pt: 'Meta', en: 'Target', zh: '目标' },
  desvio: { pt: 'Desvio', en: 'Deviation', zh: '偏差' },
  previsto: { pt: 'Previsto', en: 'Planned', zh: '计划' },
  real: { pt: 'Real', en: 'Actual', zh: '实际' },
  jornas: { pt: 'Jornas', en: 'Worker-days', zh: '工日' },
  custo: { pt: 'Custo', en: 'Cost', zh: '成本' },
  operacao: { pt: 'Operação', en: 'Operation', zh: '作业' },
  hora: { pt: 'Hora', en: 'Time', zh: '时间' },
  decisao: { pt: 'Decisão', en: 'Decision', zh: '决定' },
  gravidade: { pt: 'Gravidade', en: 'Severity', zh: '严重程度' },
  indicador: { pt: 'Indicador', en: 'Indicator', zh: '指标' },
  dono: { pt: 'Dono', en: 'Owner', zh: '责任人' },
  frequencia: { pt: 'Frequência', en: 'Frequency', zh: '频率' },
  fonte: { pt: 'Fonte', en: 'Source', zh: '来源' },
} satisfies Record<string, T>;

/** Palavras soltas de interface. */
export const UI = {
  sim: { pt: 'Sim', en: 'Yes', zh: '是' },
  nao: { pt: 'Não', en: 'No', zh: '否' },
  todos: { pt: 'Todos', en: 'All', zh: '全部' },
  hoje: { pt: 'Hoje', en: 'Today', zh: '今天' },
  total: { pt: 'Total', en: 'Total', zh: '合计' },
  media: { pt: 'Média', en: 'Average', zh: '平均' },
  semDados: { pt: 'Sem dados', en: 'No data', zh: '无数据' },
  porResolver: { pt: 'Por resolver', en: 'Unresolved', zh: '待解决' },
  abrir: { pt: 'Abrir', en: 'Open', zh: '打开' },
  de: { pt: 'de', en: 'of', zh: '共' },
} satisfies Record<string, T>;
