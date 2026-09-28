import { createBrowserRouter } from 'react-router-dom';

import { Agua } from '../modulos/M1Cadastro/Agua';
import { Arvores } from '../modulos/M1Cadastro/Arvores';
import { Ciclos } from '../modulos/M1Cadastro/Ciclos';
import { Talhoes } from '../modulos/M1Cadastro/Talhoes';
import { Monitorizacao, Observacoes } from '../modulos/M2Operacoes/Monitorizacao';
import { Ordens } from '../modulos/M2Operacoes/Ordens';
import { Pesagens } from '../modulos/M2Operacoes/Pesagens';
import { Relatorios } from '../modulos/M2Operacoes/Relatorios';
import { Conformidade } from '../modulos/M3Pessoas/Conformidade';
import { Jornas } from '../modulos/M3Pessoas/Jornas';
import { Trabalhadores } from '../modulos/M3Pessoas/Trabalhadores';
import { Parametros } from '../modulos/Governacao/Parametros';
import { Pendencias } from '../modulos/Governacao/Pendencias';
import { Indicadores } from '../modulos/Paineis/Indicadores';
import { PainelDiario } from '../modulos/Paineis/PainelDiario';

import { Layout } from './Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <PainelDiario /> },
      { path: 'indicadores', element: <Indicadores /> },

      // M1 — Cadastro territorial e agronómico
      { path: 'talhoes', element: <Talhoes /> },
      { path: 'talhoes/:codigo', element: <Talhoes /> },
      { path: 'arvores', element: <Arvores /> },
      { path: 'ciclos', element: <Ciclos /> },
      { path: 'agua', element: <Agua /> },

      // M2 — Operações de campo
      { path: 'ordens', element: <Ordens /> },
      { path: 'ordens/:codigo', element: <Ordens /> },
      { path: 'relatorios', element: <Relatorios /> },
      { path: 'relatorios/:codigo', element: <Relatorios /> },
      { path: 'pesagens', element: <Pesagens /> },
      { path: 'pesagens/:codigo', element: <Pesagens /> },
      { path: 'monitorizacao', element: <Monitorizacao /> },
      { path: 'observacoes', element: <Observacoes /> },

      // M3 — Pessoas e assiduidade
      { path: 'trabalhadores', element: <Trabalhadores /> },
      { path: 'trabalhadores/:codigo', element: <Trabalhadores /> },
      { path: 'jornas', element: <Jornas /> },
      { path: 'conformidade', element: <Conformidade /> },

      // Governação
      { path: 'pendencias', element: <Pendencias /> },
      { path: 'parametros', element: <Parametros /> },
    ],
  },
]);
