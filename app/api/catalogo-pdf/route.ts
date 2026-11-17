import { NextRequest, NextResponse } from 'next/server';
import {
  checkCatalogMetaExists,
  fetchPublishedProductsOnce,
  fetchStoreSettings,
} from '@/lib/store-data';
import { DEFAULT_STORE_SETTINGS } from '@/lib/defaults';
import { SAMPLE_CATALOG_PRODUCTS } from '@/lib/sample-catalog';
import { generateStoreCatalogPdf } from '@/lib/pdf-catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const viewInline = req.nextUrl.searchParams.get('view') === '1';

    let settings = DEFAULT_STORE_SETTINGS;
    let products = SAMPLE_CATALOG_PRODUCTS;

    try {
      const [loadedSettings, metaExists, loadedProducts] = await Promise.all([
        fetchStoreSettings(),
        checkCatalogMetaExists(),
        fetchPublishedProductsOnce(),
      ]);
      settings = loadedSettings;
      if (loadedProducts.length > 0 || metaExists) {
        products = loadedProducts;
      }
    } catch {
      // Fallback cleanly to defaults & showcase catalog if Firestore is temporarily unreachable
    }

    const origin =
      process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL')
        ? process.env.APP_URL
        : req.nextUrl.origin;

    const pdfBytes = await generateStoreCatalogPdf({
      settings,
      products,
      siteUrl: origin,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': viewInline
          ? 'inline; filename="Verri-Imports-Catalogo.pdf"'
          : 'attachment; filename="Verri-Imports-Catalogo.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível gerar o PDF do catálogo no momento.' },
      { status: 500 }
    );
  }
}
