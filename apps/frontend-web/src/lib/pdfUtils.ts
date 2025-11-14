import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Mission } from '@/types/mission.types';
import type { PaymentMethod, PaymentStatus } from '@/types/order.types';
import { formatDate, getPaymentMethodLabel, getStatusColor, getStatusLabel } from './utils';

interface FinancialData {
  totalCost: number;
  transporterPayment: number;
  platformFee: number;
  taxes: number;
  additionalCosts: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
}

/**
 * Generates a PDF from the MissionInvoice component
 */
export const generateInvoicePDF = async (
  mission: Mission,
  financialData: FinancialData,
  tCommon: (key: string) => string,
  tMissions: (key: string) => string,
  tPayment: (key: string) => string
): Promise<void> => {
  try {
    // Create a completely isolated iframe for rendering to avoid CSS conflicts
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    // Wait for iframe to load
    await new Promise((resolve) => {
      iframe.onload = resolve;
      iframe.src = 'about:blank';
    });

    const iframeDoc = iframe.contentDocument!;

    // Create the invoice HTML in the isolated iframe
    const invoiceHTML = generateInvoiceHTML(mission, financialData, tCommon, tMissions, tPayment);
    iframeDoc.open();
    iframeDoc.write(invoiceHTML);
    iframeDoc.close();

    // Get the container from the iframe
    const tempContainer = iframeDoc.body.firstElementChild as HTMLElement;

    // Convert to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      logging: false, // Disable logging to avoid oklch warnings
      removeContainer: true,
      ignoreElements: (element) => {
        // Skip elements that might have unsupported CSS or contain problematic styles
        if (element.tagName === 'STYLE' || element.tagName === 'SCRIPT') {
          return true;
        }

        // Skip elements with computed styles that might contain oklch
        if (element instanceof HTMLElement) {
          const computedStyle = window.getComputedStyle(element);
          const styleText = computedStyle.cssText || '';
          if (styleText.includes('oklch') || styleText.includes('color-mix')) {
            return true;
          }
        }

        return false;
      },
      onclone: (clonedDoc) => {
        // Remove ALL external stylesheets and styles to avoid oklch issues
        const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach((style) => style.remove());

        // Function to convert oklch and other modern colors to safe hex colors
        const convertUnsupportedColors = (cssText: string): string => {
          return cssText
            .replace(/oklch\([^)]+\)/g, '#000000') // Replace oklch with black
            .replace(/color-mix\([^)]+\)/g, '#000000') // Replace color-mix with black
            .replace(/lab\([^)]+\)/g, '#000000') // Replace lab with black
            .replace(/lch\([^)]+\)/g, '#000000') // Replace lch with black
            .replace(/hwb\([^)]+\)/g, '#000000') // Replace hwb with black
            .replace(/--[^:;]+:[^;]+;/g, ''); // Remove CSS custom properties
        };

        // Remove any CSS custom properties and classes that might contain oklch
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((element) => {
          if (element instanceof HTMLElement) {
            // Clear any CSS custom properties and classes
            element.removeAttribute('class');

            // If element has inline styles, clean them
            if (element.style.cssText) {
              const cleanedStyle = convertUnsupportedColors(element.style.cssText);
              element.style.cssText = cleanedStyle;
            }

            // Remove any data attributes that might contain style info
            Array.from(element.attributes).forEach((attr) => {
              if (attr.name.startsWith('data-') || attr.name.startsWith('style')) {
                element.removeAttribute(attr.name);
              }
            });
          }
        });

        // Clean any remaining style elements that might have been added
        const remainingStyles = clonedDoc.querySelectorAll('style');
        remainingStyles.forEach((style) => {
          if (style.textContent) {
            style.textContent = convertUnsupportedColors(style.textContent);
          }
        });

        // Apply minimal, safe styles with explicit color values
        const safeStyle = clonedDoc.createElement('style');
        safeStyle.textContent = `
          * {
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
            color: #000000 !important;
          }
          body, div, p, h1, h2, h3, span, table, td, th, tr {
            font-family: Arial, sans-serif !important;
            color: #000000 !important;
            background-color: transparent !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          .bg-blue-50, [style*="background"] {
            background-color: #eff6ff !important;
          }
          .text-blue-600, [style*="color: #2563eb"] {
            color: #2563eb !important;
          }
          .text-green-600 {
            color: #059669 !important;
          }
          .text-red-600 {
            color: #dc2626 !important;
          }
        `;
        clonedDoc.head.appendChild(safeStyle);

        // Re-apply inline styles from our HTML with safe colors
        const container = clonedDoc.querySelector('div');
        if (container) {
          container.style.cssText =
            'max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff; font-family: Arial, sans-serif; color: #000000;';
        }
      },
    });

    // Remove temporary iframe
    document.body.removeChild(iframe);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(`facture-mission-${mission.id}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Generates HTML invoice that is VISUALLY IDENTICAL to the <MissionInvoice> component
 * → Matches Shadcn UI Card, Badge, Separator, typography, spacing, colors, borders, shadows
 */
const generateInvoiceHTML = (
  mission: Mission,
  financialData: FinancialData,
  tCommon: (key: string) => string,
  tMissions: (key: string) => string,
  tPayment: (key: string) => string
): string => {
  const statusColorClass = getStatusColor(mission.status);
  const paymentStatusColorClass = getStatusColor(financialData.paymentStatus);

  // Helper: Badge styling exactly like your <Badge variant="secondary" className={colorClass} />
  const badgeHTML = (text: string, colorClass: string) => `
    <span style="
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.375rem;
      border: 1px solid transparent;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1;
      ${
        colorClass.includes('green')
          ? 'background-color: #dcfce7; color: #166534;'
          : colorClass.includes('yellow')
            ? 'background-color: #fef9c3; color: #854d0e;'
            : colorClass.includes('red')
              ? 'background-color: #fee2e2; color: #991b1b;'
              : 'background-color: #f3f4f6; color: #374151;'
      }
    ">
      ${text}
    </span>
  `;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Facture #${mission.id} - TSA Logistics</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin:0; padding:0; background:#f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media print { body { background:white; } }
    .container { max-width: 1024px; margin: 0 auto; padding: 12px; background: white; }
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); }
    .card-header { background-color: #eff6ff; padding: 1.5rem 1.5rem 1rem; }
    .card-content { padding: 1.5rem; }
    .separator { height: 1px; background-color: #e5e7eb; border: none; margin: 1rem 0; }
    .text-green-600 { color: #16a34a; }
    .text-red-600 { color: #dc2626; }
    .text-blue-600 { color: #2563eb; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.5rem 0.5rem; font-weight: 500; color: #374151; }
    td { padding: 0.75rem 0.5rem; vertical-align: top; }
    .quantity-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 2rem; height: 2rem; border-radius: 9999px;
      background-color: #f3f4f6; font-size: 0.875rem; font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">

    <!-- Header (same as in component) -->
    <div style="text-align:center; margin-bottom: 2rem;">
      <div style="display:flex; align-items:center; justify-content:center; gap:0.75rem; margin-bottom:1rem;">
        <svg width="48" height="48" viewBox="0 0 20 20" fill="none" stroke="#10b981" stroke-width="2"><circle cx="10" cy="10" r="8"/><path d="M6 10 L9 13 L14 7"/></svg>
        <div>
          <h1 style="font-size:1.875rem; font-weight:800; color:#111827; margin:0;">
            ${tMissions('financial.invoice.title')}
          </h1>
          <p style="color:#6b7280; margin:0.25rem 0 0;">${tMissions('financial.invoice.subtitle')}</p>
        </div>
      </div>
    </div>

    <!-- Main Card -->
    <div class="card">

      <!-- Card Header (blue background) -->
      <div class="card-header">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h2 style="font-size:1.5rem; font-weight:700; color:#1e40af; margin:0 0 0.25rem;">
              ${tMissions('financial.invoice.invoiceTitle')}
            </h2>
            <p style="color:#2563eb; margin:0; font-weight:500;">TSA Logistics</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:0.875rem; color:#6b7280; margin:0 0 0.25rem;">
              ${tMissions('financial.invoice.missionNumber')}
            </p>
            <p style="font-size:1.25rem; font-weight:700; color:#1e40af; margin:0 0 0.5rem;">
              #${mission.id}
            </p>
            ${badgeHTML(getStatusLabel(mission.status, tCommon), statusColorClass)}
          </div>
        </div>
      </div>

      <!-- Card Content -->
      <div class="card-content">

        <!-- Company & Customer Info -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-bottom:2rem;">
          <div>
            <h3 style="font-weight:600; color:#111827; margin:0 0 0.75rem; display:flex; align-items:center; gap:0.5rem;">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4h12v12H4z"/></svg>
              TSA Logistics
            </h3>
            <div style="font-size:0.875rem; color:#6b7280; line-height:1.6;">
              <p>Yaoundé, Cameroun</p>
              <p>Email: contact@tsa-logistics.com</p>
              <p>Tél: +237 6 XX XX XX XX</p>
            </div>
          </div>

          <div>
            <h3 style="font-weight:600; color:#111827; margin:0 0 0.75rem; display:flex; align-items:center; gap:0.5rem;">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="7" r="4"/><path d="M4 18c0-4 4-4 6-4s6 0 6 4"/></svg>
              ${tMissions('financial.invoice.billedTo')}
            </h3>
            <div style="font-size:0.875rem; color:#6b7280; line-height:1.6;">
              <p style="font-weight:500;">
                ${mission.affreteur?.firstName ?? ''} ${mission.affreteur?.lastName ?? 'N/A'}
              </p>
              <p>${mission.affreteur?.email ?? 'N/A'}</p>
              <p>${mission.affreteur?.phone ?? 'N/A'}</p>
            </div>
          </div>
        </div>

        <!-- Mission Details & Route -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-bottom:1rem;">
          <div>
            <h3 style="font-weight:600; color:#111827; margin:0 0 0.75rem; display:flex; align-items:center; gap:0.5rem;">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2l4 4 8-4-4 14H6L2 6l4-4z"/></svg>
              ${tMissions('financial.invoice.missionDetails')}
            </h3>
            <div style="font-size:0.875rem; color:#6b7280; line-height:1.7;">
              ${financialData.transactionId ? `<p><span style="font-weight:500;">${tMissions('financial.invoice.transactionId')}:</span> ${financialData.transactionId}</p>` : ''}
              <p><span style="font-weight:500;">${tMissions('financial.invoice.createdDate')}:</span> ${formatDate(new Date(mission.createdAt))}</p>
              <p><span style="font-weight:500;">${tMissions('mission')}:</span> ${mission.title}</p>
              <p><span style="font-weight:500;">${tMissions('financial.invoice.paymentMethod')}:</span> ${getPaymentMethodLabel(financialData.paymentMethod, tPayment)}</p>
              <p><span style="font-weight:500;">${tMissions('financial.invoice.paymentStatus')}:</span> ${badgeHTML(getStatusLabel(financialData.paymentStatus, tCommon), paymentStatusColorClass)}</p>
            </div>
          </div>

          <div>
            <h3 style="font-weight:600; color:#111827; margin:0 0 0.75rem; display:flex; align-items:center; gap:0.5rem;">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/><path d="M10 2v8l5 5"/></svg>
              ${tMissions('financial.invoice.route')}
            </h3>
            <div style="font-size:0.875rem; color:#6b7280; line-height:1.7;">
              <div style="display:flex; gap:0.25rem; margin-bottom:0.5rem;">
                <span class="text-green-600" style="font-weight:500;">${tMissions('departure')}:</span>
                <span>${mission.adresseDepart?.label || 'N/A'}</span>
              </div>
              <div style="display:flex; gap:0.25rem; margin-bottom:0.5rem;">
                <span class="text-red-600" style="font-weight:500;">${tMissions('arrival')}:</span>
                <span>${mission.adresseArrivee?.label || 'N/A'}</span>
              </div>
              <div>
                <p style="font-weight:500; color:#2563eb; margin:0.5rem 0 0.25rem;">
                  ${tMissions('financial.invoice.merchandise')}: <span style="color:#6b7280;">${mission.typeMarchandise}</span>
                </p>
                <p style="margin:0;">${mission.poids} kg • ${mission.volume} m³</p>
              </div>
            </div>
          </div>
        </div>

        <hr class="separator" />

        <!-- Services Table -->
        <div style="margin-bottom:1rem;">
          <h3 style="font-weight:600; color:#111827; margin:0 0 0.25rem;">
            ${tMissions('financial.invoice.servicesProvided')}
          </h3>
          <table>
            <thead>
              <tr style="border-bottom:1px solid #e5e7eb;">
                <th>${tMissions('financial.invoice.service')}</th>
                <th style="text-align:center;">${tMissions('financial.invoice.quantity')}</th>
                <th style="text-align:right;">${tMissions('financial.invoice.unitPrice')}</th>
                <th style="text-align:right;">${tCommon('total')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div>
                    <p style="font-weight:500; color:#111827; margin:0 0 0.25rem;">
                      ${tMissions('financial.invoice.transportService')}
                    </p>
                    <p style="font-size:0.875rem; color:#6b7280; margin:0;">
                      ${mission.typeMarchandise} - ${mission.poids}kg - ${mission.volume}m³
                    </p>
                  </div>
                </td>
                <td style="text-align:center;">
                  <span class="quantity-badge">1</span>
                </td>
                <td style="text-align:right; font-weight:500;">
                  ${(financialData.totalCost - financialData.taxes).toLocaleString()} FCFA
                </td>
                <td style="text-align:right; font-weight:700;">
                  ${(financialData.totalCost - financialData.taxes).toLocaleString()} FCFA
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <hr class="separator" />

        <!-- Totals -->
        <div style="width:100%;">
          <div style="display:flex; justify-content:space-between; color:#6b7280; margin-bottom:0.5rem;">
            <span>${tMissions('financial.invoice.subtotal')}</span>
            <span>${(financialData.totalCost - financialData.taxes).toLocaleString()} FCFA</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:#6b7280; margin-bottom:0.5rem;">
            <span>${tMissions('financial.platformFee')} (5%)</span>
            <span>${financialData.platformFee.toLocaleString()} FCFA</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:#6b7280; margin-bottom:0.5rem;">
            <span>${tMissions('financial.vatPercent')} (18%)</span>
            <span>${financialData.taxes.toLocaleString()} FCFA</span>
          </div>
          ${
            financialData.additionalCosts > 0
              ? `
          <div style="display:flex; justify-content:space-between; color:#6b7280; margin-bottom:0.5rem;">
            <span>${tMissions('financial.additionalCosts')}</span>
            <span>${financialData.additionalCosts.toLocaleString()} FCFA</span>
          </div>`
              : ''
          }
          <hr class="separator" />
          <div style="display:flex; justify-content:space-between; font-size:1.25rem; font-weight:700; color:#111827;">
            <span>${tCommon('total')}</span>
            <span>${financialData.totalCost.toLocaleString()} FCFA</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.875rem; color:#16a34a; font-weight:500; margin-top:0.5rem;">
            <span>${tMissions('financial.invoice.paymentStatus')}</span>
            <span style="display:flex; align-items:center; gap:0.25rem;">
              <svg width="16" height="16" fill="#10b981" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              ${getStatusLabel(financialData.paymentStatus, tCommon)}
            </span>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid #e5e7eb; text-align:center; font-size:0.875rem; color:#6b7280;">
          <p style="margin:0 0 0.5rem;">${tMissions('financial.invoice.thankYou')}</p>
          <p style="margin:0;">
            ${tMissions('financial.invoice.contactSupport')}{' '}
            <a href="mailto:support@tsa-logistics.com" style="color:#2563eb; text-decoration:underline;">support@tsa-logistics.com</a>
          </p>
        </div>

      </div>
    </div>

  </div>
</body>
</html>
  `.trim();
};
