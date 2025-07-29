'use client';

import React from 'react';
import { Invoice } from '@/lib/types/financial-types';
import { Client } from '@/lib/client-service';
import { Workspace } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';

interface PrintableInvoiceProps {
  invoice: Invoice;
  client?: Client | null;
  workspace?: Workspace | null;
}

export function PrintableInvoice({ invoice, client, workspace }: PrintableInvoiceProps) {
  const { getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol();

  return (
    <div className="print-invoice invoice-content bg-white text-black min-h-screen p-8">
      <style jsx>{`
        @media print {
          .print-invoice {
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            box-shadow: none;
            border: none;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          body {
            margin: 0;
            padding: 0;
          }
          * {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            color: black !important;
          }
          
          /* Ensure proper page breaks */
          .invoice-header,
          .invoice-details,
          .invoice-items {
            page-break-inside: avoid;
          }
          
          /* Ensure borders are visible in print */
          .border {
            border-color: #000 !important;
          }
        }
        
        @media screen {
          .print-invoice {
            max-width: 210mm;
            margin: 0 auto;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          {workspace && (
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {workspace.name}
              </h1>
              {workspace.description && (
                <p className="text-gray-600 text-sm">{workspace.description}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
          <div className="text-sm text-gray-600">
            <p className="font-semibold">{invoice.invoiceNumber}</p>
            <p>Issue Date: {formatDate(invoice.issueDate)}</p>
            <p>Due Date: {formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            Bill To:
          </h3>
          {client ? (
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-semibold text-base">{client.name}</p>
              {client.company && <p>{client.company}</p>}
              {client.email && <p>{client.email}</p>}
              {client.phone && <p>{client.phone}</p>}
              {client.address && (
                <div className="mt-2">
                  <p>{client.address}</p>
                </div>
              )}
              {client.taxId && (
                <p className="mt-2">
                  <span className="font-medium">Tax ID:</span> {client.taxId}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Client information not available</p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            Invoice Details:
          </h3>
          <div className="text-sm text-gray-700 space-y-1">
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {invoice.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Type:</span>
              <span>{invoice.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Currency:</span>
              <span>{invoice.currency}</span>
            </div>
            {invoice.paidDate && (
              <div className="flex justify-between">
                <span className="font-medium">Paid Date:</span>
                <span>{formatDate(invoice.paidDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-1">
          Items:
        </h3>
        
        <div className="overflow-hidden border border-gray-300 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {invoice.items.map((item, index) => (
                <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center border-b border-gray-200">
                    {formatNumber(item.quantity)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right border-b border-gray-200">
                    {currencySymbol}{formatNumber(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right border-b border-gray-200 font-medium">
                    {currencySymbol}{formatNumber(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-full max-w-sm">
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{currencySymbol}{formatNumber(invoice.subtotal)}</span>
              </div>
              
              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
                  <span className="font-medium">{currencySymbol}{formatNumber(invoice.taxAmount)}</span>
                </div>
              )}
              
              {invoice.discount && invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium">-{currencySymbol}{formatNumber(invoice.discount)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{currencySymbol}{formatNumber(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {invoice.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                Notes:
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
          
          {invoice.terms && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                Terms & Conditions:
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-300 pt-6 mt-8">
        <div className="text-center text-xs text-gray-500">
          <p>Thank you for your business!</p>
          <p className="mt-1">Generated on {formatDate(new Date())}</p>
        </div>
      </div>

      {/* Print Button - Only visible on screen */}
      <div className="no-print fixed bottom-6 right-6">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
      </div>
    </div>
  );
}