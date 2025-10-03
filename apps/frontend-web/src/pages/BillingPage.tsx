import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, FileSearch, Plus } from 'lucide-react';

// Types
interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  pdfUrl: string;
}

interface Quote {
  id: string;
  number: string;
  date: string;
  validUntil: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  pdfUrl: string;
}

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2023-001',
    date: '2023-10-15',
    dueDate: '2023-11-15',
    amount: 1250.0,
    status: 'paid',
    pdfUrl: '#',
  },
  {
    id: '2',
    number: 'INV-2023-002',
    date: '2023-11-01',
    dueDate: '2023-12-01',
    amount: 980.5,
    status: 'pending',
    pdfUrl: '#',
  },
];

const mockQuotes: Quote[] = [
  {
    id: '1',
    number: 'QUO-2023-001',
    date: '2023-10-10',
    validUntil: '2023-11-10',
    amount: 1250.0,
    status: 'accepted',
    pdfUrl: '#',
  },
  {
    id: '2',
    number: 'QUO-2023-002',
    date: '2023-10-25',
    validUntil: '2023-11-25',
    amount: 980.5,
    status: 'sent',
    pdfUrl: '#',
  },
];

const BillingPage: React.FC = () => {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [quotes] = useState<Quote[]>(mockQuotes);

  const getStatusBadge = (status: string, isInvoice = true) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    if (isInvoice) {
      switch (status) {
        case 'paid':
          return `${baseClasses} bg-green-100 text-green-800`;
        case 'pending':
          return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'overdue':
          return `${baseClasses} bg-red-100 text-red-800`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-800`;
      }
    } else {
      switch (status) {
        case 'accepted':
          return `${baseClasses} bg-green-100 text-green-800`;
        case 'sent':
          return `${baseClasses} bg-blue-100 text-blue-800`;
        case 'rejected':
          return `${baseClasses} bg-red-100 text-red-800`;
        case 'expired':
          return `${baseClasses} bg-gray-100 text-gray-800`;
        case 'draft':
        default:
          return `${baseClasses} bg-yellow-100 text-yellow-800`;
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Facturation & Devis</h1>
        <p className="text-muted-foreground">Gérez vos factures et devis en toute simplicité</p>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices" className="flex items-center justify-center gap-2">
            <FileText className="h-4 w-4" />
            Factures
            <Badge variant="secondary" className="ml-2">
              {invoices.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center justify-center gap-2">
            <FileSearch className="h-4 w-4" />
            Devis
            <Badge variant="secondary" className="ml-2">
              {quotes.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Factures récentes</h3>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle facture
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        N° Facture
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Échéance
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                        Montant
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Statut
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">{invoice.number}</td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {formatDate(invoice.date)}
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="p-4 text-right align-middle font-medium">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(invoice.amount)}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge
                            variant={
                              invoice.status === 'paid'
                                ? 'default'
                                : invoice.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className={getStatusBadge(invoice.status, true)}
                          >
                            {invoice.status === 'paid'
                              ? 'Payée'
                              : invoice.status === 'pending'
                                ? 'En attente'
                                : 'En retard'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right align-middle">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Télécharger</span>
                            </a>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quotes">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Devis récents</h3>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau devis
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        N° Devis
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Valable jusqu'au
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                        Montant
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Statut
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((quote) => (
                      <tr key={quote.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">{quote.number}</td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {formatDate(quote.date)}
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {formatDate(quote.validUntil)}
                        </td>
                        <td className="p-4 text-right align-middle font-medium">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(quote.amount)}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge
                            variant={
                              quote.status === 'accepted'
                                ? 'secondary'
                                : quote.status === 'sent'
                                  ? 'default'
                                  : quote.status === 'rejected'
                                    ? 'destructive'
                                    : 'outline'
                            }
                            className={getStatusBadge(quote.status, false)}
                          >
                            {quote.status === 'accepted'
                              ? 'Accepté'
                              : quote.status === 'sent'
                                ? 'Envoyé'
                                : quote.status === 'rejected'
                                  ? 'Refusé'
                                  : quote.status === 'expired'
                                    ? 'Expiré'
                                    : 'Brouillon'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right align-middle">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={quote.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Télécharger</span>
                            </a>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Factures en attente
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">1</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <span className="sr-only">Augmentation de</span>
                      <span className="ml-1">0%</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Voir toutes les factures<span className="sr-only">Factures en attente</span>
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Factures payées</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">1</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <span className="sr-only">Augmentation de</span>
                      <span className="ml-1">100%</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Voir l'historique<span className="sr-only">Factures payées</span>
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Devis en attente</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">1</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <span className="sr-only">Depuis le mois dernier</span>
                      <span className="ml-1">0%</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Voir tous les devis<span className="sr-only">Devis en attente</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
