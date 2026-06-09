/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, User, FileText, CheckCircle2, 
  AlertCircle, Clock, Check 
} from 'lucide-react';
import { Client, Contract, Installment, MessageTemplates } from '../types';
import { formatDate, formatBRL } from '../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarTabProps {
  clients: Client[];
  contracts: Contract[];
  installments: Installment[];
  templates: MessageTemplates;
  markInstallmentAsPaid: (id: string) => void;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarTab({
  clients,
  contracts,
  installments,
  templates,
  markInstallmentAsPaid
}: CalendarTabProps) {
  // Lock default initial calendar view to June 2026 to see the rich mock data, but support free navigation!
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // 5 corresponds to Junes (0-indexed)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-06-09');

  const getClientOfInstallment = (clientId: string) => {
    return clients.find(c => c.id === clientId) || { name: 'Desconhecido', phone: '' };
  };

  const getContractOfInstallment = (contractId: string) => {
    return contracts.find(c => c.id === contractId) || { processNumber: 'Sem processo' };
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Calendar Engine calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Create full grid array
  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // 1. Previous month padding
  const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDaysCount - i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // 2. Current Month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  // 3. Next month padding
  const totalCellsNeeded = 42; // standard 6 rows
  const nextMonthPadding = totalCellsNeeded - calendarCells.length;
  for (let d = 1; d <= nextMonthPadding; d++) {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Helper to retrieve installments sorted for a specific day string
  const getInstallmentsDueOnDate = (dateStr: string) => {
    return installments.filter(i => i.dueDate === dateStr);
  };

  const selectedDateInstallments = getInstallmentsDueOnDate(selectedDateStr);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="calendar-tab-container">
      {/* Calendar Grid card */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col h-full" id="calendar-grid-card">
        {/* Navigation bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="font-extrabold text-slate-800 tracking-tight text-sm md:text-base">
              {MONTHS_PT[currentMonth]} {currentYear}
            </span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-600 hover:text-slate-900"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-600 hover:text-slate-900"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days Name header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2">
          {DAYS_SHORT.map((d, index) => (
            <div key={index} className="py-1">{d}</div>
          ))}
        </div>

        {/* Calendar days cells */}
        <div className="grid grid-cols-7 gap-1.5 flex-1 select-none">
          {calendarCells.map((cell, index) => {
            const hasDue = getInstallmentsDueOnDate(cell.dateStr);
            const isSelected = selectedDateStr === cell.dateStr;
            
            // Check status for dot colors
            const hasOverdue = hasDue.some(i => i.status === 'overdue');
            const hasPending = hasDue.some(i => i.status === 'pending');
            const hasPaid = hasDue.some(i => i.status === 'paid');

            let dotColor = '';
            if (hasOverdue) dotColor = 'bg-rose-500';
            else if (hasPending) dotColor = 'bg-amber-500';
            else if (hasPaid) dotColor = 'bg-emerald-500';

            return (
              <div
                key={index}
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative p-1 cursor-pointer transition-all border ${
                  isSelected 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md font-bold scale-[1.03]' 
                    : !cell.isCurrentMonth
                    ? 'bg-slate-50 border-transparent text-slate-350 hover:bg-slate-100/50'
                    : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'
                }`}
              >
                <span className="text-xs">{cell.dayNum}</span>

                {/* Event Dot Indicators */}
                {hasDue.length > 0 && (
                  <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-amber-400' : dotColor
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Side panel list Details */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col h-full justify-between" id="calendar-details-card">
        <div>
          <div className="pb-4 border-b border-slate-150 mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Agenda Financeira</span>
            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              {formatDate(selectedDateStr)}
            </span>
          </div>

          <h4 className="font-extrabold text-slate-900 text-sm mb-4">Compromissos do Dia</h4>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {selectedDateInstallments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs">Nenhum vencimento ou pagamento agendado para este dia.</p>
              </div>
            ) : (
              selectedDateInstallments.map((inst) => {
                const client = getClientOfInstallment(inst.clientId);
                const contract = getContractOfInstallment(inst.contractId);

                return (
                  <div 
                    key={inst.id} 
                    className={`p-4 border rounded-xl relative shadow-xs transition-colors ${
                      inst.status === 'paid' 
                        ? 'border-emerald-100 bg-emerald-50/10' 
                        : inst.status === 'overdue' 
                        ? 'border-rose-100 bg-rose-50/10' 
                        : 'border-slate-150 bg-slate-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        inst.status === 'paid' ? 'text-emerald-700' : inst.status === 'overdue' ? 'text-rose-700 font-extrabold' : 'text-slate-500'
                      }`}>
                        Parcela #{inst.installmentNumber} • {
                          inst.status === 'paid' ? 'Quitada' : inst.status === 'overdue' ? 'Em atraso' : 'A Vencer'
                        }
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 font-mono">
                        {formatBRL(inst.value)}
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-800 text-xs mb-1">{client.name}</h5>
                    <p className="text-[10px] text-slate-500 font-mono">Proc: {contract.processNumber || 'N/A'}</p>

                    {inst.status !== 'paid' && (
                      <button
                        onClick={() => markInstallmentAsPaid(inst.id)}
                        className="mt-3 w-full py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Marcar como Pago
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info box */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] leading-relaxed text-slate-400 italic">
          💡 Clique em qualquer dia no calendário para visualizar ou dar quitação às parcelas correspondentes de honorários.
        </div>
      </div>
    </div>
  );
}
