# Life Tracker Pro - Documentação Técnica

## Visão Geral
Life Tracker Pro é uma aplicação de rastreamento de produtividade com tema earthen/terroso inspirado em terminals retrô. A aplicação permite aos usuários monitorar tempo gasto em diferentes atividades e categorias.

## Arquitetura

### Frontend
- **Framework**: React 18 com TypeScript
- **Estado Global**: Redux Toolkit
- **Styling**: Tailwind CSS com tema customizado earthen
- **Charts**: Recharts library
- **Testes**: Jest + React Testing Library
- **Build**: Vite

### Backend
- **Framework**: Express.js
- **Banco de Dados**: SQLite
- **ORM**: Sequelize
- **API**: RESTful endpoints

## Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes UI básicos
│   ├── charts/          # Componentes de gráficos
│   └── analytics/       # Componentes de análise
├── pages/               # Páginas da aplicação
│   └── dashboard/       # Dashboard principal
├── store/               # Redux store e slices
│   └── slices/         # Redux slices
├── services/           # Serviços de API
├── utils/              # Utilitários
├── hooks/              # Custom hooks
├── types/              # Definições TypeScript
└── styles.css          # Estilos globais
```

## Sistema de Cores (Tema Earthen)

```css
/* Cores principais */
--background: #0d0d0a;        /* Fundo escuro terroso */
--foreground: #d4c4a0;        /* Texto principal bege */
--primary: #cc8844;           /* Laranja terroso principal */
--secondary: #b8860b;         /* Amarelo dourado */
--accent: #cd853f;            /* Peru/marrom claro */

/* Cores específicas OVERLOAD */
--overload-lime: #cc8844;     /* Laranja terroso */
--overload-purple: #b8860b;   /* Amarelo dourado */
--overload-cyan: #cd853f;     /* Peru */
```

## Componentes Principais

### MysticDashboard (src/pages/dashboard/MysticDashboard.tsx)
- **Propósito**: Dashboard principal da aplicação
- **Funcionalidades**:
  - Controle de sessões de tracking
  - Visualização de métricas
  - Seleção de categorias
  - Configurações do sistema
- **Estados**:
  - `isTracking`: Controla se está rastreando atualmente
  - `selectedCategory`: Categoria selecionada
  - `dailyGoals`: Metas diárias por categoria

### ProductivityChart (src/components/charts/ProductivityChart.tsx)
- **Propósito**: Gráfico de área para análise de produtividade por período do dia
- **Props**:
  - `data`: Dados de produtividade por período
  - `className`: Classes CSS adicionais
- **Características**:
  - Gradiente earthen customizado
  - Estado vazio quando sem dados
  - Responsivo

### CategoryBreakdown (src/components/charts/CategoryBreakdown.tsx)
- **Propósito**: Gráfico de pizza para distribuição por categoria
- **Props**:
  - `data`: Array de objetos com name, value, color
- **Características**:
  - Cores earthen personalizadas
  - Tooltip customizado
  - Legenda estilizada

## Redux Store

### activitySlice (src/store/slices/activitySlice.ts)
**Estado**:
```typescript
interface ActivityState {
  systemStatus: SystemStatus | null;
  dashboardData: DashboardData | null;
  currentSession: Session | null;
  errors: {
    dashboard: string | null;
    system: string | null;
  };
  loading: {
    dashboard: boolean;
    system: boolean;
  };
}
```

**Async Thunks**:
- `fetchDashboardData`: Busca dados do dashboard
- `fetchSystemStatus`: Busca status do sistema
- `startTracking`: Inicia sessão de tracking
- `stopTracking`: Para sessão atual
- `fetchWeeklySummary`: Busca resumo semanal
- `fetchCategoryStats`: Busca estatísticas por categoria

## Utilitários

### errorHandling.ts (src/utils/errorHandling.ts)
- **handleApiError**: Converte erros de API em mensagens amigáveis
- **withRetry**: Implementa retry com backoff exponencial
- **showErrorToast**: Exibe notificações de erro
- **Classes**:
  - `NetworkError`: Erros de rede
  - `ApiError`: Erros de API com status e código

## Sistema de Testes

### Configuração (src/setupTests.ts)
- Mock do ResizeObserver para testes de charts
- Mock do axios para chamadas de API
- Mock do window.matchMedia para componentes responsivos

### Testes Implementados
- **ProductivityChart.test.tsx**: Testa renderização e estados do gráfico
- **errorHandling.test.ts**: Testa utilitários de erro e retry
- **activitySlice.test.ts**: Testa Redux slice e async thunks

## Backend APIs

### Endpoints Principais
- `GET /api/dashboard`: Dados consolidados do dashboard
- `GET /api/system/status`: Status do sistema
- `POST /api/monitor/start`: Inicia tracking
- `POST /api/monitor/stop`: Para tracking
- `GET /api/sessions`: Lista sessões
- `GET /api/categories/stats`: Estatísticas por categoria

## Scripts de Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento frontend
npm run dev

# Desenvolvimento backend
npm run server

# Executar testes
npm test

# Build para produção
npm run build

# Lint
npm run lint

# Type check
npm run type-check
```

## Configuração do Ambiente

### Variáveis de Ambiente
```env
# Backend
PORT=3001
NODE_ENV=development
DB_PATH=./data/database.sqlite

# Frontend
VITE_API_URL=http://localhost:3001
```

## Convenções de Código

### Nomenclatura
- **Componentes**: PascalCase (ex: `ProductivityChart`)
- **Hooks**: camelCase com prefixo "use" (ex: `useNotifications`)
- **Utilitários**: camelCase (ex: `handleApiError`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_BASE_URL`)

### Estrutura de Componentes
```typescript
// 1. Imports
import React from 'react';
import { useAppDispatch } from '../store';

// 2. Types/Interfaces
interface ComponentProps {
  data: DataType;
}

// 3. Component
export default function Component({ data }: ComponentProps) {
  // 4. Hooks
  const dispatch = useAppDispatch();
  
  // 5. State
  const [loading, setLoading] = useState(false);
  
  // 6. Effects
  useEffect(() => {
    // effect logic
  }, []);
  
  // 7. Handlers
  const handleClick = () => {
    // handler logic
  };
  
  // 8. Render
  return (
    <div>
      {/* component JSX */}
    </div>
  );
}
```

## Performance

### Otimizações Implementadas
- **React.memo**: Componentes de charts memoizados
- **useMemo**: Cálculos pesados de estatísticas
- **useCallback**: Handlers estáveis
- **Lazy Loading**: Componentes carregados sob demanda
- **Tree Shaking**: Imports específicos para reduzir bundle

### Métricas de Bundle
- Tamanho otimizado após remoção de dependências desnecessárias
- Redução de ~22KB através de cleanup de imports

## Deployment

### Build para Produção
```bash
npm run build
npm run preview  # Teste local do build
```

### Considerações
- Assets são otimizados automaticamente pelo Vite
- Código é minificado e tree-shaken
- Source maps são gerados para debugging

## Debugging

### Logs
- Redux DevTools para estado da aplicação
- Console.log estratégicos em desenvolvimento
- Error boundaries para captura de erros React

### Ferramentas
- React Developer Tools
- Redux DevTools Extension
- Network tab para APIs
- Jest para testes unitários

## Manutenção

### Atualizações de Dependências
```bash
npm audit          # Verificar vulnerabilidades
npm update         # Atualizar dependências
npm outdated       # Verificar versões desatualizadas
```

### Linting e Formatação
```bash
npm run lint       # ESLint
npm run lint:fix   # Auto-fix issues
npm run type-check # TypeScript check
```

---

**Última atualização**: Agosto 2025
**Versão**: 1.0.0