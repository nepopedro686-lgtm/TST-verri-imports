'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { MessageCircle, Settings, X } from 'lucide-react';
import { auth, db, testFirestoreConnection } from '@/lib/firebase';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  DEFAULT_CATALOG_META,
  DEFAULT_STORE_SETTINGS,
} from '@/lib/defaults';
import {
  checkCatalogMetaExists,
  fetchCatalogMeta,
  fetchPublishedProductsOnce,
  fetchStoreSettings,
} from '@/lib/store-data';
import { SAMPLE_CATALOG_PRODUCTS } from '@/lib/sample-catalog';
import { CatalogMeta, Product, StoreSettings } from '@/lib/types';

interface StoreContextValue {
  settings: StoreSettings;
  catalogMeta: CatalogMeta;
  publishedProducts: Product[];
  isShowingSampleCatalog: boolean;
  loadingCatalog: boolean;
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  refreshStoreData: () => Promise<void>;
  notifyMissingWhatsApp: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta>(DEFAULT_CATALOG_META);
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [catalogInitializedInDb, setCatalogInitializedInDb] = useState<boolean | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [missingWaModalOpen, setMissingWaModalOpen] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const [loadedSettings, loadedMeta, metaExists, loadedProducts] =
        await Promise.all([
          fetchStoreSettings(),
          fetchCatalogMeta(),
          checkCatalogMetaExists(),
          fetchPublishedProductsOnce(),
        ]);
      setSettings(loadedSettings);
      setCatalogMeta(loadedMeta);
      setCatalogInitializedInDb(metaExists);
      setFirestoreProducts(loadedProducts);
      if (loadedSettings.accentColor) {
        document.documentElement.style.setProperty(
          '--store-accent',
          loadedSettings.accentColor
        );
      }
    } catch {
      setCatalogInitializedInDb(false);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    testFirestoreConnection();

    Promise.all([
      fetchStoreSettings(),
      fetchCatalogMeta(),
      checkCatalogMetaExists(),
      fetchPublishedProductsOnce(),
    ])
      .then(([loadedSettings, loadedMeta, metaExists, loadedProducts]) => {
        if (!active) return;
        setSettings(loadedSettings);
        setCatalogMeta(loadedMeta);
        setCatalogInitializedInDb(metaExists);
        setFirestoreProducts(loadedProducts);
        if (loadedSettings.accentColor) {
          document.documentElement.style.setProperty(
            '--store-accent',
            loadedSettings.accentColor
          );
        }
      })
      .catch(() => {
        if (active) setCatalogInitializedInDb(false);
      })
      .finally(() => {
        if (active) setLoadingCatalog(false);
      });

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser || !currentUser.emailVerified) {
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      if (currentUser.email === ADMIN_BOOTSTRAP_EMAIL) {
        setIsAdmin(true);
        setAuthReady(true);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        setIsAdmin(adminSnap.exists());
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthReady(true);
      }
    });

    return () => {
      active = false;
      unsubAuth();
    };
  }, []);

  const notifyMissingWhatsApp = useCallback(() => {
    setMissingWaModalOpen(true);
  }, []);

  // Show sample showcase items until admin initializes/customizes Firestore catalog
  const isShowingSampleCatalog =
    !loadingCatalog &&
    firestoreProducts.length === 0 &&
    catalogInitializedInDb === false;

  const publishedProducts = useMemo(() => {
    if (firestoreProducts.length > 0) return firestoreProducts;
    if (isShowingSampleCatalog) return SAMPLE_CATALOG_PRODUCTS;
    return [];
  }, [firestoreProducts, isShowingSampleCatalog]);

  const value = useMemo<StoreContextValue>(
    () => ({
      settings,
      catalogMeta,
      publishedProducts,
      isShowingSampleCatalog,
      loadingCatalog,
      user,
      authReady,
      isAdmin,
      refreshStoreData: loadConfig,
      notifyMissingWhatsApp,
    }),
    [
      settings,
      catalogMeta,
      publishedProducts,
      isShowingSampleCatalog,
      loadingCatalog,
      user,
      authReady,
      isAdmin,
      loadConfig,
      notifyMissingWhatsApp,
    ]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}

      {missingWaModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wa-missing-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h2
                  id="wa-missing-title"
                  className="text-lg font-semibold text-zinc-950"
                >
                  WhatsApp ainda não configurado
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMissingWaModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Fechar aviso"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              O número oficial de WhatsApp da loja ainda não foi cadastrado no
              painel administrativo. Se você é o proprietário, acesse as
              configurações da loja para informar o número com DDD.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setMissingWaModalOpen(false)}
                className="min-h-[44px] rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Fechar
              </button>
              <Link
                href="/admin?tab=configuracoes"
                onClick={() => setMissingWaModalOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <Settings className="h-4 w-4" />
                Configurar no Painel
              </Link>
            </div>
          </div>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore deve ser usado dentro de StoreProvider.');
  }
  return ctx;
}
