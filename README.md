# 📋 Sistema de Gerenciamento de Tarefas

Uma API REST robusta para gerenciamento de tarefas desenvolvida com **NestJS**, **TypeScript** e **PostgreSQL**. O sistema oferece funcionalidades completas de CRUD para usuários e tarefas, com autenticação JWT, filtros avançados e estatísticas detalhadas.

## 🚀 Funcionalidades

### 👥 Gerenciamento de Usuários
- ✅ Cadastro de novos usuários com validação
- ✅ Autenticação JWT segura
- ✅ Listagem, busca, atualização e remoção de usuários
- ✅ Criptografia de senhas com bcrypt

### 📝 Gerenciamento de Tarefas
- ✅ Criação de tarefas com título, descrição, responsável e prazo
- ✅ Status de tarefas: `pending`, `in_progress`, `completed`
- ✅ Atribuição de tarefas a usuários específicos
- ✅ Filtros por status, responsável e período de vencimento
- ✅ Paginação para listagem de tarefas
- ✅ Busca de tarefas com prazo próximo (24h)

### 📊 Relatórios e Estatísticas
- ✅ Estatísticas por status das tarefas
- ✅ Estatísticas por usuário responsável
- ✅ Percentual de conclusão das tarefas
- ✅ Identificação de tarefas urgentes

### 🔒 Segurança
- ✅ Autenticação JWT obrigatória para rotas protegidas
- ✅ Validação de dados com class-validator
- ✅ Middleware de logging para auditoria
- ✅ Configuração CORS habilitada

## 🛠️ Tecnologias Utilizadas

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo
- **[TypeScript](https://www.typescriptlang.org/)** - Superset tipado do JavaScript
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[Knex.js](https://knexjs.org/)** - Query builder SQL
- **[JWT](https://jwt.io/)** - Autenticação baseada em tokens
- **[bcrypt](https://www.npmjs.com/package/bcrypt)** - Criptografia de senhas
- **[Swagger](https://swagger.io/)** - Documentação da API
- **[Jest](https://jestjs.io/)** - Framework de testes
- **[Docker](https://www.docker.com/)** - Containerização

## 📋 Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **PostgreSQL** (versão 12 ou superior)
- **Docker** e **Docker Compose** (opcional, mas recomendado)

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd task-management
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=task_management

# Configurações JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# Configurações da Aplicação
PORT=3000
NODE_ENV=development
```

### 4. Inicie o banco de dados com Docker
```bash
docker-compose up -d db
```

### 5. Execute as migrações
```bash
npx knex migrate:latest
```

### 6. Inicie a aplicação
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

A API estará disponível em `http://localhost:3000/api`

## 📚 Documentação da API

A documentação interativa da API está disponível através do Swagger UI:

```
http://localhost:3000/api/docs
```

### Principais Endpoints

#### 🔐 Autenticação
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

#### 👥 Usuários
```http
# Registrar usuário
POST /api/users/register

# Listar usuários (autenticado)
GET /api/users
Authorization: Bearer <token>

# Buscar usuário por ID
GET /api/users/:id
Authorization: Bearer <token>
```

#### 📝 Tarefas
```http
# Criar tarefa
POST /api/tasks
Authorization: Bearer <token>

# Listar tarefas com filtros
GET /api/tasks?status=pending&assignee_id=1&page=1&limit=10
Authorization: Bearer <token>

# Tarefas com prazo próximo (24h)
GET /api/tasks/due-soon
Authorization: Bearer <token>

# Estatísticas por status
GET /api/tasks/stats/status
Authorization: Bearer <token>
```

## 🧪 Testes

O projeto possui cobertura completa de testes unitários e de integração.

### Executar testes
```bash
# Testes unitários
npm run test

# Testes com watch mode
npm run test:watch

# Testes de cobertura
npm run test:cov

# Testes end-to-end
npm run test:e2e
```

### Configuração do banco de teste
Para os testes E2E, configure um arquivo `.env.test`:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=task_management_test
JWT_SECRET=test_jwt_secret
NODE_ENV=test
```

Inicie o banco de teste:
```bash
docker-compose up -d test-db
npm run test:db:migrate
```

## 🐳 Docker

### Desenvolvimento com Docker
```bash
# Iniciar todos os serviços
docker-compose up -d

# Apenas o banco de dados
docker-compose up -d db

# Logs da aplicação
docker-compose logs -f app
```

### Build para produção
```bash
# Build da imagem
docker build -t task-management .

# Executar container
docker run -p 3000:3000 --env-file .env task-management
```

## 📁 Estrutura do Projeto

```
src/
├── auth/                 # Módulo de autenticação
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── jwt-auth.guard.ts
├── database/            # Configuração do banco
│   └── database.module.ts
├── dto/                 # Data Transfer Objects
│   ├── create-user.dto.ts
│   ├── create-task.dto.ts
│   └── ...
├── interfaces/          # Interfaces TypeScript
│   ├── user.interface.ts
│   └── task.interface.ts
├── migrations/          # Migrações do banco
│   ├── create_users_table.ts
│   └── create_tasks_table.ts
├── tasks/              # Módulo de tarefas
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── tasks.module.ts
├── users/              # Módulo de usuários
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── app.module.ts       # Módulo principal
└── main.ts            # Ponto de entrada
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev        # Inicia em modo desenvolvimento
npm run start:debug     # Inicia com debug habilitado

# Build e produção
npm run build           # Compila o projeto
npm run start:prod      # Inicia em modo produção

# Testes
npm run test           # Testes unitários
npm run test:e2e       # Testes end-to-end
npm run test:cov       # Cobertura de testes

# Qualidade de código
npm run lint           # Executa ESLint
npm run format         # Formata código com Prettier

# Banco de dados
npm run test:db:migrate # Executa migrações no banco de teste
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido como parte de um desafio técnico para demonstrar conhecimentos em:
- Desenvolvimento de APIs REST com NestJS
- Arquitetura limpa e padrões de design
- Testes automatizados (unitários e integração)
- Containerização com Docker
- Documentação técnica

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!