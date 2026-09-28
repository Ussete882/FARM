import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import './index.css';
import { router } from './app/router';
import { semearSeVazio } from './dados/semente';
import { ProvedorIdioma } from './i18n/contexto';

async function arrancar() {
  await semearSeVazio();
  const raiz = document.getElementById('root');
  if (!raiz) throw new Error('Elemento #root não encontrado.');
  createRoot(raiz).render(
    <React.StrictMode>
      <ProvedorIdioma>
        <RouterProvider router={router} />
      </ProvedorIdioma>
    </React.StrictMode>,
  );
}

void arrancar();
