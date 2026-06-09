/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Client {
  id: string;
  name: string;
  phone: string; // WhatsApp matching format (e.g., "5511999999999")
  cpf: string;
  email: string;
  notes: string;
  createdAt: string;
}

export type ProcessType = 
  | 'Tribunal do Júri' 
  | 'Rito Comum (Ordinário/Sumário)' 
  | 'Audiência de Custódia / Flagrante' 
  | 'Recurso e Habeas Corpus' 
  | 'Execução Penal' 
  | 'Inquérito Policial' 
  | 'Outro';

export interface Contract {
  id: string;
  clientId: string;
  processNumber: string;
  processDetails: string;
  processType: ProcessType;
  representedName: string; // Person represented (defendant)
  isRecurring: boolean; // True for monthly retention, false for fixed total with entry
  totalValue: number; // Optional if recurring, but standard total representing general fee
  entryValue: number; // Value of Down Payment
  entryPaid: boolean;
  installmentsCount: number;
  installmentsValue: number;
  pdfAttached?: {
    name: string;
    size: string;
    uploadedAt: string;
    content?: string; // Simulated base64 or status
  } | null;
  createdAt: string;
  latePenaltyPercentage?: number; // Multa em % por atraso
  lateInterestPercentage?: number; // Juros mensais em % por atraso
}

export interface Installment {
  id: string;
  contractId: string;
  clientId: string;
  installmentNumber: number; // 0 for Entry/Down payment, 1, 2... for actual monthly installments
  dueDate: string; // YYYY-MM-DD
  value: number;
  status: 'pending' | 'paid' | 'overdue';
  paymentDate?: string;
}

export interface MessageTemplates {
  welcome: string; // Boas vindas ao fechar contrato
  dueToday: string; // Lembrete no dia do vencimento
  interestWarning: string; // Mensagem com aviso de atraso e juros
  extrajudicialNotice: string; // Notificação extrajudicial para atraso longo
}

export interface AppNotification {
  id: string;
  type: 'due_today' | 'overdue' | 'system' | 'new_contract';
  title: string;
  message: string;
  date: string;
  read: boolean;
  meta?: {
    installmentId?: string;
    clientId?: string;
    contractId?: string;
  };
}
