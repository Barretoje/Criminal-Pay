/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Client, Contract, Installment, MessageTemplates, AppNotification } from '../types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_CONTRACTS, 
  INITIAL_INSTALLMENTS, 
  DEFAULT_TEMPLATES, 
  INITIAL_NOTIFICATIONS 
} from '../data/mockData';

export function useCriminalPay() {
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [templates, setTemplates] = useState<MessageTemplates>(DEFAULT_TEMPLATES);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentDateStr] = useState<string>('2026-06-09'); // Consistent demo benchmark matching the metadata environment

  // Load initial states from LocalStorage or seed with Mock Data
  useEffect(() => {
    const cachedClients = localStorage.getItem('cp_clients');
    const cachedContracts = localStorage.getItem('cp_contracts');
    const cachedInstallments = localStorage.getItem('cp_installments');
    const cachedTemplates = localStorage.getItem('cp_templates');
    const cachedNotifications = localStorage.getItem('cp_notifications');

    if (cachedClients) setClients(JSON.parse(cachedClients));
    else {
      setClients(INITIAL_CLIENTS);
      localStorage.setItem('cp_clients', JSON.stringify(INITIAL_CLIENTS));
    }

    if (cachedContracts) setContracts(JSON.parse(cachedContracts));
    else {
      setContracts(INITIAL_CONTRACTS);
      localStorage.setItem('cp_contracts', JSON.stringify(INITIAL_CONTRACTS));
    }

    if (cachedInstallments) setInstallments(JSON.parse(cachedInstallments));
    else {
      setInstallments(INITIAL_INSTALLMENTS);
      localStorage.setItem('cp_installments', JSON.stringify(INITIAL_INSTALLMENTS));
    }

    if (cachedTemplates) setTemplates(JSON.parse(cachedTemplates));
    else {
      setTemplates(DEFAULT_TEMPLATES);
      localStorage.setItem('cp_templates', JSON.stringify(DEFAULT_TEMPLATES));
    }

    if (cachedNotifications) setNotifications(JSON.parse(cachedNotifications));
    else {
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.setItem('cp_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }, []);

  // Sync state helpers to LocalStorage
  const saveClients = (data: Client[]) => {
    setClients(data);
    localStorage.setItem('cp_clients', JSON.stringify(data));
  };

  const saveContracts = (data: Contract[]) => {
    setContracts(data);
    localStorage.setItem('cp_contracts', JSON.stringify(data));
  };

  const saveInstallments = (data: Installment[]) => {
    setInstallments(data);
    localStorage.setItem('cp_installments', JSON.stringify(data));
  };

  const saveTemplates = (data: MessageTemplates) => {
    setTemplates(data);
    localStorage.setItem('cp_templates', JSON.stringify(data));
  };

  const saveNotifications = (data: AppNotification[]) => {
    setNotifications(data);
    localStorage.setItem('cp_notifications', JSON.stringify(data));
  };

  // Add a Client
  const addClient = (newClient: Omit<Client, 'id' | 'createdAt'>) => {
    const client: Client = {
      ...newClient,
      id: `client_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    saveClients([client, ...clients]);

    // Send a system notification
    const notification: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'system',
      title: 'Cliente Cadastrado',
      message: `${client.name} foi adicionado à lista de clientes.`,
      date: new Date().toISOString(),
      read: false,
      meta: { clientId: client.id }
    };
    saveNotifications([notification, ...notifications]);
    return client;
  };

  // Add a Contract & auto-generate its installments
  const addContract = (
    newContract: Omit<Contract, 'id' | 'createdAt'>,
    firstPaymentDate: string // YYYY-MM-DD
  ) => {
    const contractId = `con_${Date.now()}`;
    const contract: Contract = {
      ...newContract,
      id: contractId,
      createdAt: new Date().toISOString()
    };
    
    saveContracts([contract, ...contracts]);

    // Generate installments
    const generatedInstallments: Installment[] = [];
    const clientSelected = clients.find(c => c.id === contract.clientId);

    // Amortization generation:
    // Standard installment processing starting from firstPaymentDate
    const intervalMonths = 1;
    const baseDate = new Date(firstPaymentDate + 'T12:00:00'); // set mid-day to avoid TZ slip

    for (let i = 1; i <= contract.installmentsCount; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(baseDate.getMonth() + (i - i) + (i - 1) * intervalMonths);
      
      // format to string: YYYY-MM-DD
      const yyyy = dueDate.getFullYear();
      const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dueDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      // Decide status: if dueDate is earlier than currentDateStr, mark as overdue, otherwise pending
      let status: 'pending' | 'overdue' | 'paid' = 'pending';
      if (formattedDate < currentDateStr) {
        status = 'overdue';
      }

      generatedInstallments.push({
        id: `inst_${contractId}_${i}`,
        contractId,
        clientId: contract.clientId,
        installmentNumber: i,
        dueDate: formattedDate,
        value: contract.installmentsValue,
        status
      });
    }

    saveInstallments([...installments, ...generatedInstallments]);

    // Send a system and welcome notification
    let welcomeNotif: AppNotification = {
      id: `notif_welcome_${Date.now()}`,
      type: 'new_contract',
      title: 'Novo Contrato & WhatsApp de Boas-vindas',
      message: `Contrato criado para ${clientSelected?.name || 'Cliente'}. Pronto para enviar boas-vindas pelo WhatsApp!`,
      date: new Date().toISOString(),
      read: false,
      meta: { contractId, clientId: contract.clientId }
    };

    saveNotifications([welcomeNotif, ...notifications]);

    // Check if any auto-generated installment matches today
    const hasTodayInstallment = generatedInstallments.some(inst => inst.dueDate === currentDateStr);
    if (hasTodayInstallment) {
      const todayNotif: AppNotification = {
        id: `notif_today_${Date.now()}`,
        type: 'due_today',
        title: 'Parcela Vencendo Hoje',
        message: `Uma parcela do novo contrato de ${clientSelected?.name || 'Cliente'} vence hoje.`,
        date: new Date().toISOString(),
        read: false,
        meta: { contractId, clientId: contract.clientId }
      };
      saveNotifications([todayNotif, welcomeNotif, ...notifications]);
    }

    return contract;
  };

  // Mark Installment as Paid (Quitar parcela)
  const markInstallmentAsPaid = (installmentId: string) => {
    let targetClientName = 'Cliente';
    let targetInstallmentValue = 0;
    let targetNumber = 1;

    const updated = installments.map(inst => {
      if (inst.id === installmentId) {
        targetInstallmentValue = inst.value;
        targetNumber = inst.installmentNumber;
        const targetClient = clients.find(c => c.id === inst.clientId);
        if (targetClient) {
          targetClientName = targetClient.name;
        }

        return {
          ...inst,
          status: 'paid' as const,
          paymentDate: currentDateStr
        };
      }
      return inst;
    });

    saveInstallments(updated);

    // Filter out resolved notifications of this installment
    const updatedNotifications = notifications.filter(notif => notif.meta?.installmentId !== installmentId);
    
    // Add positive system log receipt
    const transactionNotification: AppNotification = {
      id: `notif_pay_${Date.now()}`,
      type: 'system',
      title: 'Pagamento Confirmado',
      message: `Baixa realizada: Parcela ${targetNumber} de R$ ${targetInstallmentValue} de ${targetClientName} foi recebida com sucesso.`,
      date: new Date().toISOString(),
      read: false,
      meta: { installmentId }
    };

    saveNotifications([transactionNotification, ...updatedNotifications]);
  };

  const updateTemplates = (newTemplates: MessageTemplates) => {
    saveTemplates(newTemplates);
  };

  const markNotificationAsRead = (notifId: string) => {
    const updated = notifications.map(notif => 
      notif.id === notifId ? { ...notif, read: true } : notif
    );
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    const updated = notifications.map(notif => ({ ...notif, read: true }));
    saveNotifications(updated);
  };

  return {
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
  };
}
