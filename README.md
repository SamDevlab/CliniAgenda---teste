# CliniAgenda

Sistema Full Stack de Agendamento e Gestão de Consultas.

## Problema e objetivo

O CliniAgenda reduz o atendimento manual de uma clínica para consulta de horários e marcação de consultas. O paciente escolhe uma data, consulta os horários livres e confirma o agendamento. A equipe da clínica acompanha os registros em uma área de gestão simples.

O projeto foi mantido como um MVP pequeno, com foco em regras de negócio corretas, persistência real, testes automatizados e uma experiência de uso clara.

## Funcionalidades

### Área do paciente — `/`

- seleção de data;
- indicação de finais de semana e feriados;
- consulta de horários disponíveis;
- seleção de um slot de uma hora;
- formulário com nome e telefone;
- confirmação imediata do agendamento;
- mensagens de carregamento, erro e conflito.

### Gestão da clínica — `/admin`

- total de registros retornados pelo filtro;
- quantidade de confirmados e cancelados;
- listagem com paciente, telefone, data, horário e status;
- filtros por data, status e nome;
- cancelamento sem exclusão física;
- liberação do horário depois do cancelamento.

Não há autenticação nessa tela porque ela ficou fora do escopo do teste. Em produção, a rota administrativa obrigatoriamente precisaria de autenticação, autorização e auditoria.

## Regras de negócio

- atendimento de 08:00 às 18:00;
- consultas com duração de uma hora;
- slots permitidos: `08:00`, `09:00`, `10:00`, `11:00`, `12:00`, `13:00`, `14:00`, `15:00`, `16:00` e `17:00`;
- sábados e domingos não são dias de atendimento;
- feriados não são dias de atendimento;
- o backend valida a data e a disponibilidade novamente no POST;
- um horário confirmado não pode ser reservado duas vezes;
- cancelamentos são mantidos para preservar o histórico.

As datas de negócio usam explicitamente o fuso `America/Bahia`, independentemente do fuso configurado no servidor.

## Arquitetura e tecnologias

```text
frontend (React + TypeScript + Vite + Tailwind)
              │ REST / proxy local
              ▼
backend (Node.js + Express + TypeScript)
       ┌──────┴────────┐
       ▼               ▼
    SQLite        Nager.Date
```

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router e Lucide.
- Backend: Node.js, Express, TypeScript, Zod e Luxon.
- Banco: SQLite por meio de `sql.js` em WebAssembly, com persistência em arquivo.
- Testes: Vitest e Supertest.
- Feriados: Nager.Date, consultada exclusivamente pelo backend.

## API

O backend roda na porta `3333` por padrão.

### `GET /available?date=AAAA-MM-DD`

Resposta em dia útil:

```json
{
  "date": "2026-09-16",
  "timezone": "America/Bahia",
  "businessDay": true,
  "holiday": null,
  "availableSlots": ["08:00", "09:00", "10:00"]
}
```

Em feriado ou final de semana, `businessDay` é `false` e `availableSlots` é um array vazio. Quando for feriado, o campo `holiday` contém o nome retornado pela Nager.Date.

### `POST /appointments`

```json
{
  "patientName": "Paciente Exemplo",
  "patientPhone": "00000000000",
  "date": "2026-09-16",
  "time": "10:00"
}
```

Retorna `201 Created` com o agendamento criado:

```json
{
  "id": 1,
  "patientName": "Paciente Exemplo",
  "patientPhone": "00000000000",
  "date": "2026-09-16",
  "time": "10:00",
  "status": "CONFIRMED",
  "createdAt": "2026-09-14T20:35:00.000Z",
  "updatedAt": "2026-09-14T20:35:00.000Z"
}
```

Em tentativa de reservar um slot confirmado, a API retorna `409 Conflict`:

```json
{
  "error": "APPOINTMENT_CONFLICT",
  "message": "Este horário já está ocupado."
}
```

### `GET /appointments`

Lista os registros persistidos. Aceita os filtros opcionais `date`, `status` (`CONFIRMED` ou `CANCELLED`) e `search`:

```text
GET /appointments?date=2026-09-16&status=CONFIRMED&search=Paciente
```

Os status armazenados são `CONFIRMED` e `CANCELLED`; na interface aparecem como “Confirmado” e “Cancelado”.

### `PATCH /appointments/:id/cancel`

Altera o status para `CANCELLED`, atualiza `updatedAt` e retorna o registro. A operação é idempotente: cancelar novamente o mesmo registro retorna o registro já cancelado. Um ID inexistente retorna `404 Not Found`.

### `GET /health`

Retorna `{ "status": "ok" }` para uma verificação simples do backend.

## Feriados e falhas externas

O `HolidayService` é a única camada responsável pela integração com:

```text
https://date.nager.at/api/v3/PublicHolidays/2026/BR
```

O ano é montado a partir da data solicitada, mantendo a mesma API para outros anos. A resposta é armazenada em cache por ano durante a execução do backend. Falhas da Nager.Date retornam `502 Bad Gateway` com o erro `HOLIDAY_SERVICE_UNAVAILABLE`.

Os testes usam um provedor de feriados em memória; portanto, não dependem da internet real.

## Persistência e prevenção de conflito

A tabela `appointments` contém `id`, `patient_name`, `patient_phone`, `date`, `time`, `status`, `created_at` e `updated_at`.

Além de consultar a disponibilidade, a inserção ocorre em transação SQLite e há um índice único parcial:

```sql
CREATE UNIQUE INDEX confirmed_appointment_slot
ON appointments (date, time)
WHERE status = 'CONFIRMED';
```

Assim, registros cancelados continuam no histórico e o mesmo slot pode ser reutilizado, mas duas reservas confirmadas concorrentes não podem ocupar a mesma combinação de data e horário. A violação dessa restrição é convertida em `409 Conflict`.

## Como executar

### Pré-requisitos

- Node.js 20 ou superior;
- npm.

Na raiz do projeto:

```bash
npm install
npm run dev
```

O frontend ficará em `http://localhost:5173` e o backend em `http://localhost:3333`. O Vite encaminha chamadas `/api` para o backend durante o desenvolvimento.

Para executar separadamente:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Variáveis opcionais podem ser copiadas de `.env.example`. O banco é criado automaticamente em `backend/data/cliniagenda.db` quando o backend é iniciado a partir da pasta `backend`.

## Como validar

Na raiz, após `npm install`:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Ou execute tudo em sequência:

```bash
npm run check
```

A suíte cobre disponibilidade em dia útil, sábado, domingo, feriado, criação, conflitos, entradas inválidas, listagem, filtros, cancelamento, liberação de slot, ID inexistente e falha do serviço de feriados.

## Estrutura

```text
.
├── backend
│   ├── src
│   │   ├── database
│   │   ├── repositories
│   │   ├── routes
│   │   ├── schemas
│   │   └── services
│   └── tests
├── frontend
│   └── src
│       ├── components
│       ├── pages
│       ├── services
│       ├── types
│       └── utils
├── .env.example
├── .gitignore
└── package.json
```

## Extensão do desafio

A gestão da clínica e o cancelamento foram adicionados como evolução do cenário solicitado. Eles reutilizam a mesma persistência do fluxo do paciente, sem introduzir autenticação ou infraestrutura adicional.

## Limitações

- `/admin` não possui autenticação;
- a aplicação é um MVP;
- não há múltiplos médicos;
- não há múltiplas unidades;
- não há notificações por WhatsApp ou e-mail;
- não há reagendamento, pagamentos ou prontuário;
- a agenda considera uma única clínica e uma única grade de horários;
- a Nager.Date é uma dependência externa em produção.

## Possíveis evoluções

Autenticação da equipe, múltiplos profissionais e unidades, agendas independentes, reagendamento, notificações, auditoria, PostgreSQL e observabilidade são evoluções naturais para um ambiente real.
