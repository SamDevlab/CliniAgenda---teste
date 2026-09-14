# CliniAgenda---teste

Sistema full stack para agendamento e gestão de consultas em clínicas.

O projeto foi desenvolvido como teste técnico para uma vaga de Estágio Full Stack e simula um cenário real em que uma clínica precisa reduzir o atendimento manual relacionado à consulta de disponibilidade e criação de agendamentos.

Além do fluxo solicitado no desafio, o CliniSlot inclui uma área de gestão para que a clínica possa acompanhar e cancelar agendamentos.

---

## 📌 Visão geral

O CliniSlot possui duas áreas principais:

### Paciente

Permite:

- selecionar uma data;
- consultar horários disponíveis;
- identificar finais de semana e feriados;
- escolher um horário;
- informar os dados do paciente;
- criar um agendamento;
- visualizar a confirmação da consulta.

### Gestão da clínica

Permite:

- visualizar os agendamentos cadastrados;
- consultar a agenda por data;
- identificar agendamentos confirmados e cancelados;
- pesquisar pacientes;
- cancelar consultas;
- liberar novamente um horário após cancelamento.

---

## 🎯 Objetivo

O objetivo do projeto é automatizar parte do processo de agendamento de uma clínica.

Em vez de depender exclusivamente de atendimento manual para responder perguntas como:

- "Tem consulta para esse dia?"
- "Qual horário está disponível?"
- "Posso marcar para determinado horário?"

o sistema permite que o próprio usuário consulte horários disponíveis e realize seu agendamento.

Ao mesmo tempo, a clínica possui uma área própria para acompanhar os agendamentos realizados.

---

## 🧠 Regras de negócio

A clínica funciona das **08:00 às 18:00**.

Cada consulta possui duração de **1 hora**.

Os horários possíveis são:

```text
08:00
09:00
10:00
11:00
12:00
13:00
14:00
15:00
16:00
17:00
```

O último horário disponível é `17:00`, pois a consulta termina às `18:00`.

O sistema não permite agendamentos:

- aos sábados;
- aos domingos;
- em feriados nacionais;
- em horários já ocupados;
- fora do horário de funcionamento;
- com dados inválidos.

A validação é realizada no backend tanto na consulta de disponibilidade quanto no momento da criação do agendamento.

---

## 🌎 Feriados

Os feriados nacionais são consultados utilizando a API pública Nager.Date:

```text
https://date.nager.at/api/v3/PublicHolidays/2026/BR
```

A integração com a API é realizada pelo backend.

Dessa forma, a regra de bloqueio de feriados não depende apenas do frontend.

---

## 🔄 Fluxo de agendamento

```text
Paciente seleciona uma data
          ↓
Frontend consulta o backend
          ↓
Backend valida a data
          ↓
Verifica final de semana
          ↓
Consulta a API de feriados
          ↓
Consulta agendamentos existentes
          ↓
Calcula horários disponíveis
          ↓
Frontend apresenta os horários
          ↓
Paciente escolhe um horário
          ↓
Envia dados do agendamento
          ↓
Backend executa nova validação
          ↓
Agendamento é persistido
          ↓
Confirmação é retornada
```

---

## 🏗️ Arquitetura

```text
                ┌─────────────────────────┐
                │        Frontend         │
                │   React + TypeScript    │
                └────────────┬────────────┘
                             │
                          REST API
                             │
                ┌────────────▼────────────┐
                │         Backend         │
                │ Node.js + Express + TS  │
                └────────┬────────┬───────┘
                         │        │
                         │        └────────────────┐
                         │                         │
                 ┌───────▼────────┐       ┌────────▼─────────┐
                 │     SQLite     │       │    Nager.Date    │
                 │ Agendamentos   │       │ API de feriados  │
                 └────────────────┘       └──────────────────┘
```

---

## 🧰 Tecnologias

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Backend

- Node.js
- Express
- TypeScript
- Zod
- Luxon

### Banco de dados

- SQLite

### Testes

- Vitest
- Supertest

### Integração externa

- Nager.Date API

---

## 📡 API

### Consultar horários disponíveis

```http
GET /available?date=2026-09-16
```

Exemplo de resposta:

```json
{
  "date": "2026-09-16",
  "timezone": "America/Bahia",
  "businessDay": true,
  "holiday": null,
  "availableSlots": [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00"
  ]
}
```

Exemplo em um feriado:

```json
{
  "date": "2026-09-07",
  "timezone": "America/Bahia",
  "businessDay": false,
  "holiday": "Independência do Brasil",
  "availableSlots": []
}
```

---

### Criar agendamento

```http
POST /appointments
```

Exemplo de requisição:

```json
{
  "patientName": "Samuel Araújo",
  "patientPhone": "71999999999",
  "date": "2026-09-16",
  "time": "10:00"
}
```

Exemplo de resposta:

```json
{
  "id": 42,
  "patientName": "Samuel Araújo",
  "patientPhone": "71999999999",
  "date": "2026-09-16",
  "time": "10:00",
  "status": "CONFIRMED",
  "createdAt": "2026-09-14T20:35:00Z"
}
```

---

### Listar agendamentos

```http
GET /appointments
```

Retorna os agendamentos cadastrados no sistema.

Exemplo:

```json
[
  {
    "id": 42,
    "patientName": "Samuel Araújo",
    "patientPhone": "71999999999",
    "date": "2026-09-16",
    "time": "10:00",
    "status": "CONFIRMED"
  }
]
```

---

### Cancelar agendamento

```http
PATCH /appointments/:id/cancel
```

O agendamento não é removido do banco.

Seu status é alterado para:

```text
CANCELLED
```

Após o cancelamento, o horário anteriormente ocupado volta a aparecer como disponível.

---

## 📋 Estados do agendamento

O MVP utiliza dois estados:

```text
CONFIRMED
CANCELLED
```

Agendamentos cancelados são preservados para manter o histórico das operações realizadas pela clínica.

---

## 🖥️ Área do paciente

A tela do paciente permite:

- selecionar uma data;
- visualizar os horários disponíveis;
- receber feedback sobre finais de semana e feriados;
- preencher nome e telefone;
- escolher um horário;
- confirmar o agendamento.

Exemplo:

```text
Agendar consulta

Data
[ 16/09/2026 ]

Horários disponíveis

[08:00] [09:00] [10:00]
[11:00] [12:00] [13:00]

Nome
[ Samuel Araújo ]

Telefone
[ (71) 99999-9999 ]

[ Confirmar agendamento ]
```

Após a conclusão:

```text
✓ Agendamento confirmado

16/09/2026
10:00
```

---

## 🏥 Área de gestão da clínica

A área administrativa utiliza os dados do próprio fluxo de agendamento.

Ela permite visualizar e organizar a agenda da clínica.

Exemplo:

```text
Gestão de Agendamentos

Hoje
12 consultas

[ Buscar paciente ] [ Data ] [ Status ]

08:00  Maria Silva       Confirmado
09:00  João Santos       Confirmado
10:00  Samuel Araújo     Confirmado
11:00  Ana Souza         Cancelado
```

A gestão pode conter filtros por:

- nome do paciente;
- data;
- status do agendamento.

---

## 📊 Resumo da agenda

A área administrativa também pode apresentar indicadores simples:

```text
┌────────────────┐
│ Hoje           │
│ 12 consultas   │
└────────────────┘

┌────────────────┐
│ Confirmados    │
│ 10             │
└────────────────┘

┌────────────────┐
│ Cancelados     │
│ 2              │
└────────────────┘
```

O objetivo é fornecer uma visão rápida da agenda sem transformar o projeto em um dashboard complexo.

---

## ⚠️ Prevenção de conflitos

A disponibilidade exibida pelo frontend não é considerada garantia definitiva de reserva.

Antes de salvar um agendamento, o backend executa novamente todas as validações.

Além disso, a persistência deve impedir que duas requisições concorrentes reservem o mesmo horário.

Exemplo:

```text
10:00 disponível
      ↓
Usuário A tenta reservar
Usuário B tenta reservar
      ↓
Banco aceita apenas uma reserva
      ↓
Segunda tentativa recebe conflito
```

Esse comportamento evita duplicidade de agendamentos.

---

## 🚨 Tratamento de erros

A API utiliza códigos HTTP adequados para representar diferentes situações.

Exemplos:

```text
200 OK
201 Created
400 Bad Request
404 Not Found
409 Conflict
500 Internal Server Error
```

Exemplo de tentativa de reservar um horário ocupado:

```json
{
  "error": "APPOINTMENT_CONFLICT",
  "message": "Este horário já está ocupado."
}
```

Exemplo de data inválida:

```json
{
  "error": "INVALID_DATE",
  "message": "A data informada é inválida."
}
```

---

## 📁 Estrutura do projeto

```text
clinislot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── database/
│   │   └── app.ts
│   │
│   ├── tests/
│   └── package.json
│
├── README.md
├── .gitignore
└── .env.example
```

---

## 🧩 Organização do frontend

```text
frontend/src/
├── components/
│   ├── AppointmentForm.tsx
│   ├── AppointmentTable.tsx
│   ├── DatePicker.tsx
│   ├── StatusBadge.tsx
│   ├── SummaryCard.tsx
│   └── TimeSlotGrid.tsx
│
├── pages/
│   ├── BookingPage.tsx
│   └── AppointmentsPage.tsx
│
├── services/
│   └── api.ts
│
├── types/
│   └── appointment.ts
│
└── App.tsx
```

---

## 🌐 Rotas do frontend

```text
/
```

Área de agendamento do paciente.

```text
/admin
```

Área de gestão da clínica.

A rota administrativa não possui autenticação neste MVP.

Em um ambiente de produção, autenticação e controle de acesso seriam obrigatórios.

---

## ▶️ Executando o projeto

### Pré-requisitos

- Node.js 20+
- npm

Clone o repositório:

```bash
git clone <URL_DO_REPOSITORIO>
cd clinislot
```

---

## Backend

Entre na pasta:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Execute o servidor:

```bash
npm run dev
```

---

## Frontend

Em outro terminal:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Execute:

```bash
npm run dev
```

A aplicação ficará disponível no endereço informado pelo Vite.

---

## 🧪 Testes

Para executar os testes do backend:

```bash
cd backend
npm test
```

Entre os cenários cobertos estão:

- consulta de disponibilidade em dia útil;
- bloqueio de sábado;
- bloqueio de domingo;
- bloqueio de feriado;
- criação de agendamento válido;
- tentativa de reservar horário já ocupado;
- validação de data inválida;
- validação de horários fora do funcionamento;
- listagem de agendamentos;
- cancelamento de agendamento;
- liberação de horário após cancelamento;
- tratamento de falha da API externa.

---

## 🧪 Estratégia de testes

A integração com a API de feriados fica isolada em uma camada própria.

Exemplo:

```text
HolidayService
```

Durante os testes, essa dependência pode ser mockada.

Assim, a suíte não depende da disponibilidade da internet ou do serviço externo para executar corretamente.

---

## 🕒 Fuso horário

O sistema utiliza explicitamente o fuso:

```text
America/Bahia
```

Isso evita que datas e horários dependam implicitamente da configuração do servidor onde a aplicação está sendo executada.

---

## 💾 Persistência

O projeto utiliza SQLite para persistência dos agendamentos.

Exemplo simplificado do modelo:

```text
appointments

id
patient_name
patient_phone
date
time
status
created_at
updated_at
```

Uma restrição de unicidade deve proteger combinações de data e horário consideradas ocupadas.

---

## 💡 Decisões técnicas

### Por que SQLite?

O SQLite foi escolhido para facilitar a execução durante a avaliação.

O avaliador consegue clonar o projeto e executá-lo sem precisar configurar um servidor externo de banco de dados.

Apesar da simplicidade, existe persistência real.

Em um cenário de produção, a camada de banco poderia ser migrada para PostgreSQL.

---

### Por que consultar feriados no backend?

A disponibilidade faz parte das regras de negócio.

Por isso, não seria seguro depender apenas de uma validação feita no navegador.

O backend consulta a API de feriados e valida novamente a data antes de criar qualquer agendamento.

---

### Por que validar novamente ao criar a consulta?

Existe um intervalo entre:

```text
consultar disponibilidade
```

e:

```text
confirmar agendamento
```

Durante esse período, outro usuário pode ter reservado o mesmo horário.

Por isso, o backend nunca assume que um horário anteriormente exibido continua disponível.

---

### Por que manter consultas canceladas?

Em vez de excluir o registro, o sistema altera seu status.

Isso permite preservar histórico e rastreabilidade.

---

## ✨ Extensão do desafio

O desafio original solicita:

- consulta de horários disponíveis;
- criação de agendamentos;
- listagem de agendamentos;
- persistência;
- API REST;
- integração com a API pública de feriados;
- bloqueio de finais de semana;
- bloqueio de feriados;
- bloqueio de horários ocupados.

Como extensão funcional, foi criada uma área de gestão da clínica.

O objetivo dessa evolução é demonstrar como os dados gerados pelo fluxo de agendamento podem ser utilizados pela operação da própria clínica.

A funcionalidade foi mantida propositalmente simples para não desviar do escopo principal do desafio.

---

## 🔐 Segurança

A área administrativa deste MVP não possui autenticação.

Em produção, seria necessário implementar:

- autenticação;
- autorização;
- controle de papéis;
- proteção das rotas administrativas;
- proteção contra abuso da API;
- rate limiting;
- logs de auditoria.

A ausência dessas funcionalidades no projeto é uma decisão de escopo e não uma recomendação para um ambiente real.

---

## 🚧 Limitações

O CliniSlot representa um MVP.

Algumas funcionalidades importantes para um produto real ficaram fora do escopo atual:

- autenticação da área administrativa;
- múltiplos usuários;
- controle de permissões;
- cadastro de médicos;
- cadastro de especialidades;
- múltiplas unidades;
- agendas individuais;
- reagendamento;
- confirmação via WhatsApp;
- confirmação por e-mail;
- lembretes automáticos;
- prontuário;
- histórico clínico;
- pagamentos;
- integração com calendários externos;
- observabilidade de produção.

---

## 🚀 Possíveis evoluções

Entre as próximas evoluções possíveis estão:

- autenticação da equipe;
- cadastro de profissionais;
- especialidades médicas;
- disponibilidade por profissional;
- reagendamento;
- confirmação por WhatsApp;
- lembretes automáticos;
- integração com Google Calendar;
- dashboard operacional;
- histórico completo de alterações;
- PostgreSQL;
- Docker;
- CI/CD;
- deploy em cloud.

---

## ✅ Requisitos do desafio atendidos

- [x] Frontend web
- [x] Backend REST
- [x] Persistência em banco de dados
- [x] Consulta da API Nager.Date no backend
- [x] Consulta de horários disponíveis
- [x] Criação de agendamento
- [x] Listagem de agendamentos
- [x] Bloqueio de finais de semana
- [x] Bloqueio de feriados
- [x] Bloqueio de horários ocupados
- [x] Horário de funcionamento entre 08:00 e 18:00
- [x] Consultas com duração de 1 hora

### Funcionalidades adicionais

- [x] Área de gestão da clínica
- [x] Cancelamento de agendamentos
- [x] Liberação do horário após cancelamento
- [x] Filtros de agenda
- [x] Tratamento estruturado de erros
- [x] Testes automatizados
- [x] Proteção contra conflitos de horários

---

## 👨‍💻 Autor

**Samuel de Araújo da Silva**

GitHub: [github.com/SamDevlab](https://github.com/SamDevlab)
