/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Scale, Users, FileText, DollarSign, Calendar, TrendingUp, Settings, 
  ShieldAlert, Sparkles, Clock, Gavel, HelpCircle, AlertTriangle, Check, X, Send, MessageSquare, ExternalLink, Edit, Home
} from 'lucide-react';
import { useCriminalPay } from './hooks/useCriminalPay';
import NotificationCenter from './components/NotificationCenter';
import ClientsTab from './components/ClientsTab';
import ContractsTab from './components/ContractsTab';
import InstallmentsTab from './components/InstallmentsTab';
import CalendarTab from './components/CalendarTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import { formatBRL, formatDate, fillMessageTemplate, generateWhatsAppLink } from './utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'inicio' | 'contratos' | 'clientes' | 'parcelas' | 'calendario' | 'relatorios' | 'configuracoes';

export default function App() {
  const {
    clients,
    contracts,
    installments,
    templates,
    notifications,
    currentDateStr,
    addClient,
    addContract,
    markInstallmentAsPaid,
    updateTemplates,
    markNotificationAsRead,
    clearAllNotifications
  } = useCriminalPay();

  const [activeTab, setActiveTab] = useState<Tab>('inicio');

  // Lawyer Credentials Editable State
  const [lawyerName, setLawyerName] = useState(() => {
    return localStorage.getItem('cp_lawyer_name') || 'Dr. Melchiades Reis';
  });
  const [lawyerOab, setLawyerOab] = useState(() => {
    return localStorage.getItem('cp_lawyer_oab') || 'OAB/SP nº 447.882';
  });
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [tempLawyerName, setTempLawyerName] = useState('');
  const [tempLawyerOab, setTempLawyerOab] = useState('');

  const handleSaveCredentials = () => {
    const trimmedName = tempLawyerName.trim();
    const trimmedOab = tempLawyerOab.trim();
    if (trimmedName && trimmedOab) {
      setLawyerName(trimmedName);
      setLawyerOab(trimmedOab);
      localStorage.setItem('cp_lawyer_name', trimmedName);
      localStorage.setItem('cp_lawyer_oab', trimmedOab);
      setIsEditingCredentials(false);
    }
  };

  const updateLawyerCredentials = (name: string, oab: string) => {
    setLawyerName(name);
    setLawyerOab(oab);
    localStorage.setItem('cp_lawyer_name', name);
    localStorage.setItem('cp_lawyer_oab', oab);
  };

  const getLawyerInitials = () => {
    const clean = lawyerName.replace(/^(Dr\.|Dra\.|Dra|Dr)\s+/i, '').trim();
    if (clean.length > 0) {
      const parts = clean.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + (parts[1][0] || '')).toUpperCase().substring(0, 2);
      }
      return clean.substring(0, 2).toUpperCase();
    }
    return 'DR';
  };

  // Daily WhatsApp Reminder States
  const [showDailyPrompt, setShowDailyPrompt] = useState(false);
  const [dispatchListOpen, setDispatchListOpen] = useState(false);
  const [dispatchedListStatus, setDispatchedListStatus] = useState<Record<string, boolean>>({});

  const todayDueInstallments = installments.filter(
    i => i.dueDate === currentDateStr && i.status === 'pending'
  );

  useEffect(() => {
    if (installments.length > 0) {
      const todayDue = installments.filter(i => i.dueDate === currentDateStr && i.status === 'pending');
      const alreadyChecked = localStorage.getItem(`cp_daily_prompt_${currentDateStr}`);
      if (todayDue.length > 0 && alreadyChecked !== 'true') {
        setShowDailyPrompt(true);
      }
    }
  }, [installments, currentDateStr]);

  const handleDismissDailyPrompt = () => {
    localStorage.setItem(`cp_daily_prompt_${currentDateStr}`, 'true');
    setShowDailyPrompt(false);
  };

  const handleAcceptDailyPrompt = () => {
    setDispatchListOpen(true);
    setShowDailyPrompt(false);
  };

  const handleMarkAsDispatched = (id: string, phone: string, text: string) => {
    setDispatchedListStatus(prev => ({ ...prev, [id]: true }));
    const link = generateWhatsAppLink(phone, text);
    window.open(link, '_blank');
  };

  const handleCompleteDispatchGroup = () => {
    localStorage.setItem(`cp_daily_prompt_${currentDateStr}`, 'true');
    setDispatchListOpen(false);
  };

  // Compute live portfolio metrics for top header
  const unpaidOverdueSum = installments
    .filter(i => i.status === 'overdue')
    .reduce((acc, i) => acc + i.value, 0);

  const activeContractsCount = contracts.length;

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <div className="space-y-8 text-left" id="inicio-dashboard">
            {/* Elegant Greeting Card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1 px-2 bg-amber-500/10 text-amber-400 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider">
                      Painel Geral de Controle
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                    Olá, {lawyerName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                    Seja bem-vindo ao painel central do **Criminal Pay**. Selecione uma das abas corporativas abaixo para gerenciar novos contratos, emitir notificações automáticas por WhatsApp, ou analisar faturamentos e calendários.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3 bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 text-base font-black">
                    {getLawyerInitials()}
                  </div>
                  <div className="text-left font-mono">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lawyerOab}</p>
                    <p className="text-xs text-slate-200 mt-0.5 font-semibold">Operações Ativas</p>
                  </div>
                </div>
              </div>

              {/* Quick Status Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 border-t border-slate-800/60 pt-6">
                <div className="flex items-center gap-3 p-3 bg-slate-950/20 border border-slate-850 rounded-2xl">
                  <div className="p-2 bg-slate-900 text-amber-500 rounded-xl border border-slate-800">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Processos Ativos</span>
                    <span className="text-sm font-extrabold text-slate-200 font-mono">{activeContractsCount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-950/20 border border-slate-850 rounded-2xl">
                  <div className="p-2 bg-slate-900 text-rose-500 rounded-xl border border-slate-800">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Inadimplência</span>
                    <span className={`text-sm font-extrabold font-mono ${unpaidOverdueSum > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{formatBRL(unpaidOverdueSum)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-950/20 border border-slate-850 rounded-2xl">
                  <div className="p-2 bg-slate-900 text-amber-500 rounded-xl border border-slate-800">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Vencem Hoje</span>
                    <span className="text-sm font-extrabold text-slate-200 font-mono">
                      {todayDueInstallments.length} {todayDueInstallments.length === 1 ? 'parcela' : 'parcelas'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grande Grid dos Módulos */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                Selecione o Módulo Operacional
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Contratos */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('contratos')}
                  className="p-6 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl text-left hover:bg-slate-900/80 transition-all flex flex-col justify-between h-52 group cursor-pointer relative overflow-hidden shadow-lg"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 transition-colors group-hover:bg-amber-500 group-hover:text-slate-950">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-slate-100 text-sm tracking-tight group-hover:text-amber-400 transition-colors">
                      Contratos de Honorários
                    </h5>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 font-normal leading-relaxed">
                      Gerencie defesas criminais, lance entradas à vista, configure multas/juros de mora e vincule processos judiciais com relatórios detalhados.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 w-full">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{contracts.length} Ativos</span>
                    <span className="text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform">Entrar →</span>
                  </div>
                </motion.button>

                {/* 2. Clientes */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('clientes')}
                  className="p-6 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl text-left hover:bg-slate-900/80 transition-all flex flex-col justify-between h-52 group cursor-pointer relative overflow-hidden shadow-lg"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 transition-colors group-hover:bg-amber-500 group-hover:text-slate-950">
                      <Users className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-slate-100 text-sm tracking-tight group-hover:text-amber-400 transition-colors">
                      Gestão de Clientes
                    </h5>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 font-normal leading-relaxed">
                      Cadastre contratantes, réus ou investigados. Mantenha contatos de telefone e CPFs organizados para envio de extratos estruturados.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 w-full">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{clients.length} Clientes</span>
                    <span className="text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform">Entrar →</span>
                  </div>
                </motion.button>

                {/* 3. Parcelas */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('parcelas')}
                  className="p-6 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl text-left hover:bg-slate-900/80 transition-all flex flex-col justify-between h-52 group cursor-pointer relative overflow-hidden shadow-lg"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 transition-colors group-hover:bg-amber-500 group-hover:text-slate-950">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-slate-100 text-sm tracking-tight group-hover:text-amber-400 transition-colors">
                      Controle de Parcelas
                    </h5>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 font-normal leading-relaxed">
                      Monitore datas de vencimento, lance as datas de recebimento e aplique cálculos automáticos de multa e juros mora proporcionais.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 w-full">
                    <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase tracking-wider">
                      {installments.filter(i => i.status === 'overdue').length} Atrasadas
                    </span>
                    <span className="text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform">Entrar →</span>
                  </div>
                </motion.button>

                {/* 4. Calendario */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('calendario')}
                  className="p-6 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl text-left hover:bg-slate-900/80 transition-all flex flex-col justify-between h-52 group cursor-pointer relative overflow-hidden shadow-lg"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 transition-colors group-hover:bg-amber-500 group-hover:text-slate-950">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-slate-100 text-sm tracking-tight group-hover:text-amber-400 transition-colors">
                      Calendário Financeiro
                    </h5>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 font-normal leading-relaxed">
                      Visualize a previsão de entradas mensais e as datas de vencimentos agregadas de forma organizada em grade de calendário.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 w-full">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Previsão Mensal</span>
                    <span className="text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform">Entrar →</span>
                  </div>
                </motion.button>

                {/* 5. Relatorios */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('relatorios')}
                  className="p-6 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl text-left hover:bg-slate-900/80 transition-all flex flex-col justify-between h-52 group cursor-pointer relative overflow-hidden shadow-lg"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 transition-colors group-hover:bg-amber-500 group-hover:text-slate-950">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-slate-100 text-sm tracking-tight group-hover:text-amber-400 transition-colors">
                      Análises & Relatórios
                    </h5>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 font-normal leading-relaxed">
                      Analise gráficos de cobrança por status, consulte o faturamento mensal total e simule deduções e parcelas líquidas.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 w-full">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Métricas & Simulações</span>
                    <span className="text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform">Entrar →</span>
                  </div>
                </motion.button>

                {/* 6. Configuracoes */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('configuracoes')}
                  className="p-6 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl text-left hover:bg-slate-900/80 transition-all flex flex-col justify-between h-52 group cursor-pointer relative overflow-hidden shadow-lg"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 transition-colors group-hover:bg-amber-500 group-hover:text-slate-950">
                      <Settings className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-slate-100 text-sm tracking-tight group-hover:text-amber-400 transition-colors">
                      Configurações & Modelos
                    </h5>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 font-normal leading-relaxed">
                      Altere as templates de texto de disparos (WhatsApp), edite as credenciais do patronato e limpe ou salve os dados do app.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 w-full">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Disparos Automatizados</span>
                    <span className="text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform">Entrar →</span>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        );
      case 'contratos':
        return (
          <ContractsTab
            clients={clients}
            contracts={contracts}
            installments={installments}
            addContract={addContract}
            currentDateStr={currentDateStr}
          />
        );
      case 'clientes':
        return (
          <ClientsTab
            clients={clients}
            contracts={contracts}
            addClient={addClient}
          />
        );
      case 'parcelas':
        return (
          <InstallmentsTab
            clients={clients}
            contracts={contracts}
            installments={installments}
            templates={templates}
            markInstallmentAsPaid={markInstallmentAsPaid}
          />
        );
      case 'calendario':
        return (
          <CalendarTab
            clients={clients}
            contracts={contracts}
            installments={installments}
            templates={templates}
            markInstallmentAsPaid={markInstallmentAsPaid}
          />
        );
      case 'relatorios':
        return (
          <ReportsTab
            clients={clients}
            contracts={contracts}
            installments={installments}
            templates={templates}
          />
        );
      case 'configuracoes':
        return (
          <SettingsTab
            templates={templates}
            updateTemplates={updateTemplates}
            lawyerName={lawyerName}
            lawyerOab={lawyerOab}
            updateLawyerCredentials={updateLawyerCredentials}
          />
        );
      default:
        return null;
    }
  };

  const menuItems = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'contratos', label: 'Contratos', icon: FileText },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'parcelas', label: 'Parcelas', icon: DollarSign },
    { id: 'calendario', label: 'Calendário', icon: Calendar },
    { id: 'relatorios', label: 'Relatórios', icon: TrendingUp },
    { id: 'configuracoes', label: 'Configurações', icon: Settings }
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200 flex flex-col lg:flex-row font-sans" id="app-root">
      {/* 1. Sidebar - Desktop view only */}
      <aside 
        className="hidden lg:flex flex-col justify-between w-64 bg-slate-950 text-slate-200 shrink-0 shadow-xl border-r border-slate-800"
        id="side-bar-navigation"
      >
        <div className="flex flex-col">
          {/* Brand header */}
          <div className="p-6 border-b border-slate-850 flex items-center gap-3 bg-slate-950">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 border border-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white leading-none">Criminal Pay</h1>
              <span className="text-[9px] text-amber-500 font-mono tracking-wider font-semibold uppercase">Faturamento Penal</span>
            </div>
          </div>

          {/* Lawyer Credentials Card */}
          {isEditingCredentials ? (
            <div className="p-4 border-b border-slate-900 bg-slate-950 flex flex-col gap-2">
              <input
                type="text"
                value={tempLawyerName}
                onChange={(e) => setTempLawyerName(e.target.value)}
                placeholder="Nome do Advogado"
                autoFocus
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 text-xs rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500 h-8"
              />
              <input
                type="text"
                value={tempLawyerOab}
                onChange={(e) => setTempLawyerOab(e.target.value)}
                placeholder="Ex: OAB/SP 447.882"
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 text-xs rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono h-8"
              />
              <div className="flex gap-1.5 justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingCredentials(false)}
                  className="px-2 py-1 text-[10px] bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  className="px-2.5 py-1 text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => {
                setTempLawyerName(lawyerName);
                setTempLawyerOab(lawyerOab);
                setIsEditingCredentials(true);
              }}
              title="Clique para editar nome e OAB"
              className="p-4 border-b border-slate-900 bg-slate-950 flex items-center gap-2.5 group cursor-pointer hover:bg-slate-900/40 transition-all text-left"
            >
              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50 w-full flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-slate-950 font-bold text-xs mr-3 shrink-0 uppercase">
                    {getLawyerInitials()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight text-slate-100 group-hover:text-amber-400 transition-colors truncate">{lawyerName}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-sans mt-0.5 truncate">{lawyerOab}</p>
                  </div>
                </div>
                <Edit className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1.5" />
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" id="nav-routes-container">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md transform scale-[1.02]'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900' : 'text-amber-500/80'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sync panel log footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/30 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-semibold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistema Online — Local</span>
          </div>
          <p className="text-[9px] text-slate-500 font-mono leading-relaxed">
            Sincronizado via LocalStorage • Criminal Pay v1.1.0
          </p>
        </div>
      </aside>

      {/* 2. Top Navigation Bar - Mobile view only */}
      <header 
        className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md border-b border-slate-800 shrink-0 select-none"
        id="mobile-top-bar"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-900">
            <Scale className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight">Criminal Pay</h1>
            <span className="text-[9px] text-amber-500 font-mono tracking-wider">Faturamento</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unpaidOverdueSum > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1 flex items-center gap-1 text-[10px] text-rose-400">
              <AlertTriangle className="w-3 h-3" />
              <span>{formatBRL(unpaidOverdueSum)} atrasado</span>
            </div>
          )}
          
          <NotificationCenter
            notifications={notifications}
            markNotificationAsRead={markNotificationAsRead}
            clearAllNotifications={clearAllNotifications}
          />
        </div>
      </header>

      {/* 3. Main content frame */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-core">
        {/* Top Header Panel - Desktop only */}
        {activeTab !== 'inicio' && (
          <header 
            className="hidden lg:flex items-center justify-between bg-slate-950/50 border-b border-slate-800 p-6 h-20 shrink-0 select-none"
            id="desktop-header-panel"
          >
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-1">
                <span className="text-slate-500 font-light">Módulo /</span> Painel Geral de Honorários
              </h2>
              <p className="text-xs text-slate-500">
                Gerencie seus processos criminais e controle pagamentos integrados.
              </p>
            </div>

            <div className="flex items-center gap-6">
              {/* Active portfolio health indicator */}
              <div className="flex gap-6 text-xs text-right pr-6 border-r border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Contratos</span>
                  <p className="font-extrabold text-slate-300 tracking-tight">{activeContractsCount} Processos</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Inadimplência</span>
                  <p className={`font-bold tracking-tight ${unpaidOverdueSum > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {formatBRL(unpaidOverdueSum)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Data de Operação</span>
                  <p className="font-semibold text-slate-300 font-mono">09/06/2026</p>
                </div>
              </div>

              {/* Notification triggers bell */}
              <NotificationCenter
                notifications={notifications}
                markNotificationAsRead={markNotificationAsRead}
                clearAllNotifications={clearAllNotifications}
              />
            </div>
          </header>
        )}

        {/* Dynamic Inner Tab container */}
        <section className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8" id="tab-viewport">
          {/* Daily WhatsApp Reminder Banner */}
          {showDailyPrompt && todayDueInstallments.length > 0 && (
            <div className="max-w-7xl mx-auto mb-6 bg-slate-900 border border-dashed border-amber-500/30 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl select-none">
              <div className="flex items-start gap-3.5 text-left">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shrink-0">
                  <MessageSquare className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>Aviso de Vencimento de Parcelas</span>
                    <span className="py-0.5 px-2 bg-amber-500 text-slate-950 font-mono text-[9px] rounded-md font-bold leading-none">Hoje</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Identificamos **{todayDueInstallments.length}** parcela(s) com vencimento para o dia de hoje ({formatDate(currentDateStr)}). Deseja disparar lembrete amigável pelo WhatsApp para os contratantes?
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleDismissDailyPrompt}
                  className="flex-1 md:flex-initial px-3.5 py-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-400 border border-slate-700 hover:border-slate-650 transition-all text-center cursor-pointer"
                >
                  Dispensar
                </button>
                <button
                  type="button"
                  onClick={handleAcceptDailyPrompt}
                  className="flex-1 md:flex-initial px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-slate-950 font-bold" />
                  <span>Disparar WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.12 }}
                className="h-full"
              >
                {renderActiveTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Daily WhatsApp Dispatch Group Overlay */}
        <AnimatePresence>
          {dispatchListOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-905 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8"
                id="whatsapp-dispatch-group-modal"
              >
                {/* Header */}
                <div className="p-6 bg-slate-950 border-b border-slate-800 text-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-bold text-base leading-tight">Envio de Lembretes Coletivos</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Parcelas a vencer hoje: {formatDate(currentDateStr)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDispatchListOpen(false)} 
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body list */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  <p className="text-xs text-slate-400 text-left leading-relaxed">
                    Dispare as mensagens amigáveis de hoje. Por medidas de segurança dos navegadores contra abertura excessiva de abas automáticas, clique no botão de cada cliente para enviar seu respectivo lembrete pelo WhatsApp.
                  </p>

                  <div className="space-y-3">
                    {todayDueInstallments.map((inst) => {
                      const client = clients.find(c => c.id === inst.clientId) || {
                        id: '',
                        name: 'Cliente não localizado',
                        phone: '',
                        cpf: ''
                      };
                      const contract = contracts.find(c => c.id === inst.contractId) || {
                        id: '',
                        processNumber: '',
                        representedName: '',
                        processDetails: '',
                        processType: 'Outro',
                        isRecurring: false,
                        totalValue: 0,
                        entryValue: 0,
                        entryPaid: false,
                        installmentsCount: 0,
                        installmentsValue: 0,
                        createdAt: '',
                        latePenaltyPercentage: 10,
                        lateInterestPercentage: 1
                      };

                      // Generate customized template
                      const draftMessage = fillMessageTemplate(
                        templates.dueToday,
                        client as any,
                        contract as any,
                        inst,
                        currentDateStr
                      );

                      const isDispatched = !!dispatchedListStatus[inst.id];

                      return (
                        <div 
                          key={inst.id} 
                          className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
                            isDispatched 
                              ? 'bg-slate-950/40 border-emerald-500/20' 
                              : 'bg-slate-950/20 border-slate-800 hover:border-slate-700/60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isDispatched ? 'bg-emerald-500 font-black' : 'bg-amber-500'}`} />
                                <h4 className="font-bold text-slate-100 text-sm">{client.name}</h4>
                              </div>
                              <p className="text-xs text-slate-400 font-mono mt-1">
                                Telefone: {client.phone} • Parcela nº {inst.installmentNumber} • Valor: {formatBRL(inst.value)}
                              </p>
                              <p className="text-[11px] text-slate-500 font-sans mt-0.5 line-clamp-1">
                                Representado: {contract.representedName} • Proc: {contract.processNumber || 'Sem número'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleMarkAsDispatched(inst.id, client.phone, draftMessage)}
                              className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isDispatched 
                                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-semibold' 
                                  : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] text-white'
                              }`}
                            >
                              <Send className="w-3 h-3 shrink-0" />
                              <span>{isDispatched ? 'Enviado ✔' : 'Disparar'}</span>
                              {!isDispatched && <ExternalLink className="w-3 h-3 text-emerald-100 font-black" />}
                            </button>
                          </div>

                          {/* Message box preview */}
                          <div className="bg-slate-950/80 border border-slate-850 p-2.5 rounded-xl text-slate-300 font-mono text-[10px] whitespace-pre-wrap leading-relaxed select-text max-h-[140px] overflow-y-auto">
                            {draftMessage}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 font-medium font-mono">
                    Enviados: {Object.values(dispatchedListStatus).filter(Boolean).length} de {todayDueInstallments.length}
                  </span>

                  <button
                    type="submit"
                    onClick={handleCompleteDispatchGroup}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-slate-950 font-black" />
                    Concluir Rotina Hoje
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Bottom Tab Bar Navigation - Mobile view only */}
      <footer 
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 py-2 px-1.5 flex justify-around items-center z-40 select-none shadow-xl"
        id="mobile-bottom-tabs"
      >
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 select-none text-center min-w-[40px] ${
                isActive ? 'text-amber-500 font-bold font-sans' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="text-[8px] tracking-tight truncate max-w-[52px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </footer>
    </div>
  );
}

