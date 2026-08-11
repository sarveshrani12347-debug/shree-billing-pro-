import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  User,
  BusinessProfile,
  Product,
  Invoice,
  Party,
  Purchase,
  Expense,
  DailyCashEntry,
  BusinessUser,
  QRInvitation,
  RecurringInvoice,
} from "../types";

/**
 * Save / update user profile doc in Firestore under /users/{userId}
 */
export async function saveUserDoc(user: User): Promise<void> {
  try {
    const userRef = doc(db, "users", user.id);
    await setDoc(userRef, user, { merge: true });
  } catch (err) {
    console.error("Error saving user doc to Firestore:", err);
  }
}

/**
 * Fetch user document from Firestore by UID
 */
export async function getUserDoc(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (err) {
    console.error("Error getting user doc:", err);
    return null;
  }
}

/**
 * Save / update business profile doc in Firestore under /businesses/{businessId}
 */
export async function saveBusinessDoc(business: BusinessProfile): Promise<void> {
  try {
    const bizRef = doc(db, "businesses", business.id);
    await setDoc(bizRef, business, { merge: true });
  } catch (err) {
    console.error("Error saving business doc to Firestore:", err);
  }
}

/**
 * Save / sync an individual collection item to Firestore under /businesses/{businessId}/{collectionName}/{itemId}
 */
export async function syncCollectionItem(
  businessId: string,
  collectionName: string,
  itemId: string,
  data: any
): Promise<void> {
  if (!businessId || !collectionName || !itemId) return;
  try {
    const itemRef = doc(db, "businesses", businessId, collectionName, itemId);
    await setDoc(itemRef, { ...data, businessId }, { merge: true });
  } catch (err) {
    console.error(`Error syncing ${collectionName} item ${itemId}:`, err);
  }
}

/**
 * Delete an item from Firestore under /businesses/{businessId}/{collectionName}/{itemId}
 */
export async function deleteCollectionItem(
  businessId: string,
  collectionName: string,
  itemId: string
): Promise<void> {
  if (!businessId || !collectionName || !itemId) return;
  try {
    const itemRef = doc(db, "businesses", businessId, collectionName, itemId);
    await deleteDoc(itemRef);
  } catch (err) {
    console.error(`Error deleting ${collectionName} item ${itemId}:`, err);
  }
}

/**
 * Subscribe to real-time changes across a business's subcollections in Firestore
 */
export function subscribeToBusinessData(
  businessId: string,
  callbacks: {
    onProfile?: (profile: BusinessProfile) => void;
    onProducts?: (products: Product[]) => void;
    onInvoices?: (invoices: Invoice[]) => void;
    onParties?: (parties: Party[]) => void;
    onPurchases?: (purchases: Purchase[]) => void;
    onExpenses?: (expenses: Expense[]) => void;
    onDailyCash?: (dailyCash: DailyCashEntry[]) => void;
    onConnectedUsers?: (connectedUsers: BusinessUser[]) => void;
    onRecurringInvoices?: (recurringInvoices: RecurringInvoice[]) => void;
  }
): () => void {
  if (!businessId) return () => {};

  const unsubscribes: (() => void)[] = [];

  // 1. Business Profile
  try {
    const bizRef = doc(db, "businesses", businessId);
    const unsubBiz = onSnapshot(
      bizRef,
      (snap) => {
        if (snap.exists() && callbacks.onProfile) {
          callbacks.onProfile(snap.data() as BusinessProfile);
        }
      },
      (err) => console.log("Profile sync note:", err.message)
    );
    unsubscribes.push(unsubBiz);
  } catch (e) {
    console.error("Sub error biz:", e);
  }

  // 2. Products
  try {
    const colRef = collection(db, "businesses", businessId, "products");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (callbacks.onProducts) {
          const items = snap.docs.map((d) => d.data() as Product);
          callbacks.onProducts(items);
        }
      },
      (err) => console.log("Products sync note:", err.message)
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.error("Sub error products:", e);
  }

  // 3. Invoices
  try {
    const colRef = collection(db, "businesses", businessId, "invoices");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (callbacks.onInvoices) {
          const items = snap.docs.map((d) => d.data() as Invoice);
          callbacks.onInvoices(items);
        }
      },
      (err) => console.log("Invoices sync note:", err.message)
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.error("Sub error invoices:", e);
  }

  // 4. Parties
  try {
    const colRef = collection(db, "businesses", businessId, "parties");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (callbacks.onParties) {
          const items = snap.docs.map((d) => d.data() as Party);
          callbacks.onParties(items);
        }
      },
      (err) => console.log("Parties sync note:", err.message)
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.error("Sub error parties:", e);
  }

  // 5. Purchases
  try {
    const colRef = collection(db, "businesses", businessId, "purchases");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (callbacks.onPurchases) {
          const items = snap.docs.map((d) => d.data() as Purchase);
          callbacks.onPurchases(items);
        }
      },
      (err) => console.log("Purchases sync note:", err.message)
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.error("Sub error purchases:", e);
  }

  // 6. Expenses
  try {
    const colRef = collection(db, "businesses", businessId, "expenses");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (callbacks.onExpenses) {
          const items = snap.docs.map((d) => d.data() as Expense);
          callbacks.onExpenses(items);
        }
      },
      (err) => console.log("Expenses sync note:", err.message)
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.error("Sub error expenses:", e);
  }

  // 7. Daily Cashbook
  try {
    const colRef = collection(db, "businesses", businessId, "dailyCashBook");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (callbacks.onDailyCash) {
          const items = snap.docs.map((d) => d.data() as DailyCashEntry);
          callbacks.onDailyCash(items);
        }
      },
      (err) => console.log("DailyCash sync note:", err.message)
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.error("Sub error dailyCash:", e);
  }

  // 8. Connected Users
  try {
    const colRef = collection(db, "businesses", businessId, "connected_users");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (callbacks.onConnectedUsers) {
          const items = snap.docs.map((d) => d.data() as BusinessUser);
          callbacks.onConnectedUsers(items);
        }
      },
      (err) => console.log("ConnectedUsers sync note:", err.message)
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.error("Sub error connectedUsers:", e);
  }

  // 9. Recurring Invoices
  try {
    const colRef = collection(db, "businesses", businessId, "recurringInvoices");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (callbacks.onRecurringInvoices) {
          const items = snap.docs.map((d) => d.data() as RecurringInvoice);
          callbacks.onRecurringInvoices(items);
        }
      },
      (err) => console.log("RecurringInvoices sync note:", err.message)
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.error("Sub error recurringInvoices:", e);
  }

  // Return master unsubscriber
  return () => {
    unsubscribes.forEach((fn) => fn());
  };
}
