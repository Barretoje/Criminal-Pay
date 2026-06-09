/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Contract, Installment, MessageTemplates, AppNotification } from '../types';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Roberto Santos Pereira',
    phone: '5511999998888',
    cpf: '123.456.789-00',
    email: 'roberto.santos@gmail.com',
    notes: 'Cliente responde em liberdade. Residente em São Paulo.',
    createdAt: '2026-04-15T10:00:00Z'
  },
  {
    id: 'c2',
    name: 'Maria de Lourdes Oliveira',
    phone: '5521988887777',
    cpf: '987.654.321-11',
    email: 'maria.lourdes@outlook.com',
    notes: 'Mãe do representado Thiago de Oliveira, que está detido preventivamente no CDP de Pinheiros.',
    createdAt: '2026-05-01T14:30:00Z'
  },
  {
    id: 'c3',
    name: 'Carlos Eduardo Cavalcanti',
    phone: '5511977776666',
    cpf: '456.123.789-22',
    email: 'carlos.eduardo@hotmail.com',
    notes: 'Em gozo de regime semiaberto. Processo de Execução Penal em andamento.',
    createdAt: '2026-05-10T09:15:00Z'
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'con1',
    clientId: 'c1',
    processNumber: '1502431-88.2025.8.26.0050',
    processDetails: 'Tentativa de Homicídio Qualificado. Comarca de São Paulo - Foro Central Barra Funda. Júri agendado para o próximo semestre.',
    processType: 'Tribunal do Júri',
    representedName: 'Roberto Santos Pereira',
    isRecurring: false,
    totalValue: 25000,
    entryValue: 5000,
    entryPaid: true,
    installmentsCount: 10,
    installmentsValue: 2000,
    pdfAttached: {
      name: 'Honorarios_Roberto_Juri.pdf',
      size: '1.2 MB',
      uploadedAt: '2026-04-15'
    },
    createdAt: '2026-04-15T11:00:00Z'
  },
  {
    id: 'con2',
    clientId: 'c2',
    processNumber: '0043212-15.2026.8.19.0001',
    processDetails: 'Rito Ordinário - Acusação de Tráfico de Drogas (Art. 33). Comarca da Capital - RJ.',
    processType: 'Rito Comum (Ordinário/Sumário)',
    representedName: 'Thiago de Oliveira',
    isRecurring: false,
    totalValue: 12500,
    entryValue: 3500,
    entryPaid: true,
    installmentsCount: 6,
    installmentsValue: 1500,
    pdfAttached: {
      name: 'Contrato_Defesa_ThiagoOliveira.pdf',
      size: '950 KB',
      uploadedAt: '2026-05-01'
    },
    createdAt: '2026-05-01T15:00:00Z'
  },
  {
    id: 'con3',
    clientId: 'c3',
    processNumber: '0019283-77.2023.8.26.0041',
    processDetails: 'Processo Execução Penal nº 4, regime semiaberto com pedido de progressão e saídas temporárias.',
    processType: 'Execução Penal',
    representedName: 'Carlos Eduardo Cavalcanti',
    isRecurring: false,
    totalValue: 8000,
    entryValue: 2000,
    entryPaid: true,
    installmentsCount: 4,
    installmentsValue: 1500,
    pdfAttached: null,
    createdAt: '2026-05-10T10:00:00Z'
  }
];

export const INITIAL_INSTALLMENTS: Installment[] = [
  // Contract 1: Roberto Santos. Total: 25k. Entry paid: 5k. 10 x 2k.
  // 1st Due: 2026-05-15 (Paid)
  {
    id: 'inst_con1_1',
    contractId: 'con1',
    clientId: 'c1',
    installmentNumber: 1,
    dueDate: '2026-05-15',
    value: 2000,
    status: 'paid',
    paymentDate: '2026-05-14'
  },
  // 2nd Due: 2026-06-15 (Pending)
  {
    id: 'inst_con1_2',
    contractId: 'con1',
    clientId: 'c1',
    installmentNumber: 2,
    dueDate: '2026-06-15',
    value: 2000,
    status: 'pending'
  },
  {
    id: 'inst_con1_3',
    contractId: 'con1',
    clientId: 'c1',
    installmentNumber: 3,
    dueDate: '2026-07-15',
    value: 2000,
    status: 'pending'
  },
  {
    id: 'inst_con1_4',
    contractId: 'con1',
    clientId: 'c1',
    installmentNumber: 4,
    dueDate: '2026-08-15',
    value: 2000,
    status: 'pending'
  },

  // Contract 2: Maria de Lourdes (Thiago Oliveira). Total: 12.5k. Entry paid: 3.5k. 6 x 1.5k.
  // 1st Due: 2026-05-05 (Paid)
  {
    id: 'inst_con2_1',
    contractId: 'con2',
    clientId: 'c2',
    installmentNumber: 1,
    dueDate: '2026-05-05',
    value: 1500,
    status: 'paid',
    paymentDate: '2026-05-05'
  },
  // 2nd Due: 2026-06-05 (Overdue - Today is 2026-06-09)
  {
    id: 'inst_con2_2',
    contractId: 'con2',
    clientId: 'c2',
    installmentNumber: 2,
    dueDate: '2026-06-05',
    value: 1500,
    status: 'overdue'
  },
  {
    id: 'inst_con2_3',
    contractId: 'con2',
    clientId: 'c2',
    installmentNumber: 3,
    dueDate: '2026-07-05',
    value: 1500,
    status: 'pending'
  },

  // Contract 3: Carlos Eduardo. Total: 8k. Entry: 2k. 4 x 1.5k.
  // 1st Due: 2026-06-09 (Pending - Due TODAY 2026-06-09)
  {
    id: 'inst_con3_1',
    contractId: 'con3',
    clientId: 'c3',
    installmentNumber: 1,
    dueDate: '2026-06-09',
    value: 1500,
    status: 'pending'
  },
  // 2nd Due: 2026-07-09 (Pending)
  {
    id: 'inst_con3_2',
    contractId: 'con3',
    clientId: 'c3',
    installmentNumber: 2,
    dueDate: '2026-07-09',
    value: 1500,
    status: 'pending'
  }
];

export const DEFAULT_TEMPLATES: MessageTemplates = {
  welcome: `Presado(a) *{nome_cliente}*,

Gostaríamos de formalizar as boas-vindas ao nosso escritório. O contrato de prestação de serviços civis e criminais para a defesa de *{nome_representado}* foi cadastrado com sucesso.

*Resumo Contratual:*
• Processo nº: {numero_processo}
• Detalhes: {detalhes_processo}
• Valor de Entrada cobrado: R$ {valor_entrada}
• Parcelamento: {parcelas_total} parcelas mensais de R$ {valor_parcela} todo dia {dia_vencimento}.

Agradecemos o voto de confiança técnica em nosso patrocínio jurídico e permanecemos à inteira disposição para prestar quaisquer esclarecimentos adicionais.

Atenciosamente,
*Dr. Heitor Barreto, Advocacia Criminalistal*`,

  dueToday: `Olá, *{nome_cliente}*, tudo bem?

Passamos para lembrar amigavelmente que vence hoje (*{vencimento}*) a parcela de nº *{parcela_atual}/{parcelas_total}* referente aos honorários contratados do processo nº *{numero_processo}*.

• Parcela Atual: {parcela_atual} de {parcelas_total}
• Valor devido: R$ {valor_parcela}
• Situação financeira: Em dia

Para realizar o pagamento através de transferência ou chave PIX, favor utilizar o e-mail cadastrado ou responder a este contato para obter o código QR correspondente. Solicitamos o envio do comprovante para procedermos com a respectiva baixa em nosso prontuário financeiro.

Cordialmente,
*Setor de Faturamento - Criminal Pay*`,

  interestWarning: `ALERTA DE PENDÊNCIA FINANCEIRO - *{nome_cliente}*

Prezado(a), nosso sistema de faturamento identificou uma pendência em relação à parcela nº *{parcela_atual}/{parcelas_total}* vencida em *{vencimento}*. 

• Processo: {numero_processo}
• Defesa assistida: {nome_representado}
• Valor em aberto: R$ {valor_parcela}
• Dias de atraso: {dias_atraso} dias.

Gostaríamos de solicitar a regularização imediata do valor em aberto para afastar a incidência de obrigações em juros devidos e a suspensão regulamentar do processamento do plano financeiro contratado.

Caso já tenha procedido com o pagamento em tela ou possua comprovante de envio, favor acusar o recebimento por este canal para efetuarmos a conferência imediatamente.

Atenciosamente,
*Assessoria Jurídico-Financeira - Dr. Heitor Barreto*`,

  extrajudicialNotice: `NOTIFICAÇÃO EXTRAJUDICIAL DE COBRANÇA DE HONORÁRIOS

À atenção de: *{nome_cliente}*
Re: Inadimplemento Contratual de Assistência Jurídica - Processo nº {numero_processo}

Prezado(a) Senhor(a),

Pela presente notificação, servimo-nos do presente expediente para NOTIFICÁ-LO(A) formalmente sobre a ausência de pagamento da(s) parcela(s) referida(s) no contrato assinado, com atraso superior a *{dias_atraso} dias*.

Recomendamos em caráter amigável a adoção de contato imediato com este escritório no prazo impreterível de 48h (quarenta e oito horas) para a devida renegociação ou integral liquidação do saldo, sob pena de incorrer em quebra e rescisão de contrato por abandono ou descumprimento por culpa de contraparte, com a subsequente cobrança extrajudicial/judicial de perdas e danos e custas acessórias.

Para regularizar, responda a esta mensagem.

Com as considerações de estilo,
*Dr. Heitor Barreto, Advogado Criminal*
OAB/SP nº 447.882`
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'due_today',
    title: 'Vencimento Hoje',
    message: 'A parcela 1/4 do cliente Carlos Eduardo Cavalcanti (R$ 1.500,00) vence no dia de hoje.',
    date: '2026-06-09T08:00:00Z',
    read: false,
    meta: {
      installmentId: 'inst_con3_1',
      clientId: 'c3',
      contractId: 'con3'
    }
  },
  {
    id: 'n2',
    type: 'overdue',
    title: 'Parcela em Atraso',
    message: 'A parcela 2/6 da cliente Maria de Lourdes Oliveira venceu há 4 dias (05/06) e está inadimplente.',
    date: '2026-06-06T09:00:00Z',
    read: false,
    meta: {
      installmentId: 'inst_con2_2',
      clientId: 'c2',
      contractId: 'con2'
    }
  },
  {
    id: 'n3',
    type: 'system',
    title: 'Novo Contrato Registrado',
    message: 'Contrato de Carlos Eduardo Cavalcanti foi registrado e as parcelas geradas com sucesso.',
    date: '2026-05-10T10:05:00Z',
    read: true,
    meta: {
      contractId: 'con3'
    }
  }
];
