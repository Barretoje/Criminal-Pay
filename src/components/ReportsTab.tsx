/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert, Users, 
  DollarSign, Sparkles, Send, Calendar, RefreshCw 
} from 'lucide-react';
import { Client, Contract, Installment, MessageTemplates } from '../types';
import { formatBRL, formatDate, fillMessageTemplate, generateWhatsAppLink } from '../utils/helpers';
import { motion } from 'motion/react';

interface ReportsTabProps {
  clients: Client[];
  contracts: Contract[];
  installments: Installment[];
  templates: MessageTemplates;
}

export default function ReportsTab({
  clients,
  contracts,
  installments,
  templates
}: ReportsTabProps) {
  // Financial analysis calculations
  const totalEntriesValue = contracts.reduce((acc, c) => acc + c.entryValue, 0);
  
  const paidInstallmentsSum = installments
    .filter(i => i.status === 'paid')
    .reduce((acc, i) => acc + i.value, 0);

  const overdueInstallmentsSum = installments
    .filter(i => i.status === 'overdue')
    .reduce((acc, i) => acc + i.value, 0);

  const pendingInstallmentsSum = installments
    .filter(i => i.status === 'pending')
    .reduce((acc, i) => acc + i.value, 0);

  // General Totals
  const totalReceived = totalEntriesValue + paidInstallmentsSum; 
  const totalOverdue = overdueInstallmentsSum;
  const totalFuturePending = pendingInstallmentsSum;
  const grandTotalPortafolio = totalReceived + totalOverdue + totalFuturePending;

  // Recovery & Bad Debt Ratios
  const recoveryRate = grandTotalPortafolio > 0 
    ? (totalReceived / (totalReceived + totalOverdue)) * 100 
    : 100;
  
  const defaultRate = grandTotalPortafolio > 0
    ? (totalOverdue / (totalReceived + totalOverdue)) * 100
    : 0;

  // Delinquency statistics
  const overdueUnpaidCount = installments.filter(i => i.status === 'overdue').length;
  const distinctInadimplentesClientsCount = new Set(
    installments.filter(i => i.status === 'overdue').map(i => i.clientId)
  ).size;

  const getClientOfInstallment = (clientId: string): Client => {
    return clients.find(c => c.id === clientId) || {
      id: '',
      name: 'Cliente',
      phone: '',
      cpf: '',
      email: '',
      notes: '',
      createdAt: ''
    };
  };

  const getContractOfInstallment = (contractId: string): Contract => {
    return contracts.find(c => c.id === contractId) || {
      id: '',
      clientId: '',
      processNumber: '',
      processDetails: '',
      processType: 'Outro',
      representedName: '',
      isRecurring: false,
      totalValue: 0,
      entryValue: 0,
      entryPaid: false,
      installmentsCount: 0,
      installmentsValue: 0,
      createdAt: ''
    };
  };

  // Group cash flow by Month-Year (YYYY-MM) dynamically
  const parseMonthYearPT = (dateStr: string) => {
    const parts = dateStr.split('-'); // [YYYY, MM, DD]
    const year = parts[0];
    const monthIndex = parseInt(parts[1] || '1') - 1;
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[monthIndex]} ${year}`;
  };

  const monthlyFlows: Record<string, { monthKey: string; monthLabel: string; received: number; pending: number; overdue: number }> = {};

  // Seed with month ranges for our contracts
  installments.forEach(inst => {
    const monthKey = inst.dueDate.substring(0, 7); // "YYYY-MM"
    if (!monthlyFlows[monthKey]) {
      monthlyFlows[monthKey] = {
        monthKey,
        monthLabel: parseMonthYearPT(inst.dueDate),
        received: 0,
        pending: 0,
        overdue: 0
      };
    }
    if (inst.status === 'paid') {
      monthlyFlows[monthKey].received += inst.value;
    } else if (inst.status === 'overdue') {
      monthlyFlows[monthKey].overdue += inst.value;
    } else {
      monthlyFlows[monthKey].pending += inst.value;
    }
  });

  // Sort monthly keys chronologically
  const sortedMonths = Object.values(monthlyFlows).sort((a, b) => a.monthKey > b.monthKey ? 1 : -1);

  // Maximum value for proportional chart scale
  const maxFlowValue = Math.max(...sortedMonths.map(m => m.received + m.pending + m.overdue), 1000);

  // Fire overdue prompt on WhatsApp
  const handleQuickCharge = (inst: Installment, reminderType: 'interestWarning' | 'extrajudicialNotice') => {
    const client = getClientOfInstallment(inst.clientId);
    const contract = getContractOfInstallment(inst.contractId);
    let baseTemplate = templates[reminderType];
    const text = fillMessageTemplate(baseTemplate, client, contract, inst);
    const link = generateWhatsAppLink(client.phone, text);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6" id="reports-tab-container">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="reports-summary-cards">
        {/* Card 1: Received */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Arrecadado</span>
            <p className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">{formatBRL(totalReceived)}</p>
            <span className="text-[10px] text-emerald-600 font-bold font-mono">Entradas inclusas</span>
          </div>
        </div>

        {/* Card 2: Overdue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inadimplência Ativa</span>
            <p className="text-sm font-extrabold text-rose-600 font-mono mt-0.5">{formatBRL(totalOverdue)}</p>
            <span className="text-[10px] text-slate-400 font-medium">Devedores ativos: {distinctInadimplentesClientsCount}</span>
          </div>
        </div>

        {/* Card 3: Pending future */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Previsão de Recebível</span>
            <p className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">{formatBRL(totalFuturePending)}</p>
            <span className="text-[10px] text-slate-400 font-medium">Parcelas futuras pendentes</span>
          </div>
        </div>

        {/* Card 4: Index scores */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-slate-900 text-amber-500 rounded-xl border border-slate-800 shrink-0 animate-bounce">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Índice Adimplência</span>
            <p className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">{recoveryRate.toFixed(1)}%</p>
            <span className="text-[10px] text-emerald-600 font-semibold">Inadimplentes: {defaultRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Cash Flow Distribution Chart */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs" id="reports-charts-panel">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm leading-tight">Projeções e Fluxo de Caixa Mensal</h4>
            <p className="text-xs text-slate-400">Detalhamento cronológico da distribuição de parcelas pagas, futuras e em atraso por mês.</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Arrecadado</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-550 bg-amber-400" /> A Vencer</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500" /> Atrasado</div>
          </div>
        </div>

        {/* Custom Rendered Responsive Bar Chart */}
        <div className="space-y-4 pt-2">
          {sortedMonths.map((m, index) => {
            const sumVal = m.received + m.pending + m.overdue;
            const pctRec = (m.received / maxFlowValue) * 100;
            const pctPen = (m.pending / maxFlowValue) * 100;
            const pctOvr = (m.overdue / maxFlowValue) * 100;

            return (
              <div key={index} className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 border-b border-slate-50 pb-3 last:border-b-0">
                <span className="w-24 text-xs font-bold text-slate-800 pr-2 shrink-0">{m.monthLabel}</span>
                
                <div className="flex-1 w-full flex items-center h-6 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden relative">
                  {/* Segment: Received */}
                  {m.received > 0 && (
                    <div 
                      style={{ width: `${pctRec}%` }} 
                      className="bg-emerald-500 h-full hover:opacity-90 transition-opacity" 
                      title={`Quito: ${formatBRL(m.received)}`}
                    />
                  )}
                  {/* Segment: Pending */}
                  {m.pending > 0 && (
                    <div 
                      style={{ width: `${pctPen}%` }} 
                      className="bg-amber-400 h-full hover:opacity-90 transition-opacity" 
                      title={`A vencer: ${formatBRL(m.pending)}`}
                    />
                  )}
                  {/* Segment: Overdue */}
                  {m.overdue > 0 && (
                    <div 
                      style={{ width: `${pctOvr}%` }} 
                      className="bg-rose-500 h-full hover:opacity-90 transition-opacity" 
                      title={`Inadimplente: ${formatBRL(m.overdue)}`}
                    />
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-800 font-mono block">{formatBRL(sumVal)}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Arrecadado: {formatBRL(m.received)}</span>
                </div>
              </div>
            );
          })}

          {sortedMonths.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              Gerando projeções... Insira pelo menos um contrato.
            </div>
          )}
        </div>
      </div>

      {/* Past due collections detail section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs" id="reports-collections-panel">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h4 className="font-extrabold text-slate-900 text-sm">Lista de Inadimplência Crítica ({overdueUnpaidCount} Parcela(s))</h4>
          </div>
          <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-bold uppercase font-mono">Controle de Carteira</span>
        </div>

        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {installments.filter(i => i.status === 'overdue').length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-medium text-emerald-700">Parabéns! Sua carteira de cobranças de honorários está 100% regularizada.</p>
            </div>
          ) : (
            installments.filter(i => i.status === 'overdue').map((inst) => {
              const client = getClientOfInstallment(inst.clientId);
              const contract = getContractOfInstallment(inst.contractId);

              return (
                <div key={inst.id} className="p-4 border border-rose-100 rounded-xl bg-rose-50/5/30 hover:bg-rose-50/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                      <Users className="w-4 h-4 text-rose-500" />
                      {client.name}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">
                      Parcela #{inst.installmentNumber} • Venceu em {formatDate(inst.dueDate)} • Proc: {contract.processNumber || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className="text-xs font-bold font-mono text-slate-900">{formatBRL(inst.value)}</span>
                    
                    <div className="flex gap-1.5" id="direct-whatsapp-charges-actions">
                      <button
                        onClick={() => handleQuickCharge(inst, 'interestWarning')}
                        className="p-1 px-2.5 text-[10px] font-bold bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-600 flex items-center gap-1 shadow-xs transition-all"
                        title="Enviar lembrete de juros pelo WhatsApp"
                      >
                        <Send className="w-3 h-3" />
                        Cobrar Juros
                      </button>
                      <button
                        onClick={() => handleQuickCharge(inst, 'extrajudicialNotice')}
                        className="p-1 px-2.5 text-[10px] font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-1 shadow-xs transition-all"
                        title="Enviar notificação extrajudicial pelo WhatsApp"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Notificar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
