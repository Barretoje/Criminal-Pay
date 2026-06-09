/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Save, RotateCcw, AlertCircle, FileText, CheckCircle2, BadgeAlert, 
  UserCheck, Sparkles, MessageSquareDot 
} from 'lucide-react';
import { MessageTemplates } from '../types';
import { DEFAULT_TEMPLATES } from '../data/mockData';
import { motion } from 'motion/react';

interface SettingsTabProps {
  templates: MessageTemplates;
  updateTemplates: (templates: MessageTemplates) => void;
  lawyerName: string;
  lawyerOab: string;
  updateLawyerCredentials: (name: string, oab: string) => void;
}

export default function SettingsTab({ 
  templates, 
  updateTemplates,
  lawyerName,
  lawyerOab,
  updateLawyerCredentials
}: SettingsTabProps) {
  // Local editable state variables
  const [welcome, setWelcome] = useState(templates.welcome);
  const [dueToday, setDueToday] = useState(templates.dueToday);
  const [interestWarning, setInterestWarning] = useState(templates.interestWarning);
  const [extrajudicialNotice, setExtrajudicialNotice] = useState(templates.extrajudicialNotice);
  
  const [localLawyerName, setLocalLawyerName] = useState(lawyerName);
  const [localLawyerOab, setLocalLawyerOab] = useState(lawyerOab);
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTemplates({
      welcome,
      dueToday,
      interestWarning,
      extrajudicialNotice
    });
    updateLawyerCredentials(localLawyerName, localLawyerOab);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm("Tem certeza que deseja restaurar as mensagens de cobrança para os textos padrão?")) {
      setWelcome(DEFAULT_TEMPLATES.welcome);
      setDueToday(DEFAULT_TEMPLATES.dueToday);
      setInterestWarning(DEFAULT_TEMPLATES.interestWarning);
      setExtrajudicialNotice(DEFAULT_TEMPLATES.extrajudicialNotice);
      updateTemplates(DEFAULT_TEMPLATES);
    }
  };

  return (
    <div className="space-y-6" id="settings-tab-container">
      {/* Title description */}
      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col md:flex-row gap-3 items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 text-sm leading-tight flex items-center gap-1.5">
            <MessageSquareDot className="w-5 h-5 text-amber-500 animate-pulse" />
            Configurações de Textos de Cobrança
          </h4>
          <p className="text-xs text-slate-500">
            Customize as notificações automáticas do WhatsApp que contêm informações de pagamentos, multas contratuais e prazos extrajudiciais.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-xs text-slate-550 border border-slate-200 rounded-xl flex items-center gap-1.5 font-semibold shrink-0 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar Padrão
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-forms-grid">
        {/* Card 0: Identificação Profissional do Advogado */}
        <div className="md:col-span-2 bg-gradient-to-r from-amber-500/5 to-transparent border border-slate-200/60 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1 text-left">
            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="p-1 px-1.5 bg-amber-100 text-amber-700 rounded-md font-mono text-[9px] font-bold">OAB</span>
              Identificação do Patronato / Advogado
            </h5>
            <p className="text-[11px] text-slate-500">
              Esses dados são expostos no menu lateral e serão utilizados nas assinaturas das mensagens e relatórios oficiais.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto md:min-w-[400px] text-left">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Profissional</label>
              <input
                type="text"
                required
                value={localLawyerName}
                onChange={(e) => setLocalLawyerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold h-10"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 font-mono">Inscrição OAB</label>
              <input
                type="text"
                required
                value={localLawyerOab}
                onChange={(e) => setLocalLawyerOab(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono h-10"
              />
            </div>
          </div>
        </div>

        {/* Card 1: Boas vindas */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <UserCheck className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Novo Contrato (Boas-vindas)</h5>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Disparado logo após o signatário firmar a contratação presencial ou registrar novos processos no Criminal Pay.
            </p>
            <textarea
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
              rows={7}
              className="w-full p-4 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Card 2: Lembrete Vencimento */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Lembrete Amigável de Vencimento Hoje</h5>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Enviado amigavelmente logo pela manhã do dia de vencimento, com detalhes de PIX ou dados do boleto da parcela.
            </p>
            <textarea
              value={dueToday}
              onChange={(e) => setDueToday(e.target.value)}
              rows={7}
              className="w-full p-4 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Card 3: Multa Atraso */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <BadgeAlert className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Notificação de Atraso recente</h5>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Enviado em caso de inadimplemento simples das parcelas. Alerta sobre multa moratória e juros por atraso.
            </p>
            <textarea
              value={interestWarning}
              onChange={(e) => setInterestWarning(e.target.value)}
              rows={7}
              className="w-full p-4 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Card 4: Notificacao Extrajudicial */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Notificação Extrajudicial formal</h5>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Notificação jurídica extrajudicial forma solene em caso de atraso crônico para evitar que o patrono rescinda.
            </p>
            <textarea
              value={extrajudicialNotice}
              onChange={(e) => setExtrajudicialNotice(e.target.value)}
              rows={7}
              className="w-full p-4 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Dynamic Placeholders list */}
        <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Tabela de Marcadores Dinâmicos</h5>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">
            Utilize estes marcadores exatamente como escritos (incluindo chaves) em qualquer campo acima. O sistema substituirá instantaneamente com os dados do réu e do contrato ao preparar o link.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 font-mono text-[10px]">
            <div className="p-2 bg-white rounded-lg border border-slate-200/50">
              <span className="text-amber-600 block font-semibold">{`{nome_cliente}`}</span>
              <span className="text-slate-400">Nome do contratante</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/50">
              <span className="text-amber-600 block font-semibold">{`{nome_representado}`}</span>
              <span className="text-slate-400">Nome do assistido/réu</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/50">
              <span className="text-amber-600 block font-semibold">{`{numero_processo}`}</span>
              <span className="text-slate-400">Nº do Processo Judicial</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/50">
              <span className="text-amber-600 block font-semibold">{`{valor_entrada}`}</span>
              <span className="text-slate-400">Valor de entrada paga</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/50">
              <span className="text-amber-600 block font-semibold">{`{valor_parcela}`}</span>
              <span className="text-slate-400">Valor unitário da parcela</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/50">
              <span className="text-amber-600 block font-semibold">{`{parcelas_total}`}</span>
              <span className="text-slate-400">Quantidade contratada</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/50">
              <span className="text-amber-600 block font-semibold">{`{dia_vencimento}`}</span>
              <span className="text-slate-400">Dia de vencimento</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/50">
              <span className="text-amber-600 block font-semibold">{`{vencimento}`}</span>
              <span className="text-slate-400">Vencimento da parcela</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/50">
              <span className="text-amber-600 block font-semibold">{`{parcela_atual}`}</span>
              <span className="text-slate-400">Índice da parcela</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/50">
              <span className="text-amber-600 block font-semibold">{`{dias_atraso}`}</span>
              <span className="text-slate-400">Dias de atraso</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions row */}
        <div className="md:col-span-2 pt-4 flex items-center justify-between border-t border-slate-100">
          <div className="flex-1">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 animate-bounce" />
                Configurações gravadas com sucesso!
              </span>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all text-right"
          >
            <Save className="w-4 h-4 text-amber-500" />
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
}
