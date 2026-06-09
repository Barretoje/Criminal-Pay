/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Contract, Installment, MessageTemplates } from '../types';

/**
 * Formats a number as Brazilian Real (BRL) currency
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into Brazilian format (DD/MM/YYYY)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

/**
 * Calculates absolute days between a due date and another date
 */
export function calculateDaysDelay(dueDateStr: string, benchmarkDateStr = '2026-06-09'): number {
  const due = new Date(dueDateStr + 'T00:00:00');
  const bench = new Date(benchmarkDateStr + 'T00:00:00');
  
  const diffTime = bench.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Generates WhatsApp click-to-chat URL with pre-filled encoded text
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  // Clean phone number from non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  // Default to Brazil country code 55 if not provided
  const formattedPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
}

/**
 * Replaces message templates dynamic slots with values
 */
export function fillMessageTemplate(
  template: string,
  client: Client,
  contract: Contract,
  installment?: Installment,
  benchmarkDateStr = '2026-06-09'
): string {
  let message = template;

  const dueDay = installment 
    ? installment.dueDate.split('-')[2] 
    : (contract.entryValue > 0 ? '05' : '10'); // Default fallback

  // Calculate delay days if applicable
  const delay = installment ? calculateDaysDelay(installment.dueDate, benchmarkDateStr) : 0;

  const replacements: Record<string, string> = {
    '{nome_cliente}': client.name,
    '{nome_representado}': contract.representedName,
    '{numero_processo}': contract.processNumber || 'Sem processo cadastrado',
    '{detalhes_processo}': contract.processDetails || 'N/A',
    '{valor_entrada}': formatBRL(contract.entryValue),
    '{valor_parcela}': formatBRL(contract.installmentsValue),
    '{parcelas_total}': String(contract.installmentsCount),
    '{dia_vencimento}': dueDay,
    '{vencimento}': installment ? formatDate(installment.dueDate) : '',
    '{parcela_atual}': installment ? String(installment.installmentNumber) : '',
    '{dias_atraso}': String(delay),
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    message = message.replaceAll(placeholder, value);
  });

  return message;
}
