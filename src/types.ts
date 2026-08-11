export type DocumentType = 
  | 'invoice' 
  | 'quotation' 
  | 'proforma' 
  | 'challan' 
  | 'credit_note' 
  | 'debit_note';

export type InvoiceStatus = 'paid' | 'unpaid' | 'partially_paid' | 'overdue' | 'cancelled';

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Cheque';

export type PartyType = 'customer' | 'vendor';

export interface User {
  id: string; // Unique User Identifier (Firebase Auth UID)
  email: string;
  displayName: string;
  currentBusinessId: string; // Foreign key referencing active Business
  businessIds: string[]; // List of Business IDs accessible by user
  role: 'owner' | 'admin' | 'staff';
  createdAt: string;
}

export interface LineItem {
  id: string;
  productId?: string;
  itemDescription: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  taxRate: number; // e.g. 18 for 18%
  isTaxInclusive?: boolean;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface AdditionalCharge {
  id: string;
  name: string; // e.g. Delivery Charges, Transport Charges, Loading Charges, Unloading Charges, Packing Charges, Freight Charges, Other Charges
  amount: number;
  isTaxable: boolean;
  taxRate: number; // e.g. 18 for 18%
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  businessId?: string; // Foreign key linking Invoice to Business
  createdByUserId?: string; // Foreign key linking Invoice to Creator User
  invoiceNumber: string;
  docType: DocumentType;
  partyId: string;
  partyName: string;
  partyGstin?: string;
  partyPhone?: string;
  partyAddress?: string;
  partyState?: string;
  date: string;
  dueDate: string;
  items: LineItem[];
  additionalCharges?: AdditionalCharge[];
  roundOff?: number;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  isInterState: boolean;
  isTaxInclusive?: boolean;
  paymentMode: PaymentMode;
  notes?: string;
  terms?: string;
  status: InvoiceStatus;
  createdAt: string;

  // Credit Note (CN) fields
  referenceInvoiceNumber?: string;
  referenceInvoiceId?: string;
  originalInvoiceDate?: string;
  cnType?: 'goods_return' | 'price_adjustment';
  reason?: string;

  // Recurring invoice link
  recurringProfileId?: string;
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface RecurringInvoice {
  id: string;
  businessId?: string;
  createdByUserId?: string;
  profileName: string; // e.g. "Monthly Retainer - Apex Corp"
  docType: DocumentType;
  partyId: string;
  partyName: string;
  partyGstin?: string;
  partyPhone?: string;
  partyAddress?: string;
  partyState?: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD or null
  nextRunDate: string; // YYYY-MM-DD
  lastRunDate?: string | null;
  autoGenerate: boolean; // true = auto create invoice on trigger/due, false = manual confirmation required
  status: RecurringStatus;
  items: LineItem[];
  additionalCharges?: AdditionalCharge[];
  paymentMode: PaymentMode;
  isTaxInclusive?: boolean;
  notes?: string;
  terms?: string;
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  generatedCount: number;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId?: string; // Foreign key linking Product to Business
  createdByUserId?: string; // Foreign key linking Product to Creator User
  name: string;
  sku: string;
  hsnSac: string;
  category: string;
  unit: string; // PCS, BAG, MTR, KG, GM, LTR, ML, BOX, PKT, ROLL, NOS, SET, DOZEN, FT, INCH, etc.
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number; // e.g. 5, 12, 18, 28
  stockQuantity: number;
  reorderLevel: number;
  description?: string;
  batchNo?: string;
  warehouse?: string;
  supplier?: string;
  remarks?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  date: string;
  type: 'purchase' | 'sale' | 'adjustment_in' | 'adjustment_out' | 'initial' | 'bill_scan';
  qtyChange: number; // e.g. +250 or -50
  previousStock: number;
  newStock: number;
  unit: string;
  referenceNo?: string; // e.g. "Bill #1245"
  partyName?: string;
  remarks?: string;
  billPhotoUrl?: string;
  purchaseRate?: number;
}

export interface UnitConversion {
  id: string;
  fromUnit: string; // e.g. "BAG"
  toUnit: string;   // e.g. "PCS"
  multiplier: number; // e.g. 50 (1 BAG = 50 PCS)
}

export interface BillScanItem {
  id: string;
  productName: string;
  matchedProductId?: string;
  isNewProduct?: boolean;
  sku: string;
  hsnCode: string;
  category: string;
  quantity: number;
  unit: string; // PCS, BAG, MTR, KG, GM, LTR, ML, BOX, PKT, ROLL, NOS, SET, DOZEN, FT, INCH
  purchaseRate: number;
  sellingPrice: number;
  discountPercent: number;
  gstPercent: number; // 0, 5, 12, 18, 28
  taxAmount: number;
  totalAmount: number;
  batchNo?: string;
  warehouse?: string;
  remarks?: string;
  confidence: number; // 0 to 100
  confidenceLevel: 'high' | 'review' | 'low';
}

export interface BillScanResult {
  supplierName: string;
  supplierGstin?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: BillScanItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  overallConfidence: number;
  billPhotoUrl?: string; // base64 / blob URL
}

export interface Party {
  id: string;
  businessId?: string; // Foreign key linking Party to Business
  createdByUserId?: string; // Foreign key linking Party to Creator User
  type: PartyType;
  name: string;
  phone: string;
  email?: string;
  gstin?: string;
  address: string;
  state: string;
  openingBalance: number;
  balanceType: 'collect' | 'pay'; // collect = receivable, pay = payable
  creditLimit?: number;
  totalBilled?: number;
  notes?: string;
}

export interface CashEntry {
  id: string;
  businessId?: string;
  userId?: string;
  date: string;
  type: 'in' | 'out';
  amount: number;
  category: string;
  partyName?: string;
  paymentMode: PaymentMode;
  referenceNo?: string;
  description: string;
  receiptUrl?: string;
}

export interface PdfSettings {
  pdfThemeColor: string; // e.g. '#0f172a', '#2563eb', '#059669', '#d97706', '#dc2626'
  headerStyle: 'modern' | 'classic' | 'compact';
  showLogo: boolean;
  showGstin: boolean;
  showBankDetails: boolean;
  showUpiQr: boolean;
  showTerms: boolean;
  showSignature: boolean;
  showShipTo: boolean;
  showHsn: boolean;
  footerText?: string;
  defaultNotes?: string;
}

export interface BusinessProfile {
  id: string; // Unique Business Identifier (businessId)
  ownerUserId: string; // Foreign key referencing User.id
  name: string;
  tagline: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId: string;
  termsAndConditions: string;
  logoUrl?: string;
  signatureUrl?: string;
  invoicePrefix: string;
  themeColor: string;
  pdfSettings?: PdfSettings;
}

export interface RecipeItem {
  id: string;
  materialName: string;
  sku: string;
  requiredQty: number;
  unit: string;
  unitRate: number;
  cost: number;
  wastagePercent: number;
}

export interface RecipeBOM {
  id: string;
  productName: string;
  sku: string;
  batchSize: number;
  unit: string;
  version: string;
  items: RecipeItem[];
  rawMaterialCost: number;
  packagingCost: number;
  labourCost: number;
  otherCost: number;
  wastageCost: number;
  totalProductionCost: number;
  costPerUnit: number;
  suggestedSellingPrice: number;
  marginPercent: number;
  notes?: string;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  recipeName: string;
  recipeVersion: string;
  productionDate: string;
  expiryDate?: string;
  producedQuantity: number;
  unit: string;
  operatorName: string;
  rawMaterialCost: number;
  otherExpenses: number;
  totalCost: number;
  costPerUnit: number;
  status: 'planned' | 'in_progress' | 'completed';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  user: string;
  details: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface Purchase {
  id: string;
  businessId?: string;
  createdByUserId?: string;
  purchaseNumber: string;
  partyId: string;
  supplierName: string;
  supplierGstin?: string;
  supplierPhone?: string;
  date: string;
  items: LineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentMode: PaymentMode;
  notes?: string;
  billPhotoUrl?: string;
  ocrData?: any;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId?: string;
  createdByUserId?: string;
  date: string;
  category: string; // Rent, Salary, Transport, Electricity, Internet, Maintenance, Marketing, Food, Office, Other
  amount: number;
  paymentMode: PaymentMode;
  paidTo?: string;
  referenceNo?: string;
  notes: string;
  receiptUrl?: string;
}

export type Language = 'en' | 'hi' | 'gu' | 'mr';

export interface AppLockSettings {
  enabled: boolean;
  pin: string;
  isLocked: boolean;
}

export interface AdSettings {
  showAds: boolean;
  isPremium: boolean;
}

export interface BackupInfo {
  autoBackupEnabled: boolean;
  frequency: 'daily' | 'weekly' | 'manual';
  lastBackupDate: string | null;
  lastBackupSize: string | null;
  lastDailyBackupDate?: string | null;
  lastScheduledDownloadPromptDate?: string | null;
}

export interface CloudBackupPoint {
  id: string;
  businessId?: string;
  userId?: string;
  timestamp: string; // ISO string
  formattedDate: string; // e.g. "09 Aug 2026, 11:05 AM"
  type: 'auto_daily' | 'manual_cloud' | 'manual_export';
  label: string;
  sizeKb: string;
  invoicesCount: number;
  productsCount: number;
  partiesCount: number;
  totalRevenue: number;
  snapshotData: string; // JSON string of full state
  status: 'synced' | 'local_cached';
}

export type InvoiceTemplate = 'modern' | 'classic' | 'compact';

export type AdLocation = 
  | 'dashboard_banner'
  | 'invoice_screen'
  | 'quotation_screen'
  | 'challan_screen'
  | 'purchase_screen'
  | 'product_screen'
  | 'reports_screen'
  | 'login_welcome_screen'
  | 'dashboard_between_cards'
  | 'bottom_banner';

export type AdCategory = 
  | 'Offers & Discounts'
  | 'B2B Supplies & Raw Materials'
  | 'Machinery & Equipment'
  | 'Software & Services'
  | 'Logistics & Transport'
  | 'Financial & Banking'
  | 'Events & Trade Fairs'
  | 'General Business';

export interface Advertisement {
  id: string;
  title: string;
  companyName: string;
  description: string;
  imageUrl: string;
  contactNumber?: string;
  websiteUrl?: string;
  whatsappNumber?: string;
  category: AdCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  displayLocations: AdLocation[];
  displayFrequency: 'always' | 'once_per_session' | 'hourly';
  isActive: boolean;
  priority: number; // 1 to 10
  clicks: number;
  impressions: number;
  createdAt: string;

  // Legal & Compliance fields
  advertiserName: string;
  advertiserContact: string;
  permissionReference: string;
  campaignAgreementNo: string;
  hasLegalAuthorization: boolean; // Confirmed by app admin
}

export interface AdClickLog {
  id: string;
  adId: string;
  adTitle: string;
  timestamp: string;
  actionType: 'website_click' | 'whatsapp_click' | 'phone_call' | 'banner_click';
  location: AdLocation;
}

export type DailyCashPaymentType = string;

export interface CustomCashColumn {
  id: string;
  name: string;
  color: string; // primary accent hex e.g. #2563eb
  bgLightHex: string; // light background e.g. #eff6ff
  textColorHex: string; // text color e.g. #1e40af
  isDefault?: boolean;
  enabled: boolean;
}

export interface ClosedCashDay {
  date: string; // YYYY-MM-DD
  openingBalance: number;
  totalReceived: number;
  totalPaid: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  closedBy: string;
  closedAt: string;
  notes?: string;
}

export interface DailyCashEntry {
  id: string;
  businessId?: string;
  date: string; // YYYY-MM-DD
  partyName?: string; // Party / Customer / Vendor name
  description: string; // Description
  paymentType: string; // Payment Category (default or custom)
  direction: 'income' | 'expense'; // Income (positive) vs Expense (negative)
  amount: number;
  referenceNo?: string; // Cheque / GPay / Reference number
  status?: 'Completed' | 'Pending'; // Payment status
  notes?: string;
  addToTotal: boolean; // ✓ ON/OFF
  createdAt: string;
}

export type PermissionKey =
  | 'dashboard'
  | 'invoice'
  | 'quotation'
  | 'challan'
  | 'purchase'
  | 'products'
  | 'customers'
  | 'ledger'
  | 'daily_cashbook'
  | 'reports'
  | 'gst_summary'
  | 'settings'
  | 'delete_records'
  | 'edit_records'
  | 'export_pdf_excel';

export type BusinessUserRole = 'owner' | 'admin' | 'manager' | 'staff' | 'view_only';

export interface BusinessUser {
  id: string;
  businessId: string;
  userId?: string;
  userName: string;
  email?: string;
  phone?: string;
  role: BusinessUserRole;
  permissions: PermissionKey[];
  status: 'active' | 'deactivated' | 'revoked';
  accessExpiry?: string | null; // ISO string or null
  isOneTime?: boolean;
  invitedAt: string;
  joinedAt?: string;
  lastActiveAt?: string;
  lastDevice?: string;
  invitedByUserName?: string;
}

export interface QRInvitation {
  id: string;
  businessId: string;
  businessName: string;
  createdByName: string;
  userName: string;
  role: BusinessUserRole;
  permissions: PermissionKey[];
  expiresAt: string | null;
  isOneTime: boolean;
  maxUses: number;
  usedCount: number;
  isRevoked: boolean;
  createdAt: string;
  tokenSecret: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'invoicing' 
  | 'purchases'
  | 'inventory' 
  | 'parties' 
  | 'cashbook'
  | 'daily_cashbook'
  | 'expenses'
  | 'reports'
  | 'ad_manager'
  | 'backup'
  | 'settings'
  | 'multi_user';
