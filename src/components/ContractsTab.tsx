/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileText, Plus, Search, Folder, Calendar, DollarSign, Scale, 
  Paperclip, ArrowRight, User, ShieldCheck, X, FileCheck, CheckCircle2,
  AlertTriangle, Clock, Copy, Send, ExternalLink, Printer, Check
} from 'lucide-react';
import { Client, Contract, ProcessType, Installment } from '../types';
import { formatBRL, formatDate, calculateDaysDelay, generateWhatsAppLink } from '../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

interface ContractsTabProps {
  clients: Client[];
  contracts: Contract[];
  installments: Installment[];
  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>, firstPaymentDate: string) => Contract;
  currentDateStr: string;
}

const PROCESS_TYPES: ProcessType[] = [
  'Tribunal do Júri',
  'Rito Comum (Ordinário/Sumário)',
  'Audiência de Custódia / Flagrante',
  'Recurso e Habeas Corpus',
  'Execução Penal',
  'Inquérito Policial',
  'Outro'
];

export default function ContractsTab({ clients, contracts, installments, addContract, currentDateStr }: ContractsTabProps) {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [clientId, setClientId] = useState('');
  const [processNumber, setProcessNumber] = useState('');
  const [processDetails, setProcessDetails] = useState('');
  const [processType, setProcessType] = useState<ProcessType>('Rito Comum (Ordinário/Sumário)');
  const [representedName, setRepresentedName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [totalValue, setTotalValue] = useState<number>(10000);
  const [entryValue, setEntryValue] = useState<number>(2000);
  const [installmentsCount, setInstallmentsCount] = useState<number>(5);
  const [installmentsValue, setInstallmentsValue] = useState<number>(1600); // Auto-calculated or entered
  const [firstPaymentDate, setFirstPaymentDate] = useState('2026-07-10');
  const [latePenaltyPercentage, setLatePenaltyPercentage] = useState<number>(10);
  const [lateInterestPercentage, setLateInterestPercentage] = useState<number>(1);
  
  // View Contract Status Modal States
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  
  // PDF Attachment Simulator State
  const [pdfAttached, setPdfAttached] = useState<Contract['pdfAttached'] | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-calculate installments when values alter if not recurring
  const handleValueChange = (field: 'total' | 'entry' | 'count', val: number) => {
    let t = totalValue;
    let e = entryValue;
    let c = installmentsCount;

    if (field === 'total') { t = val; setTotalValue(val); }
    if (field === 'entry') { e = val; setEntryValue(val); }
    if (field === 'count') { c = val; setInstallmentsCount(val); }

    if (!isRecurring && c > 0) {
      const remainder = t - e;
      const installmentVal = remainder / c;
      setInstallmentsValue(Math.max(0, parseFloat(installmentVal.toFixed(2))));
    } else if (isRecurring) {
      // In case of recurring, the input field is set directly by user
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
        simulateUpload(file);
      } else {
        alert("Apenas arquivos no formato PDF são aceitos.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateUpload(e.target.files[0]);
    }
  };

  const simulateUpload = (file: File) => {
    setPdfAttached({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert("Selecione ou cadastre um cliente primeiro.");
      return;
    }

    addContract(
      {
        clientId,
        processNumber,
        processDetails,
        processType,
        representedName: representedName || (clients.find(c => c.id === clientId)?.name || ''),
        isRecurring,
        totalValue,
        entryValue,
        entryPaid: true,
        installmentsCount,
        installmentsValue,
        pdfAttached,
        latePenaltyPercentage,
        lateInterestPercentage
      },
      firstPaymentDate
    );

    // Reset Form
    setClientId('');
    setProcessNumber('');
    setProcessDetails('');
    setProcessType('Rito Comum (Ordinário/Sumário)');
    setRepresentedName('');
    setIsRecurring(false);
    setTotalValue(10000);
    setEntryValue(2000);
    setInstallmentsCount(5);
    setInstallmentsValue(1600);
    setFirstPaymentDate('2026-07-10');
    setLatePenaltyPercentage(10);
    setLateInterestPercentage(1);
    setPdfAttached(null);
    setIsAdding(false);
  };

  // Find currently selected contract details
  const clientSelected = selectedContract ? clients.find(c => c.id === selectedContract.clientId) : null;
  const contractInstallments = selectedContract ? installments.filter(inst => inst.contractId === selectedContract.id) : [];
  const sortedInsts = [...contractInstallments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  
  const totalPaidVal = sortedInsts.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.value, 0);
  const totalPendingVal = sortedInsts.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.value, 0);
  const totalOverdueBase = sortedInsts.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.value, 0);

  const computedOverdueList = sortedInsts.filter(i => i.status === 'overdue').map(inst => {
    const delayDays = calculateDaysDelay(inst.dueDate, currentDateStr);
    const multa = inst.value * (selectedContract?.latePenaltyPercentage ?? 10) / 100;
    const juros = inst.value * (((selectedContract?.lateInterestPercentage ?? 1) / 30) * delayDays) / 100;
    return {
      ...inst,
      delayDays,
      multa,
      juros,
      totalDue: inst.value + multa + juros
    };
  });

  const totalMultasSum = computedOverdueList.reduce((sum, item) => sum + item.multa, 0);
  const totalJurosSum = computedOverdueList.reduce((sum, item) => sum + item.juros, 0);
  const totalOverdueWithFees = computedOverdueList.reduce((sum, item) => sum + item.totalDue, 0);

  const handleGenerateAndOpenReportAndWhatsApp = () => {
    if (!selectedContract || !clientSelected) return;
    
    let lines = [];
    lines.push(`⚖️ *EXTRATO DE HONORÁRIOS JURÍDICOS* ⚖️`);
    lines.push(`----------------------------------------`);
    lines.push(`*Cliente:* ${clientSelected.name}`);
    lines.push(`*Processo:* ${selectedContract.processNumber || 'Sem número'}`);
    lines.push(`*Defesa:* ${selectedContract.representedName}`);
    lines.push(`*Procedimento:* ${selectedContract.processType}`);
    lines.push(`----------------------------------------`);
    lines.push(`*RESUMO FINANCEIRO:*`);
    lines.push(`• Valor Total Contratado: ${formatBRL(selectedContract.totalValue)}`);
    lines.push(`• Entrada: ${formatBRL(selectedContract.entryValue)} (Paga)`);
    lines.push(`• Valor Total Quitado: ${formatBRL(totalPaidVal + selectedContract.entryValue)}`);
    lines.push(`• Valor Futuro a Vencer: ${formatBRL(totalPendingVal)}`);
    
    if (computedOverdueList.length > 0) {
      lines.push(`• Valor de Parcelas Vencidas (Base): ${formatBRL(totalOverdueBase)}`);
      lines.push(`• Acréscimos (Multa: ${selectedContract.latePenaltyPercentage ?? 10}% | Juros: ${selectedContract.lateInterestPercentage ?? 1}% a.m): ${formatBRL(totalMultasSum + totalJurosSum)}`);
      lines.push(`⚠️ *TOTAL EM ATRASO:* ${formatBRL(totalOverdueWithFees)}`);
    } else {
      lines.push(`✅ *SITUAÇÃO FINANCEIRA:* EM DIA`);
    }
    
    lines.push(`----------------------------------------`);
    lines.push(`*DETALHAMENTO DE PARCELAS:*`);
    
    sortedInsts.forEach((inst) => {
      const numLabel = `Parc. ${inst.installmentNumber}/${selectedContract.installmentsCount}`;
      if (inst.status === 'paid') {
        lines.push(`✅ ${numLabel}: ${formatBRL(inst.value)} (Pago em ${formatDate(inst.paymentDate || '')})`);
      } else if (inst.status === 'overdue') {
        const item = computedOverdueList.find(c => c.id === inst.id);
        const feeDetail = item ? ` (+ multa/juros: ${formatBRL(item.multa + item.juros)})` : '';
        lines.push(`❌ ${numLabel}: ${formatBRL(inst.value)}${feeDetail} - Venceu em ${formatDate(inst.dueDate)} (${calculateDaysDelay(inst.dueDate, currentDateStr)} dias de atraso)`);
      } else {
        lines.push(`⏳ ${numLabel}: ${formatBRL(inst.value)} - Vence em ${formatDate(inst.dueDate)}`);
      }
    });
    
    lines.push(`----------------------------------------`);
    lines.push(`Ficamos à inteira disposição para regularizações ou envio de comprovantes.`);
    lines.push(`*Faturamento - Criminal Pay*`);
    
    const messageText = lines.join('\n');
    const link = generateWhatsAppLink(clientSelected.phone, messageText);
    window.open(link, '_blank');
  };

  const handleCopyReportToClipboard = () => {
    if (!selectedContract || !clientSelected) return;
    
    let lines = [];
    lines.push(`⚖️ EXTRATO DE HONORÁRIOS JURÍDICOS ⚖️`);
    lines.push(`----------------------------------------`);
    lines.push(`Cliente: ${clientSelected.name}`);
    lines.push(`Processo: ${selectedContract.processNumber || 'Sem número'}`);
    lines.push(`Defesa: ${selectedContract.representedName}`);
    lines.push(`Procedimento: ${selectedContract.processType}`);
    lines.push(`----------------------------------------`);
    lines.push(`RESUMO FINANCEIRO:`);
    lines.push(`• Valor Total Contratado: ${formatBRL(selectedContract.totalValue)}`);
    lines.push(`• Entrada: ${formatBRL(selectedContract.entryValue)} (Paga)`);
    lines.push(`• Valor Total Quitado: ${formatBRL(totalPaidVal + selectedContract.entryValue)}`);
    lines.push(`• Valor Futuro a Vencer: ${formatBRL(totalPendingVal)}`);
    
    if (computedOverdueList.length > 0) {
      lines.push(`• Valor de Parcelas Vencidas (Base): ${formatBRL(totalOverdueBase)}`);
      lines.push(`• Acréscimos (Multa: ${selectedContract.latePenaltyPercentage ?? 10}% | Juros: ${selectedContract.lateInterestPercentage ?? 1}% a.m): ${formatBRL(totalMultasSum + totalJurosSum)}`);
      lines.push(`⚠️ TOTAL EM ATRASO: ${formatBRL(totalOverdueWithFees)}`);
    } else {
      lines.push(`✅ SITUAÇÃO FINANCEIRA: EM DIA`);
    }
    lines.push(`----------------------------------------`);
    lines.push(`DETALHAMENTO DE PARCELAS:`);
    
    sortedInsts.forEach((inst) => {
      const numLabel = `Parc. ${inst.installmentNumber}/${selectedContract.installmentsCount}`;
      if (inst.status === 'paid') {
        lines.push(`[Paga] ${numLabel}: ${formatBRL(inst.value)} - Quitado em ${formatDate(inst.paymentDate || '')}`);
      } else if (inst.status === 'overdue') {
        const item = computedOverdueList.find(c => c.id === inst.id);
        const feeDetail = item ? ` (+ multa/juros: ${formatBRL(item.multa + item.juros)})` : '';
        lines.push(`[Vencida] ${numLabel}: ${formatBRL(inst.value)}${feeDetail} - Venceu em ${formatDate(inst.dueDate)}`);
      } else {
        lines.push(`[Pendente] ${numLabel}: ${formatBRL(inst.value)} - Vence em ${formatDate(inst.dueDate)}`);
      }
    });
    
    lines.push(`----------------------------------------`);
    lines.push(`Ficamos à inteira disposição para regularizações ou envio de comprovantes.`);
    
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    });
  };

  const getClientName = (id: string) => {
    return clients.find(c => c.id === id)?.name || 'Cliente de Honorários';
  };

  const filteredContracts = contracts.filter(c => {
    const clientName = getClientName(c.clientId).toLowerCase();
    const repName = c.representedName.toLowerCase();
    const procNum = c.processNumber.toLowerCase();
    const query = search.toLowerCase();
    return clientName.includes(query) || repName.includes(query) || procNum.includes(query);
  });

  return (
    <div className="space-y-6" id="contracts-tab-container">
      {/* Search and Trigger Row */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between" id="contracts-header">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Buscar por cliente, representado ou processo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
          />
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 border border-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm shrink-0"
          id="btn-new-contract"
        >
          <Plus className="w-4 h-4 text-amber-500" />
          Novo Contrato
        </button>
      </div>

      {/* Contract Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fadeIn" id="contracts-list-grid">
        {filteredContracts.map((contract) => (
          <div 
            key={contract.id} 
            className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-all flex flex-col justify-between hover:border-amber-500/10"
          >
            <div>
              {/* Header Details */}
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-dashed border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-slate-100 border border-slate-200/50 rounded-md text-slate-500 font-mono tracking-wider">
                    {contract.processType}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-500" />
                    Contratante: {getClientName(contract.clientId)}
                  </h4>
                  {contract.representedName !== getClientName(contract.clientId) && (
                    <p className="text-xs text-slate-500 font-medium ml-5.5 mt-0.5">
                      Representado: <span className="text-slate-700">{contract.representedName}</span>
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-mono">Processo nº</span>
                  <p className="text-xs font-semibold text-slate-800 font-mono tracking-tight">{contract.processNumber || 'Sem número'}</p>
                </div>
              </div>

              {/* Middle Section with Case notes */}
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100 mb-5">
                <span className="font-semibold text-slate-700 block mb-0.5">Contexto do Caso:</span>
                {contract.processDetails}
              </p>

              {/* Installment Layout Summaries */}
              <div className="grid grid-cols-3 gap-3 mb-5 text-center">
                <div className="p-2.5 bg-amber-50/40 border border-amber-50 rounded-xl">
                  <span className="text-[10px] block text-slate-400 font-bold uppercase tracking-wider mb-0.5">Entrada</span>
                  <span className="text-xs font-bold text-amber-800 font-mono">{formatBRL(contract.entryValue)}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] block text-slate-400 font-bold uppercase tracking-wider mb-0.5">Parcelado</span>
                  <span className="text-xs font-semibold text-slate-700 font-mono">
                    {contract.installmentsCount}x de
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] block text-slate-400 font-bold uppercase tracking-wider mb-0.5">Valor Parcela</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">{formatBRL(contract.installmentsValue)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 mt-auto gap-4">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Total Contratual:</span>
                <span className="text-sm font-extrabold text-slate-900 font-mono">{formatBRL(contract.totalValue)}</span>
              </div>

              <div className="flex items-center gap-2">
                {contract.pdfAttached ? (
                  <div 
                    title="Baixar Contrato assinado PDF"
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-900/40 border border-slate-800 rounded-lg px-2 py-1.5"
                  >
                    <FileCheck className="w-3 h-3 text-emerald-500" />
                    <span>PDF</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">Sem PDF</span>
                )}
                
                <button
                  type="button"
                  onClick={() => setSelectedContract(contract)}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 hover:bg-amber-500/20 hover:border-amber-500/30 transition-all cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5" />
                  Situação & Extrato
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredContracts.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl" id="no-contracts-status">
            <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium">Nenhum contrato ativo correspondente foi localizado.</p>
          </div>
        )}
      </div>

      {/* Add New Contract Dialog */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 my-8"
            >
              {/* Form Title bar */}
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-lg">Gerar Novo Contrato de Honorários</h3>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Onboard client mapping or select */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contratante (Cliente cadastrado)</label>
                    <select
                      required
                      value={clientId}
                      onChange={(e) => {
                        setClientId(e.target.value);
                        // Default representado name values
                        const clientName = clients.find(c => c.id === e.target.value)?.name || '';
                        setRepresentedName(clientName);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm h-10"
                    >
                      <option value="">Selecione um cliente...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.cpf})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Representado no Processo (Réu/Assistido)</label>
                    <input
                      type="text"
                      required
                      value={representedName}
                      onChange={(e) => setRepresentedName(e.target.value)}
                      placeholder="Ex: Nome da pessoa assistida"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Número do Processo Judicial</label>
                    <input
                      type="text"
                      value={processNumber}
                      onChange={(e) => setProcessNumber(e.target.value)}
                      placeholder="Ex: 1502431-88.2025.8.26.0050"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm h-10 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Capitulação Penal / Procedimento</label>
                    <select
                      required
                      value={processType}
                      onChange={(e) => setProcessType(e.target.value as ProcessType)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm h-10"
                    >
                      {PROCESS_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Breve Síntese e Pratica de Defesa</label>
                  <textarea
                    required
                    value={processDetails}
                    onChange={(e) => setProcessDetails(e.target.value)}
                    placeholder="Descreva detalhes adicionais: vara ou comarca judicial, delegacia policial de origem, capitulação, audiências agendadas, etc."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm resize-none"
                  />
                </div>

                {/* Financial Amortization Panel */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Plano de Pagamentos dos Honorários</h4>
                    {/* Switch layout styling for recurring bills */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Contrato Fixo com Entrada</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Total</label>
                      <input
                        type="number"
                        required
                        value={totalValue}
                        onChange={(e) => handleValueChange('total', parseFloat(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Entrada (PIX/Dinheiro)</label>
                      <input
                        type="number"
                        required
                        value={entryValue}
                        onChange={(e) => handleValueChange('entry', parseFloat(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qtd Parcelas</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="24"
                        value={installmentsCount}
                        onChange={(e) => handleValueChange('count', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Parcela</label>
                      <input
                        type="text"
                        disabled
                        value={formatBRL(installmentsValue)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-slate-100 rounded-lg text-sm font-mono font-bold text-slate-700 select-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-divider mb-1.5">Vencimento 1ª Parcela</label>
                      <input
                        type="date"
                        required
                        value={firstPaymentDate}
                        onChange={(e) => setFirstPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-divider mb-1.5">Multa p/ Atraso (%)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        value={latePenaltyPercentage}
                        onChange={(e) => setLatePenaltyPercentage(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-divider mb-1.5">Juros de Mora p/ Mês (%)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        value={lateInterestPercentage}
                        onChange={(e) => setLateInterestPercentage(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono h-10"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    <span>As parcelas subsequentes vencerão nos meses consecutivos. Multas e juros incidem apenas em parcelas com atraso verificado.</span>
                  </div>
                </div>

                {/* PDF Drop / Attacher Section */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Anexo Eletrônico do Contrato (Opcional - PDF)</label>
                  
                  {pdfAttached ? (
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{pdfAttached.name}</p>
                          <p className="text-[10px] text-emerald-600 font-mono">Tamanho: {pdfAttached.size} • Anexado em {pdfAttached.uploadedAt}</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setPdfAttached(null)}
                        className="p-1 px-2.5 rounded-lg text-xs bg-white hover:bg-rose-50 text-rose-500 border border-slate-200 hover:border-rose-100 transition-all font-semibold"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-3 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        dragActive 
                          ? 'border-amber-500 bg-amber-500/5' 
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <Paperclip className="w-7 h-7 text-slate-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Arraste e solte o Contrato em formato PDF aqui</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">ou clique para navegar no seu computador</p>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition-all"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    Gerar Contrato Completo
                    <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedContract && clientSelected && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 my-8"
              id="selected-contract-status-modal"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="font-bold text-base leading-tight">Situação Geral do Contrato</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Ref: Processo {selectedContract.processNumber || 'Sem número'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedContract(null)} 
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Client and Case Context */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Contratante / Réu</span>
                    <h4 className="font-bold text-slate-800 text-sm mt-0.5">{clientSelected.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">CPF: {clientSelected.cpf} • Tel: {clientSelected.phone}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Defesa Representada</span>
                    <h4 className="font-semibold text-slate-700 text-sm mt-0.5">{selectedContract.representedName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-sans">Capitulação: {selectedContract.processType}</p>
                  </div>
                </div>

                {/* Main Billing Totals Indicator Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center flex flex-col justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Geral</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">{formatBRL(selectedContract.totalValue)}</span>
                  </div>
                  
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl text-center flex flex-col justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">Total Pago</span>
                    <span className="text-sm font-extrabold text-emerald-700 font-mono">{formatBRL(totalPaidVal + selectedContract.entryValue)}</span>
                    <span className="text-[9px] text-emerald-600 block mt-0.5 font-medium leading-none">Entrada + Parcelas</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center flex flex-col justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Futuras a Vencer</span>
                    <span className="text-sm font-bold text-slate-700 font-mono">{formatBRL(totalPendingVal)}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-medium leading-none">Saldo em dia</span>
                  </div>

                  <div className={`p-3 rounded-2xl text-center flex flex-col justify-center ${
                    computedOverdueList.length > 0 
                      ? 'bg-rose-50 border border-rose-100' 
                      : 'bg-emerald-50/10 border border-emerald-50 text-slate-400'
                  }`}>
                    <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${
                      computedOverdueList.length > 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}>Em Atraso Corrigido</span>
                    <span className={`text-sm font-extrabold font-mono ${
                      computedOverdueList.length > 0 ? 'text-rose-700' : 'text-slate-500'
                    }`}>
                      {formatBRL(totalOverdueWithFees)}
                    </span>
                    {computedOverdueList.length > 0 && (
                      <span className="text-[8px] text-rose-500 block mt-0.5 font-mono leading-none">
                        Com multa/juros
                      </span>
                    )}
                  </div>
                </div>

                {/* Overdue details expansion if any */}
                {computedOverdueList.length > 0 && (
                  <div className="p-4 bg-amber-500/5 border border-amber-200/50 rounded-2xl text-left">
                    <h5 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      Acréscimos Incidentes por Atraso
                    </h5>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 bg-white rounded-lg border border-amber-100">
                        <span className="text-[8px] text-slate-400 block uppercase">Principal Vencido</span>
                        <span className="font-semibold text-slate-700 block mt-0.5">{formatBRL(totalOverdueBase)}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-amber-100">
                        <span className="text-[8px] text-slate-400 block uppercase">Multa ({selectedContract.latePenaltyPercentage ?? 10}%)</span>
                        <span className="font-bold text-amber-700 block mt-0.5">+{formatBRL(totalMultasSum)}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-amber-100">
                        <span className="text-[8px] text-slate-400 block uppercase">Juros Pró-Rata</span>
                        <span className="font-bold text-amber-700 block mt-0.5">+{formatBRL(totalJurosSum)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Installments Table */}
                <div className="space-y-3 text-left">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    Listagem de Parcelas e Histórico de Recebimentos
                  </h4>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-mono tracking-wider font-bold">
                            <th className="p-3 text-[10px]">Identificação</th>
                            <th className="p-3 text-[10px]">Vencimento</th>
                            <th className="p-3 text-[10px] text-right">Valor Parcela</th>
                            <th className="p-3 text-[10px] text-right">Encargos</th>
                            <th className="p-3 text-[10px] text-right">Total Devido</th>
                            <th className="p-3 text-[10px] text-center">Status / Data Recebido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {/* Entrada Down Payment display row */}
                          <tr className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-700">Entrada (Adiantamento)</td>
                            <td className="p-3 text-slate-400">-</td>
                            <td className="p-3 text-right text-slate-500">{formatBRL(selectedContract.entryValue)}</td>
                            <td className="p-3 text-right text-slate-400">R$ 0,00</td>
                            <td className="p-3 text-right font-bold text-slate-700">{formatBRL(selectedContract.entryValue)}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-md font-sans text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                QUitado no fechamento
                              </span>
                            </td>
                          </tr>

                          {/* All detailed monthly installments */}
                          {sortedInsts.map((inst) => {
                            const overdueItem = computedOverdueList.find(x => x.id === inst.id);
                            const displaysFine = overdueItem ? (overdueItem.multa + overdueItem.juros) : 0;
                            const displaysTotal = overdueItem ? overdueItem.totalDue : inst.value;

                            return (
                              <tr key={inst.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-600">Parcela {inst.installmentNumber}/{selectedContract.installmentsCount}</td>
                                <td className="p-3 font-medium text-slate-600">{formatDate(inst.dueDate)}</td>
                                <td className="p-3 text-right text-slate-500">{formatBRL(inst.value)}</td>
                                <td className="p-3 text-right text-rose-500 font-medium">
                                  {displaysFine > 0 ? `+${formatBRL(displaysFine)}` : 'R$ 0,00'}
                                </td>
                                <td className="p-3 text-right font-bold text-slate-800">{formatBRL(displaysTotal)}</td>
                                <td className="p-3 text-center">
                                  {inst.status === 'paid' ? (
                                    <div className="flex flex-col items-center">
                                      <span className="px-2 py-0.5 rounded-md font-sans text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        PAGO
                                      </span>
                                      {inst.paymentDate && (
                                        <span className="text-[9px] text-slate-400 mt-0.5 block font-mono leading-none">
                                          Recebido: {formatDate(inst.paymentDate)}
                                        </span>
                                      )}
                                    </div>
                                  ) : inst.status === 'overdue' ? (
                                    <div className="flex flex-col items-center">
                                      <span className="px-2 py-0.5 rounded-md font-sans text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                        ATRASADO
                                      </span>
                                      <span className="text-[9px] text-rose-500 font-sans font-medium mt-0.5 block font-mono leading-none">
                                        {overdueItem ? `${overdueItem.delayDays} dias` : ''}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md font-sans text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
                                      A VENCER
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer with report dispatch tools */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedContract(null)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition-all text-center"
                >
                  Fechar Extrato
                </button>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyReportToClipboard}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-750 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-all relative"
                  >
                    {copiedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                        <span className="text-emerald-700">Extrato Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400 font-bold" />
                        <span>Copiar Relatório</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAndOpenReportAndWhatsApp}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-50" />
                    <span>WhatsApp Relatório</span>
                    <ExternalLink className="w-3 h-3 text-emerald-100 font-bold" />
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
