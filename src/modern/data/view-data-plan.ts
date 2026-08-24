import type { DataSourceId } from './data-registry';

const PLAN: Readonly<Record<string, readonly DataSourceId[]>> = Object.freeze({
  resumo: ['core','financials','occupancy','reputation'],
  hotel360: ['core','financials','occupancy','reputation','revenue'],
  fichahotel: ['core','financials','occupancy','reputation'],
  receitas: ['core','financials'],
  custos: ['core','financials'],
  pl: ['core','financials'],
  revenuehub: ['core','revenue','occupancy'],
  benchmark: ['core','financials','occupancy','reputation'],
  anomalies: ['core','financials','occupancy','reputation'],
  ocupacao: ['core','occupancy'],
  costanalysis: ['core','financials'],
  cua: ['core','financials'],
  compare: ['core','financials','occupancy','reputation'],
  ranking: ['core','financials','occupancy','reputation'],
  sazonalidade: ['core','occupancy','revenue'],
  simulador: ['core','financials','occupancy'],
  orcamento: ['core','financials'],
  reputacao: ['core','reputation'],
  instagram: ['core','reputation'],
  approvals: ['core','approvals'],
  compras: ['core','purchases'],
  hoteis: ['core','hotels'],
  documents: ['core','documents'],
  automaticreports: ['core','financials','occupancy','reputation']
});

export function dataSourcesForView(viewId: string): readonly DataSourceId[] {
  return PLAN[viewId] || ['core'];
}

export function viewDataPlan(): Readonly<Record<string, readonly DataSourceId[]>> {
  return PLAN;
}
