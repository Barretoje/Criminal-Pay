/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Plus, Search, Phone, Mail, FileText, UserCheck, Eye, Trash2, X, ClipboardList } from 'lucide-react';
import { Client, Contract } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ClientsTabProps {
  clients: Client[];
  contracts: Contract[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
}

export default function ClientsTab({ clients, contracts, addClient }: ClientsTabProps) {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addClient({
      name,
      phone,
      cpf,
      email,
      notes
    });

    // Reset
    setName('');
    setPhone('');
    setCpf('');
    setEmail('');
    setNotes('');
    setIsAdding(false);
  };

  const getClientContracts = (clientId: string) => {
    return contracts.filter(c => c.clientId === clientId);
  };

  return (
    <div className="space-y-6" id="clients-tab-container">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between" id="clients-header">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
          />
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 border border-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm shrink-0"
          id="btn-new-client"
        >
          <Plus className="w-4 h-4 text-amber-500" />
          Novo Cliente
        </button>
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="clients-cards-grid">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client) => {
            const clientContracts = getClientContracts(client.id);
            return (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:border-amber-500/10 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-bold group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      {client.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">{client.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">CPF: {client.cpf || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 mb-6 border-b border-dashed border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{client.email || 'Email não cadastrado'}</span>
                    </div>
                    {client.notes && (
                      <div className="flex items-start gap-2">
                        <ClipboardList className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <p className="line-clamp-2 italic text-slate-400">{client.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    <FileText className="w-3.5 h-3.5" />
                    {clientContracts.length} Conveio(s)
                  </span>

                  <button
                    onClick={() => setSelectedClient(client)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 p-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Detalhes
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredClients.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl" id="no-clients-status">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium">Nenhum assessor jurídico encontrado para os termos pesquisados.</p>
          </div>
        )}
      </div>

      {/* Slide-over/Modal Form for New Client */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-lg">Adicionar Cliente</h3>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 align-middle">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Roberto Santos Pereira"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Telefone (WhatsApp)</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: 11999998888"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">CPF</label>
                    <input
                      type="text"
                      required
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="Ex: 000.000.000-00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: roberto@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Observações / Detalhes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione informações adicionais do cliente, histórico familiar ou local de detenção..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl px-4 py-2 text-xs font-semibold transition-all shadow-sm"
                  >
                    Registrar Proprietário
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-over Profile Drawer/Modal */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-50">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white h-full max-w-lg w-full shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center font-bold">
                    {selectedClient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight">{selectedClient.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">Dossiê de Cliente</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Data Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informações Cadastrais</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 text-sm text-slate-700">
                    <div className="flex justify-between border-b border-slate-200/50 pb-2">
                      <span className="text-slate-400">CPF:</span>
                      <span className="font-mono">{selectedClient.cpf || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-2">
                      <span className="text-slate-400">Telefone:</span>
                      <span className="font-semibold">{selectedClient.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-2">
                      <span className="text-slate-400">E-mail:</span>
                      <span className="text-slate-600">{selectedClient.email || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cadastrado em:</span>
                      <span>{new Date(selectedClient.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {selectedClient.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Comentários e Histórico</h4>
                    <p className="text-xs p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-slate-600 italic leading-relaxed">
                      "{selectedClient.notes}"
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contratos Vinculados</h4>
                  <div className="space-y-3">
                    {getClientContracts(selectedClient.id).length === 0 ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs">Nenhum contrato ativo para este cliente.</p>
                      </div>
                    ) : (
                      getClientContracts(selectedClient.id).map(contract => {
                        const total = contract.totalValue;
                        return (
                          <div key={contract.id} className="p-4 border border-slate-100 bg-white rounded-2xl shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-amber-600 font-mono">
                                nº {contract.processNumber}
                              </span>
                              <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {contract.processType}
                              </span>
                            </div>
                            <h5 className="font-bold text-slate-800 text-xs mb-1">Defesa de: {contract.representedName}</h5>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mb-3">{contract.processDetails}</p>
                            <div className="flex justify-between text-xs font-medium border-t border-dashed border-slate-100 pt-2.5">
                              <span className="text-slate-400">Valor Acordado:</span>
                              <span className="text-slate-900 font-bold">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setSelectedClient(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 text-xs font-bold transition-all"
                >
                  Fechar Visualização
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
