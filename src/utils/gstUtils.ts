import { LineItem } from "../types";

// Standard Indian HSN / SAC Code Catalog with Default GST Rates
export interface HsnItem {
  code: string;
  description: string;
  defaultTaxRate: number; // 0, 5, 12, 18, 28
  category: string;
}

export const COMMON_HSN_CATALOG: HsnItem[] = [
  { code: "8471", description: "Automatic Data Processing Machines & Laptops", defaultTaxRate: 18, category: "Electronics" },
  { code: "8517", description: "Smartphones, Telephone Sets & Networking Gear", defaultTaxRate: 18, category: "Electronics" },
  { code: "8528", description: "Monitors, LED Displays & Television Sets", defaultTaxRate: 18, category: "Electronics" },
  { code: "8443", description: "Printers, Photocopiers & Cartridges", defaultTaxRate: 18, category: "Office Equipment" },
  { code: "9403", description: "Wooden / Metal Office Furniture & Desks", defaultTaxRate: 18, category: "Furniture" },
  { code: "6109", description: "T-Shirts, Singlets & Knitted Apparel", defaultTaxRate: 12, category: "Textiles & Garments" },
  { code: "6203", description: "Men's Suits, Trousers & Shirts", defaultTaxRate: 12, category: "Textiles & Garments" },
  { code: "3926", description: "Plastic Containers, Polybags & Storage Items", defaultTaxRate: 18, category: "Plastics" },
  { code: "7308", description: "Structures & Fabricated Metal Components", defaultTaxRate: 18, category: "Hardware" },
  { code: "2710", description: "Petroleum Oils & Industrial Lubricants", defaultTaxRate: 18, category: "Chemicals & Fuel" },
  { code: "9983", description: "IT Software Development & Tech Support Services", defaultTaxRate: 18, category: "Services (SAC)" },
  { code: "9982", description: "Accounting, Auditing & Bookkeeping Services", defaultTaxRate: 18, category: "Services (SAC)" },
  { code: "9954", description: "Building Construction & Civil Contracting", defaultTaxRate: 18, category: "Services (SAC)" },
  { code: "0402", description: "Packaged Dairy Products & Milk Powder", defaultTaxRate: 5, category: "Food & Dairy" },
  { code: "1905", description: "Biscuits, Wafers & Bakery Products", defaultTaxRate: 18, category: "FMCG Food" },
  { code: "3004", description: "Medicaments & Pharmaceutical Formulations", defaultTaxRate: 12, category: "Pharma" },
];

// Canonical Indian GST Rates
export const GST_RATES = [
  { value: 0, label: "0% (Exempt / Nil Rated)" },
  { value: 0.25, label: "0.25%" },
  { value: 1.5, label: "1.5%" },
  { value: 3, label: "3%" },
  { value: 5, label: "5%" },
  { value: 6, label: "6%" },
  { value: 7.5, label: "7.5%" },
  { value: 12, label: "12%" },
  { value: 18, label: "18%" },
  { value: 28, label: "28%" },
];

export const PRESET_CHARGE_NAMES = [
  "Delivery Charges",
  "Transport Charges",
  "Loading Charges",
  "Unloading Charges",
  "Packing Charges",
  "Freight Charges",
  "Other Charges",
];

/**
  * Calculate taxes for an additional charge (Delivery, Freight, Packing, etc.)
  */
export function calculateAdditionalChargeTaxes(
  amount: number,
  isTaxable: boolean,
  taxRate: number,
  isInterState: boolean
): {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
} {
  const amt = Number(amount) || 0;
  if (!isTaxable || amt <= 0) {
    return {
      taxableAmount: amt,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
      totalAmount: amt,
    };
  }

  const rate = Number(taxRate) || 0;
  const totalTax = (amt * rate) / 100;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = totalTax;
  } else {
    cgst = totalTax / 2;
    sgst = totalTax / 2;
  }

  return {
    taxableAmount: amt,
    cgstAmount: Number(cgst.toFixed(2)),
    sgstAmount: Number(sgst.toFixed(2)),
    igstAmount: Number(igst.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    totalAmount: Number((amt + totalTax).toFixed(2)),
  };
}

/**
 * Format currency in Indian Rupees style (₹ 1,23,456.00)
 */
export function formatCurrency(amount: number): string {
  const rounded = Number(amount || 0).toFixed(2);
  const parts = rounded.split(".");
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return `₹${formattedInt}.${parts[1]}`;
}

/**
 * Calculate taxes for a line item with Tax Exclusive or Tax Inclusive support
 */
export function calculateLineItemTaxes(
  quantity: number,
  unitPrice: number,
  discountPercent: number,
  taxRate: number,
  isInterState: boolean,
  isTaxInclusive: boolean = false
): {
  subtotalBeforeTax: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
} {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const discPct = Number(discountPercent) || 0;
  const rate = Number(taxRate) || 0;

  const gross = qty * price;
  const discountVal = (gross * discPct) / 100;
  const netAmount = gross - discountVal;

  let taxableValue = 0;
  let totalTax = 0;
  let totalAmount = 0;

  if (isTaxInclusive && rate > 0) {
    taxableValue = netAmount / (1 + rate / 100);
    totalTax = netAmount - taxableValue;
    totalAmount = netAmount;
  } else {
    taxableValue = netAmount;
    totalTax = (taxableValue * rate) / 100;
    totalAmount = taxableValue + totalTax;
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = totalTax;
  } else {
    cgst = totalTax / 2;
    sgst = totalTax / 2;
  }

  return {
    subtotalBeforeTax: Number(taxableValue.toFixed(2)),
    cgstAmount: Number(cgst.toFixed(2)),
    sgstAmount: Number(sgst.toFixed(2)),
    igstAmount: Number(igst.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

/**
 * Build WhatsApp Payment Reminder URL
 */
export function buildWhatsAppReminderLink(
  partyPhone: string,
  partyName: string,
  amountDue: number,
  companyName: string,
  upiId?: string
): string {
  const cleanPhone = partyPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const msg = `Dear ${partyName},\n\nThis is a polite payment reminder from *${companyName}*.\nYour outstanding balance is *${formatCurrency(amountDue)}*.\n\n${upiId ? `You can pay via UPI to ID: *${upiId}*\n\n` : ''}Kindly arrange the payment at your earliest convenience.\n\nThank you for your business!`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
}

/**
 * Convert number to words in Indian Numbering System
 */
export function numberToIndianWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty ", "Thirty ", "Forty ", "Fifty ", "Sixty ", "Seventy ", "Eighty ", "Ninety "];

  function inWords(n: number): string {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  }

  const rounded = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - rounded) * 100);

  let result = "";
  const crore = Math.floor(rounded / 10000000);
  let remainder = rounded % 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  if (crore > 0) result += inWords(crore) + "Crore ";
  if (lakh > 0) result += inWords(lakh) + "Lakh ";
  if (thousand > 0) result += inWords(thousand) + "Thousand ";
  if (remainder > 0) result += inWords(remainder);

  result = result.trim() + " Rupees";
  if (paise > 0) {
    result += " and " + inWords(paise).trim() + " Paise";
  }
  return result + " Only";
}
