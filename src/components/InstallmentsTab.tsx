/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  CheckCircle2, AlertCircle, Clock, Search, ExternalLink, Calendar, 
  Send, User, FileText, ArrowRight, X, Sparkles, MessageCircleCode 
} from 'lucide-react';
import { Client, Contract, Installment, MessageTemplates } from '../types';
import { formatBRL, formatDate, fillMessageTemplate, generateWhatsAppLink, calculateDaysDelay } from '../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

interface InstallmentsTabProps {
  clients: Client[];
  contracts: Contract[];
  installments: Installment[];
  templates: MessageTemplates;
  markInstallmentAsPaid: (id: string) => void;
}

type InstallmentFilter = 'a-vencer' | 'atrasadas' | 'pagas';

export default function InstallmentsTab({
  clients,
  contracts,
  installments,
  templates,
  markInstallmentAsPaid
}: InstallmentsTabProps) {
  const [activeFilter, setActiveFilter] = useState<InstallmentFilter>('a-vencer');
  const [search, setSearch] = useState('');
  
  // WhatsApp dispatch states
  const [payingInstallment, setPayingInstallment] = useState<Installment | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const getClientOfInstallment = (clientId: string): Client => {
    return clients.find(c => c.id === clientId) || {
      id: '',
      name: 'Cliente não cadastrado',
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

  // Filters
  const filteredInstallments = installments.filter(inst => {
    // Filter by tab status
    if (activeFilter === 'pagas' && inst.status !== 'paid') return false;
    if (activeFilter === 'atrasadas' && inst.status !== 'overdue') return false;
    // For pending/a vencendo, status can be 'pending' (could also show those of today)
    if (activeFilter === 'a-vencer' && inst.status !== 'pending') return false;

    // Search query
    const client = getClientOfInstallment(inst.clientId);
    const contract = getContractOfInstallment(inst.contractId);
    const query = search.toLowerCase();

    return (
      client.name.toLowerCase().includes(query) ||
      contract.processNumber.toLowerCase().includes(query) ||
      inst.dueDate.includes(query)
    );
  });

  // Sort: Chronological order
  const sortedInstallments = [...filteredInstallments].sort((a, b) => {
    if (activeFilter === 'pagas') {
      // most recently paid first
      return (b.paymentDate || '') > (a.paymentDate || '') ? 1 : -1;
    }
    // pending or overdue: earliest first
    return a.dueDate > b.dueDate ? 1 : -1;
  });

  // Pay triggers confirmation dialog
  const handleMarkAsPaid = (inst: Installment) => {
    // 1. Perform state mutation
    markInstallmentAsPaid(inst.id);

    // 2. Set paying state
    setPayingInstallment(inst);

    // 3. Draft customized WhatsApp receipt confirmation message
    const client = getClientOfInstallment(inst.clientId);
    const contract = getContractOfInstallment(inst.contractId);

    // Find paid installments counter of this contract (including the current one)
    const allContractInstallments = installments.filter(i => i.contractId === inst.contractId);
    const totalInstallmentsCount = allContractInstallments.length;
    const currentPaidCount = allContractInstallments.filter(i => i.status === 'paid' || i.id === inst.id).length;
    const remainingCount = totalInstallmentsCount - currentPaidCount;

    const receiptDraft = `Olá, *${client.name}*! ⚖️

Confirmamos o recebimento e procedemos com a respectiva quitação da parcela de n° *${inst.installmentNumber}/${totalInstallmentsCount}*, no valor de *${formatBRL(inst.value)}*, referente aos honorários do processo de nº *${contract.processNumber}*.

*Resumo das parcelas:*
✅ Parcelas Quitas: ${currentPaidCount} de ${totalInstallmentsCount}
⏳ Parcelas a vencer: ${remainingCount} restantes
📊 Situação cadastral: *EM DIA*

Agradecemos a colaboração e envio do comprovante. Caso precise de alguma cópia de termos, estamos às ordens neste canal.

Atenciosamente,
*Setor de Faturamento e Cobrança - Criminal Pay*`;

    setCustomMessage(receiptDraft);
    setWhatsappModalOpen(true);
  };

  const dispatchWhatsApp = () => {
    if (!payingInstallment) return;
    const client = getClientOfInstallment(payingInstallment.clientId);
    if (!client.phone) {
      alert("Este cliente não possui telefone/whatsApp cadastrado!");
      return;
    }
    const link = generateWhatsAppLink(client.phone, customMessage);
    window.open(link, '_blank');
    setWhatsappModalOpen(false);
    setPayingInstallment(null);
  };

  // Direct reminder buttons (Aviso juros, Lembrete hoje, Notificacao Extrajudicial)
  const handleSendReminder = (inst: Installment, reminderType: 'dueToday' | 'interestWarning' | 'extrajudicialNotice') => {
    const client = getClientOfInstallment(inst.clientId);
    const contract = getContractOfInstallment(inst.contractId);
    
    let baseTemplate = templates[reminderType];
    const text = fillMessageTemplate(baseTemplate, client, contract, inst);

    setPayingInstallment(inst);
    setCustomMessage(text);
    setWhatsappModalOpen(true);
  };

  return (
    <div className="space-y-6" id="installments-tab-container">
      {/* Sub tabs filtering & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between" id="installments-filters-bar">
        {/* State filters */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50" id="installments-filters-buttons">
          <button
            onClick={() => setActiveFilter('a-vencer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 ${
              activeFilter === 'a-vencer' 
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            Parcelas a Vencer
          </button>
          
          <button
            onClick={() => setActiveFilter('atrasadas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 ${
              activeFilter === 'atrasadas' 
                ? 'bg-rose-500 text-white shadow-xs border border-rose-500/10' 
                : 'text-slate-500 hover:text-rose-600'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Parcelas Atrasadas
          </button>

          <button
            onClick={() => setActiveFilter('pagas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 ${
              activeFilter === 'pagas' 
                ? 'bg-emerald-500 text-white shadow-xs border border-emerald-500/10' 
                : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Parcelas Pagas
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Filtrar por nome de cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Main Installment Table / Desktop Slate list */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs" id="installments-data-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="p-4 pl-6">Cliente & Processo</th>
                <th className="p-4">Parcela Nº</th>
                <th className="p-4">Vencimento</th>
                {activeFilter === 'pagas' && <th className="p-4">Pago em</th>}
                {activeFilter === 'atrasadas' && <th className="p-4">Dias Atraso</th>}
                <th className="p-4">Valor devido</th>
                <th className="p-4 pr-6 text-right">Ação / Lembretes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {sortedInstallments.map((inst) => {
                const client = getClientOfInstallment(inst.clientId);
                const contract = getContractOfInstallment(inst.contractId);
                const delay = calculateDaysDelay(inst.dueDate);

                return (
                  <tr key={inst.id} className="hover:bg-slate-55/40 transition-colors">
                    {/* Column 1: Client & Process */}
                    <td className="p-4 pl-6">
                      <div>
                        <span className="font-extrabold text-slate-900 block hover:text-amber-600 cursor-pointer">{client.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Proc: {contract.processNumber || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Column 2: Installment index */}
                    <td className="p-4 font-mono font-medium">
                      Parcela #{inst.installmentNumber}
                    </td>

                    {/* Column 3: Due date */}
                    <td className="p-4 font-mono font-medium text-slate-600">
                      {formatDate(inst.dueDate)}
                    </td>

                    {/* Conditional: Paid date */}
                    {activeFilter === 'pagas' && (
                      <td className="p-4 font-mono font-medium text-emerald-600">
                        {inst.paymentDate ? formatDate(inst.paymentDate) : 'Simulado'}
                      </td>
                    )}

                    {/* Conditional: Overdue delay days */}
                    {activeFilter === 'atrasadas' && (
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-mono">
                          {delay} dias
                        </span>
                      </td>
                    )}

                    {/* Column 4: Value */}
                    <td className="p-4 font-bold font-mono text-slate-900">
                      {formatBRL(inst.value)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      {inst.status === 'paid' ? (
                        <div className="flex justify-end items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 border border-emerald-100 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Quitado
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {/* Mark paid handler */}
                          <button
                            onClick={() => handleMarkAsPaid(inst)}
                            className="bg-slate-900 hover:bg-slate-850 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg border border-slate-900 transition-all flex items-center gap-1 shadow-xs"
                          >
                            Quitar Parcela
                          </button>

                          {/* Quick Reminders based on timing */}
                          {inst.status === 'overdue' ? (
                            <div className="flex gap-1" id="overdue-alerts-triggers">
                              <button
                                onClick={() => handleSendReminder(inst, 'interestWarning')}
                                title="Enviar lembrete de atraso e juros"
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-[10px] p-1.5 rounded-lg"
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleSendReminder(inst, 'extrajudicialNotice')}
                                title="Enviar notificação extrajudicial"
                                className="bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 font-bold text-[10px] p-1.5 rounded-lg"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSendReminder(inst, 'dueToday')}
                              title="Enviar lembrete de vencimento hoje"
                              className="bg-sky-50 text-sky-600 border border-sky-100 hover:bg-sky-100 font-bold text-[10px] p-1.5 rounded-lg"
                            >
                              <MessageCircleCode className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {sortedInstallments.length === 0 && (
                <tr>
                  <td colSpan={activeFilter === 'pagas' || activeFilter === 'atrasadas' ? 7 : 6} className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    Nenhuma parcela localizada para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Preview Dispatch Confirmation Modal */}
      <AnimatePresence>
        {whatsappModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-5 bg-emerald-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                  <h3 className="font-bold text-sm">Disparar Lembrete WhatsApp</h3>
                </div>
                <button 
                  onClick={() => {
                    setWhatsappModalOpen(false);
                    setPayingInstallment(null);
                  }} 
                  className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50 mb-3">
                    <span className="text-slate-400 font-medium">Destinatário:</span>
                    <span className="font-bold text-slate-800">
                      {payingInstallment ? getClientOfInstallment(payingInstallment.clientId).name : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Telefone de contato:</span>
                    <span className="font-semibold text-slate-600 font-mono">
                      {payingInstallment ? getClientOfInstallment(payingInstallment.clientId).phone : ''}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Mensagem Pré-Programada (Visualização ao Vivo)</label>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">Editável</span>
                  </div>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 bg-slate-905 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 font-sans leading-relaxed resize-none"
                    placeholder="Seu texto de envio..."
                  />
                </div>

                <div className="bg-amber-50/50 rounded-2xl p-3 border border-amber-100 flex gap-2 text-[10px] leading-relaxed text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Instrução:</strong> Clicando no botão abaixo, uma nova aba do WhatsApp Web se abrirá automaticamente com o contato já selecionado e esta mensagem carregada na caixa de texto. Bastará clicar em enviar.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappModalOpen(false);
                      setPayingInstallment(null);
                    }}
                    className="px-4 py-2 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-500 transition-all"
                  >
                    Não enviar
                  </button>
                  <button
                    onClick={dispatchWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    Encaminhar ao WhatsApp
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
