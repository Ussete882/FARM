import { describe, expect, it } from 'vitest';

import { ROTULO_ESTADO, SIMBOLO_UNIDADE, UNIDADES, q } from '../dominio/canonico';
import { formatador } from '../dominio/formatar';
import { CATALOGO_INDICADORES } from '../dominio/indicadores';
import { PARAMETROS } from '../dominio/parametros';
import { validarTalhao } from '../regras/validacao';
import { desvioData } from '../regras/desvio';
import { IDIOMAS, type T } from './nucleo';

/**
 * O compilador já garante que todo o `T` tem as três línguas. O que estes
 * testes cobrem é o que ele não vê: uma tradução deixada igual ao português
 * por esquecimento, e as convenções de número e data, que se um leitor
 * lê mal deixam de ser decoração e passam a erro.
 */

const completo = (t: T) => IDIOMAS.every((i) => t[i].trim().length > 0);

describe('Textos trilingues', () => {
  it('nenhum estado, unidade ou parâmetro fica por preencher', () => {
    for (const rotulo of Object.values(ROTULO_ESTADO)) expect(completo(rotulo)).toBe(true);
    for (const u of UNIDADES) expect(completo(SIMBOLO_UNIDADE[u])).toBe(true);
    for (const p of PARAMETROS) {
      expect(completo(p.designacao)).toBe(true);
      expect(completo(p.unidade)).toBe(true);
    }
  });

  it('o catálogo de indicadores está inteiro nas três línguas', () => {
    for (const f of CATALOGO_INDICADORES) {
      expect(completo(f.designacao)).toBe(true);
      expect(completo(f.formula)).toBe(true);
      expect(completo(f.dono)).toBe(true);
      expect(completo(f.metaTexto)).toBe(true);
      expect(completo(f.campos_utilizados)).toBe(true);
      if (f.accao_vermelho) expect(completo(f.accao_vermelho)).toBe(true);
    }
  });

  it('a designação do indicador é mesmo diferente em cada língua', () => {
    // Um `T` com as três iguais passa o compilador e é quase sempre esquecimento.
    const kPrd01 = CATALOGO_INDICADORES.find((f) => f.codigo === 'K-PRD-01')!;
    expect(kPrd01.designacao.en).not.toBe(kPrd01.designacao.pt);
    expect(kPrd01.designacao.zh).not.toBe(kPrd01.designacao.pt);
  });
});

describe('Constatações do motor de regras', () => {
  const talhao = {
    poligono: [],
    area_bruta_ha: q(10, 'ha'),
    area_plantada_ha: q(20, 'ha', 'plantada'),
    area_util_ha: q(9, 'ha', 'util'),
    sistema_rega: 'sequeiro',
    data_analise_solo: '2026-01-01',
  } as never;

  it('devolve a mensagem nas três línguas, sem resolver nenhuma', () => {
    const r = validarTalhao(talhao, '2026-09-01');
    expect(r.constatacoes.length).toBeGreaterThan(0);
    for (const c of r.constatacoes) {
      expect(completo(c.mensagem)).toBe(true);
      if (c.fundamento) expect(completo(c.fundamento)).toBe(true);
    }
  });

  it('interpola o número na convenção de cada língua', () => {
    const r = validarTalhao(talhao, '2026-09-01');
    const areas = r.constatacoes.find((c) => c.campo === 'area_plantada_ha')!;
    expect(areas.mensagem.pt).toContain('20,0');
    expect(areas.mensagem.en).toContain('20.0');
  });
});

describe('Formatação por idioma', () => {
  const pt = formatador('pt');
  const en = formatador('en');
  const zh = formatador('zh');

  it('separa milhares e decimais como cada língua os lê', () => {
    // Espaço fino em português, vírgula em inglês e chinês.
    expect(pt.numero(7072)).toBe('7 072,00');
    expect(en.numero(7072)).toBe('7,072.00');
    expect(zh.numero(7072)).toBe('7,072.00');
  });

  it('escreve a data na forma de cada língua', () => {
    expect(pt.data('2026-09-01')).toBe('01/09/2026');
    expect(en.data('2026-09-01')).toBe('01 Sep 2026');
    expect(zh.data('2026-09-01')).toBe('2026年9月1日');
  });

  it('traduz o dia da semana', () => {
    expect(pt.diaDaSemana('2026-09-01')).toBe('Terça');
    expect(en.diaDaSemana('2026-09-01')).toBe('Tuesday');
    expect(zh.diaDaSemana('2026-09-01')).toBe('星期二');
  });

  it('conta os dias no sentido certo em cada língua', () => {
    expect(pt.distanciaEmDias(0)).toBe('hoje');
    expect(en.distanciaEmDias(-3)).toBe('3 days ago');
    expect(zh.distanciaEmDias(12)).toBe('12天后');
  });

  it('mantém o símbolo do SI e traduz a unidade que é palavra', () => {
    expect(pt.unidade('kg')).toBe('kg');
    expect(en.unidade('kg')).toBe('kg');
    expect(zh.unidade('kg')).toBe('kg');
    expect(pt.unidade('jorna')).toBe('jornas');
    expect(en.unidade('jorna')).toBe('worker-days');
    expect(zh.unidade('jorna')).toBe('工日');
  });

  it('mantém o código da forma de produto e traduz a base que é palavra', () => {
    // «NIH» é código imutável (§6.3); «plantada» é vocabulário.
    expect(pt.quantidade(q(186.5, 'kg', 'NIH'))).toContain('NIH');
    expect(zh.quantidade(q(186.5, 'kg', 'NIH'))).toContain('NIH');
    expect(pt.base('plantada')).toBe('plantada');
    expect(en.base('plantada')).toBe('planted');
    expect(zh.base('plantada')).toBe('种植');
  });

  it('não flexiona o plural em chinês', () => {
    expect(pt.contagem(1, 'falta', 'faltas')).toBe('1 falta');
    expect(pt.contagem(3, 'falta', 'faltas')).toBe('3 faltas');
    expect(zh.contagem(3, '次', '次')).toBe('3 次');
  });
});

describe('Leitura do desvio (§5.2)', () => {
  it('viaja trilingue, como as constatações', () => {
    const d = desvioData('2026-04-10', '2026-04-18');
    expect(completo(d.leitura)).toBe(true);
    expect(completo(d.rotulo)).toBe(true);
    expect(d.leitura.pt).toBe('8 dias de atraso');
    expect(d.leitura.en).toBe('8 days late');
    expect(d.leitura.zh).toBe('延迟 8 天');
  });
});
