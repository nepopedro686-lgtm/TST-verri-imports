import fs from 'node:fs/promises';
import path from 'node:path';
import {
  PDFArray,
  PDFDocument,
  PDFImage,
  PDFName,
  PDFPage,
  PDFString,
  PDFFont,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Product, StoreSettings } from './types';
import { AVAILABILITY_LABELS, CONDITION_LABELS } from './defaults';
import {
  buildGeneralWhatsAppMessage,
  buildProductWhatsAppMessage,
  formatBRL,
  formatWhatsAppUrl,
} from './format';

const WIN_ANSI_EXTRAS = new Set([
  0x20ac, // €
  0x201a, // ‚
  0x0192, // ƒ
  0x201e, // „
  0x2026, // …
  0x2020, // †
  0x2021, // ‡
  0x02c6, // ˆ
  0x2030, // ‰
  0x0160, // Š
  0x2039, // ‹
  0x0152, // Œ
  0x017d, // Ž
  0x2018, // ‘
  0x2019, // ’
  0x201c, // “
  0x201d, // ”
  0x2022, // •
  0x2013, // –
  0x2014, // —
  0x02dc, // ˜
  0x2122, // ™
  0x0161, // š
  0x203a, // ›
  0x0153, // œ
  0x017e, // ž
  0x0178, // Ÿ
]);

function toWinAnsiSafe(input: string): string {
  const normalized = input
    .replace(/[\r\t]+/g, ' ')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/✓|✔/g, 'OK')
    .replace(/[^\S\n]+/g, ' ');

  let out = '';
  for (const ch of normalized) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    if (
      ch === '\n' ||
      (code >= 0x20 && code <= 0x7e) ||
      (code >= 0xa0 && code <= 0xff) ||
      WIN_ANSI_EXTRAS.has(code)
    ) {
      out += ch;
    }
  }
  return out;
}

function wrapTextLines(
  rawText: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  maxLines: number
): string[] {
  const text = toWinAnsiSafe(rawText).trim();
  if (!text) return [];

  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
          if (lines.length >= maxLines) break;
        }
        // Truncate overly long single tokens cleanly
        let token = word;
        while (
          token.length > 1 &&
          font.widthOfTextAtSize(token, fontSize) > maxWidth
        ) {
          token = token.slice(0, -1);
        }
        current = token;
      }
    }
    if (lines.length >= maxLines) break;
    if (current) {
      lines.push(current);
      if (lines.length >= maxLines) break;
    }
  }

  if (lines.length === maxLines) {
    const totalClean = text.replace(/\s+/g, ' ');
    const joined = lines.join(' ');
    if (joined.length < totalClean.length) {
      let last = lines[maxLines - 1];
      while (
        last.length > 3 &&
        font.widthOfTextAtSize(`${last}...`, fontSize) > maxWidth
      ) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = `${last.replace(/[.,;:\s]+$/, '')}...`;
    }
  }

  return lines.slice(0, maxLines);
}

function parseHexRgb(hex: string) {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return rgb(0, 201 / 255, 167 / 255);
  }
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function addLinkAnnotation(
  pdfDoc: PDFDocument,
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  uri: string
) {
  const linkAnnotation = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of(uri),
    },
  });
  const ref = pdfDoc.context.register(linkAnnotation);
  const existing = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  if (existing) {
    existing.push(ref);
  } else {
    page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([ref]));
  }
}

async function resolveImageForPdf(
  pdfDoc: PDFDocument,
  url: string,
  cache: Map<string, PDFImage | null>
): Promise<PDFImage | null> {
  if (!url) return null;
  if (cache.has(url)) return cache.get(url) ?? null;

  try {
    let bytes: Uint8Array | null = null;
    let isPng = false;

    if (url.startsWith('/images/')) {
      const cleanRel = url.replace(/^\/+/, '');
      const fullPath = path.join(process.cwd(), 'public', cleanRel);
      const buf = await fs.readFile(fullPath);
      bytes = new Uint8Array(buf);
      isPng = cleanRel.toLowerCase().endsWith('.png');
    } else if (url.startsWith('/api/media/')) {
      const mediaId = url.replace('/api/media/', '').split('?')[0];
      if (/^[a-zA-Z0-9_-]{1,128}$/.test(mediaId)) {
        const snap = await getDoc(doc(db, 'media', mediaId));
        if (snap.exists()) {
          const data = snap.data() as { mimeType?: string; dataBase64?: string };
          if (
            data.dataBase64 &&
            (data.mimeType === 'image/jpeg' || data.mimeType === 'image/png')
          ) {
            bytes = new Uint8Array(Buffer.from(data.dataBase64, 'base64'));
            isPng = data.mimeType === 'image/png';
          }
        }
      }
    }

    if (!bytes) {
      cache.set(url, null);
      return null;
    }

    const embedded = isPng
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);
    cache.set(url, embedded);
    return embedded;
  } catch {
    cache.set(url, null);
    return null;
  }
}

function drawImageCover(
  page: PDFPage,
  image: PDFImage,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
) {
  // Fit neatly inside box while preserving aspect ratio (no cropping distortion)
  const scale = Math.min(boxW / image.width, boxH / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  const drawX = boxX + (boxW - drawW) / 2;
  const drawY = boxY + (boxH - drawH) / 2;
  page.drawImage(image, { x: drawX, y: drawY, width: drawW, height: drawH });
}

export async function generateStoreCatalogPdf(params: {
  settings: StoreSettings;
  products: Product[];
  siteUrl: string;
}): Promise<Uint8Array> {
  const { settings, products, siteUrl } = params;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(toWinAnsiSafe(`${settings.storeName} - Catálogo e Assistência Técnica`));
  pdfDoc.setAuthor(toWinAnsiSafe(settings.storeName));
  pdfDoc.setSubject(
    toWinAnsiSafe('Catálogo de smartphones, áudio e assistência técnica')
  );

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const imageCache = new Map<string, PDFImage | null>();

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN = 36;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const darkBg = rgb(9 / 255, 9 / 255, 11 / 255);
  const darkSurface = rgb(24 / 255, 24 / 255, 27 / 255);
  const canvasBg = rgb(250 / 255, 250 / 255, 250 / 255);
  const white = rgb(1, 1, 1);
  const borderGray = rgb(228 / 255, 228 / 255, 231 / 255);
  const imgBg = rgb(244 / 255, 244 / 255, 245 / 255);
  const textPrimary = rgb(9 / 255, 9 / 255, 11 / 255);
  const textMuted = rgb(82 / 255, 82 / 255, 91 / 255);
  const textLightMuted = rgb(161 / 255, 161 / 255, 170 / 255);
  const accent = parseHexRgb(settings.accentColor || '#00C9A7');

  const generalWaUrl = formatWhatsAppUrl(
    settings.whatsappNumber,
    buildGeneralWhatsAppMessage(settings.storeName)
  );
  const repairWaUrl = formatWhatsAppUrl(
    settings.whatsappNumber,
    'Olá! Gostaria de solicitar um orçamento na assistência técnica.'
  );

  const productsPerPage = 6;
  const productPagesCount = Math.max(1, Math.ceil(products.length / productsPerPage));
  const totalPages = 1 + (products.length > 0 ? productPagesCount : 0);

  const drawFooter = (page: PDFPage, pageNum: number) => {
    page.drawLine({
      start: { x: MARGIN, y: 38 },
      end: { x: PAGE_W - MARGIN, y: 38 },
      thickness: 0.75,
      color: borderGray,
    });
    page.drawText(
      toWinAnsiSafe(
        `${settings.storeName} · ${settings.phone || settings.whatsappNumber || ''} · Volta Redonda, RJ`
      ),
      { x: MARGIN, y: 22, size: 8, font: fontRegular, color: textMuted }
    );
    const pageLabel = `Página ${pageNum} de ${totalPages}`;
    const labelW = fontRegular.widthOfTextAtSize(pageLabel, 8);
    page.drawText(pageLabel, {
      x: PAGE_W - MARGIN - labelW,
      y: 22,
      size: 8,
      font: fontRegular,
      color: textMuted,
    });
  };

  // =========================================================
  // PAGE 1: COVER + HIGHLIGHTS + ASSISTENCIA TECNICA + LOCAL
  // =========================================================
  const cover = pdfDoc.addPage([PAGE_W, PAGE_H]);
  cover.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: canvasBg,
  });

  // Top dark hero band
  const heroH = 265;
  const heroY = PAGE_H - heroH;
  cover.drawRectangle({
    x: 0,
    y: heroY,
    width: PAGE_W,
    height: heroH,
    color: darkBg,
  });

  // Accent top stripe
  cover.drawRectangle({
    x: 0,
    y: PAGE_H - 4,
    width: PAGE_W,
    height: 4,
    color: accent,
  });

  // Brand badge + name
  cover.drawRectangle({
    x: MARGIN,
    y: PAGE_H - 52,
    width: 24,
    height: 24,
    color: darkSurface,
    borderColor: rgb(63 / 255, 63 / 255, 70 / 255),
    borderWidth: 1,
  });
  const initialChar = toWinAnsiSafe(settings.storeName.charAt(0).toUpperCase() || 'V');
  cover.drawText(initialChar, {
    x: MARGIN + 8,
    y: PAGE_H - 45,
    size: 13,
    font: fontBold,
    color: accent,
  });
  cover.drawText(toWinAnsiSafe(settings.storeName.toUpperCase()), {
    x: MARGIN + 34,
    y: PAGE_H - 44,
    size: 13,
    font: fontBold,
    color: white,
  });

  if (settings.tagline) {
    const tagLines = wrapTextLines(settings.tagline, fontRegular, 9, 290, 2);
    tagLines.forEach((line, i) => {
      cover.drawText(line, {
        x: MARGIN,
        y: PAGE_H - 74 - i * 12,
        size: 9,
        font: fontRegular,
        color: textLightMuted,
      });
    });
  }

  const heroTitleLines = wrapTextLines(settings.heroTitle, fontBold, 21, 295, 3);
  heroTitleLines.forEach((line, idx) => {
    cover.drawText(line, {
      x: MARGIN,
      y: PAGE_H - 114 - idx * 25,
      size: 21,
      font: fontBold,
      color: white,
    });
  });

  const heroSubLines = wrapTextLines(settings.heroSubtitle, fontRegular, 9.5, 295, 3);
  heroSubLines.forEach((line, idx) => {
    cover.drawText(line, {
      x: MARGIN,
      y: PAGE_H - 190 - idx * 13,
      size: 9.5,
      font: fontRegular,
      color: rgb(212 / 255, 212 / 255, 216 / 255),
    });
  });

  // Hero CTA buttons
  if (generalWaUrl) {
    const btnX = MARGIN;
    const btnY = heroY + 20;
    const btnW = 148;
    const btnH = 26;
    cover.drawRectangle({ x: btnX, y: btnY, width: btnW, height: btnH, color: accent });
    cover.drawText('Falar no WhatsApp ->', {
      x: btnX + 14,
      y: btnY + 9,
      size: 9.5,
      font: fontBold,
      color: textPrimary,
    });
    addLinkAnnotation(pdfDoc, cover, btnX, btnY, btnW, btnH, generalWaUrl);
  }

  if (siteUrl) {
    const siteBtnX = MARGIN + 158;
    const siteBtnY = heroY + 20;
    const siteBtnW = 132;
    const siteBtnH = 26;
    cover.drawRectangle({
      x: siteBtnX,
      y: siteBtnY,
      width: siteBtnW,
      height: siteBtnH,
      color: darkSurface,
      borderColor: rgb(82 / 255, 82 / 255, 91 / 255),
      borderWidth: 1,
    });
    cover.drawText('Abrir site interativo', {
      x: siteBtnX + 16,
      y: siteBtnY + 9,
      size: 9.5,
      font: fontBold,
      color: white,
    });
    addLinkAnnotation(pdfDoc, cover, siteBtnX, siteBtnY, siteBtnW, siteBtnH, siteUrl);
  }

  // Hero showroom image on right
  const heroImg = await resolveImageForPdf(
    pdfDoc,
    '/images/hero_boutique_showroom.jpg',
    imageCache
  );
  const heroBoxX = PAGE_W - MARGIN - 208;
  const heroBoxY = heroY + 22;
  const heroBoxW = 208;
  const heroBoxH = 208;
  cover.drawRectangle({
    x: heroBoxX,
    y: heroBoxY,
    width: heroBoxW,
    height: heroBoxH,
    color: darkSurface,
    borderColor: rgb(63 / 255, 63 / 255, 70 / 255),
    borderWidth: 1,
  });
  if (heroImg) {
    drawImageCover(cover, heroImg, heroBoxX + 4, heroBoxY + 4, heroBoxW - 8, heroBoxH - 8);
  }

  // Highlights bar below Hero
  let cursorY = heroY - 24;
  const highlights = (settings.commercialHighlights || []).slice(0, 3);
  if (highlights.length > 0) {
    const colW = (CONTENT_W - 16) / highlights.length;
    highlights.forEach((hl, i) => {
      const bx = MARGIN + i * (colW + 8);
      cover.drawRectangle({
        x: bx,
        y: cursorY - 38,
        width: colW,
        height: 44,
        color: white,
        borderColor: borderGray,
        borderWidth: 1,
      });
      const lines = wrapTextLines(hl, fontBold, 8.5, colW - 16, 2);
      lines.forEach((line, li) => {
        cover.drawText(line, {
          x: bx + 8,
          y: cursorY - 12 - li * 11,
          size: 8.5,
          font: fontBold,
          color: textPrimary,
        });
      });
    });
    cursorY -= 62;
  }

  // Assistência Técnica block on Cover
  const repairCardH = 266;
  const repairCardY = cursorY - repairCardH;
  cover.drawRectangle({
    x: MARGIN,
    y: repairCardY,
    width: CONTENT_W,
    height: repairCardH,
    color: white,
    borderColor: borderGray,
    borderWidth: 1,
  });

  cover.drawText('ASSISTÊNCIA TÉCNICA ESPECIALIZADA', {
    x: MARGIN + 16,
    y: cursorY - 22,
    size: 8.5,
    font: fontBold,
    color: textMuted,
  });
  cover.drawText('Manutenção para iPhone e Android em Volta Redonda', {
    x: MARGIN + 16,
    y: cursorY - 40,
    size: 14,
    font: fontBold,
    color: textPrimary,
  });
  const repairIntro = wrapTextLines(
    'Diagnóstico em bancada no Plaza Business Center com orçamento transparente antes da execução de qualquer serviço.',
    fontRegular,
    9,
    315,
    2
  );
  repairIntro.forEach((line, i) => {
    cover.drawText(line, {
      x: MARGIN + 16,
      y: cursorY - 58 - i * 12,
      size: 9,
      font: fontRegular,
      color: textMuted,
    });
  });

  const repairItems = [
    ['01. Troca de tela e vidro', 'Frontal completa com teste de toque e sensores.'],
    ['02. Substituição de bateria', 'Correção de desgaste rápido e desligamentos.'],
    ['03. Conector de carga e áudio', 'Limpeza ou troca de USB-C, Lightning e som.'],
    ['04. Câmeras e tampa traseira', 'Reparo de foco, vidro de lente e carcaça.'],
    ['05. Análise em placa e oxidação', 'Diagnóstico para aparelhos que não ligam.'],
    ['06. Sistema e backup seguro', 'Atualização e transferência de dados.'],
  ];

  repairItems.forEach(([title, desc], idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const ix = MARGIN + 16 + col * 162;
    const iy = cursorY - 96 - row * 40;
    cover.drawText(toWinAnsiSafe(title), {
      x: ix,
      y: iy,
      size: 8.5,
      font: fontBold,
      color: textPrimary,
    });
    const dLines = wrapTextLines(desc, fontRegular, 7.5, 154, 2);
    dLines.forEach((dl, di) => {
      cover.drawText(dl, {
        x: ix,
        y: iy - 11 - di * 9.5,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      });
    });
  });

  // Workbench photo inside Assistencia block (right side)
  const benchImg = await resolveImageForPdf(
    pdfDoc,
    '/images/boutique_inspection_bench.jpg',
    imageCache
  );
  const benchBoxX = MARGIN + CONTENT_W - 178;
  const benchBoxY = repairCardY + 48;
  const benchBoxW = 162;
  const benchBoxH = 162;
  cover.drawRectangle({
    x: benchBoxX,
    y: benchBoxY,
    width: benchBoxW,
    height: benchBoxH,
    color: imgBg,
    borderColor: borderGray,
    borderWidth: 1,
  });
  if (benchImg) {
    drawImageCover(
      cover,
      benchImg,
      benchBoxX + 4,
      benchBoxY + 4,
      benchBoxW - 8,
      benchBoxH - 8
    );
  }

  if (repairWaUrl) {
    const rBtnX = benchBoxX;
    const rBtnY = repairCardY + 14;
    const rBtnW = 162;
    const rBtnH = 24;
    cover.drawRectangle({
      x: rBtnX,
      y: rBtnY,
      width: rBtnW,
      height: rBtnH,
      color: darkBg,
    });
    cover.drawText('Orçamento técnico WhatsApp ->', {
      x: rBtnX + 12,
      y: rBtnY + 8,
      size: 8.5,
      font: fontBold,
      color: white,
    });
    addLinkAnnotation(pdfDoc, cover, rBtnX, rBtnY, rBtnW, rBtnH, repairWaUrl);
  }

  // Address & Contact Block at bottom of Page 1
  const contactY = repairCardY - 18;
  const contactH = 114;
  cover.drawRectangle({
    x: MARGIN,
    y: contactY - contactH,
    width: CONTENT_W,
    height: contactH,
    color: white,
    borderColor: borderGray,
    borderWidth: 1,
  });

  cover.drawText('ENDEREÇO E CANAIS OFICIAIS', {
    x: MARGIN + 16,
    y: contactY - 20,
    size: 8.5,
    font: fontBold,
    color: textMuted,
  });

  const addressLines = wrapTextLines(
    settings.address ||
      'Av. Paulo de Frontin, 590 - Plaza Business Center, Loja 07\nAterrado, Volta Redonda - RJ · CEP 27215-580',
    fontBold,
    10,
    290,
    3
  );
  addressLines.forEach((line, i) => {
    cover.drawText(line, {
      x: MARGIN + 16,
      y: contactY - 38 - i * 14,
      size: 10,
      font: fontBold,
      color: textPrimary,
    });
  });

  const rightX = MARGIN + 320;
  cover.drawText(
    toWinAnsiSafe(`WhatsApp / Telefone: ${settings.phone || settings.whatsappNumber}`),
    { x: rightX, y: contactY - 38, size: 9.5, font: fontBold, color: textPrimary }
  );
  if (settings.instagram) {
    cover.drawText(toWinAnsiSafe(`Instagram: ${settings.instagram}`), {
      x: rightX,
      y: contactY - 54,
      size: 9,
      font: fontRegular,
      color: textMuted,
    });
  }
  if (settings.openingHours) {
    cover.drawText(toWinAnsiSafe(`Horário: ${settings.openingHours}`), {
      x: rightX,
      y: contactY - 70,
      size: 9,
      font: fontRegular,
      color: textMuted,
    });
  }
  if (siteUrl) {
    cover.drawText(toWinAnsiSafe(`Catálogo online: ${siteUrl}`), {
      x: MARGIN + 16,
      y: contactY - 96,
      size: 8.5,
      font: fontRegular,
      color: textMuted,
    });
    addLinkAnnotation(
      pdfDoc,
      cover,
      MARGIN + 16,
      contactY - 100,
      CONTENT_W - 32,
      14,
      siteUrl
    );
  }

  drawFooter(cover, 1);

  // =========================================================
  // PAGES 2+: PRODUCT CATALOG GRID (2 COLS x 3 ROWS = 6/PAGE)
  // =========================================================
  const cardGapX = 14;
  const cardGapY = 14;
  const cardW = (CONTENT_W - cardGapX) / 2; // ~254.6pt
  const cardH = 220;

  for (let pageIdx = 0; pageIdx < productPagesCount && products.length > 0; pageIdx++) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    const pageNum = 2 + pageIdx;

    page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: PAGE_H,
      color: canvasBg,
    });

    // Top compact header strip
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 52,
      width: PAGE_W,
      height: 52,
      color: darkBg,
    });
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 3,
      width: PAGE_W,
      height: 3,
      color: accent,
    });
    page.drawText(toWinAnsiSafe(`${settings.storeName} · Catálogo de Aparelhos e Áudio`), {
      x: MARGIN,
      y: PAGE_H - 31,
      size: 12,
      font: fontBold,
      color: white,
    });
    const countLabel = toWinAnsiSafe(`${products.length} itens disponíveis`);
    const countW = fontRegular.widthOfTextAtSize(countLabel, 9);
    page.drawText(countLabel, {
      x: PAGE_W - MARGIN - countW,
      y: PAGE_H - 30,
      size: 9,
      font: fontRegular,
      color: textLightMuted,
    });

    const slice = products.slice(
      pageIdx * productsPerPage,
      (pageIdx + 1) * productsPerPage
    );

    for (let idx = 0; idx < slice.length; idx++) {
      const product = slice[idx];
      const col = idx % 2;
      const row = Math.floor(idx / 2);

      const cx = MARGIN + col * (cardW + cardGapX);
      const cyTop = PAGE_H - 70 - row * (cardH + cardGapY);
      const cy = cyTop - cardH;

      // Card container
      page.drawRectangle({
        x: cx,
        y: cy,
        width: cardW,
        height: cardH,
        color: white,
        borderColor: borderGray,
        borderWidth: 1,
      });

      // Product image box
      const imgBoxX = cx + 8;
      const imgBoxY = cyTop - 100;
      const imgBoxW = cardW - 16;
      const imgBoxH = 92;
      page.drawRectangle({
        x: imgBoxX,
        y: imgBoxY,
        width: imgBoxW,
        height: imgBoxH,
        color: imgBg,
      });

      const primaryUrl = product.images?.[0]?.url;
      if (primaryUrl) {
        const embedded = await resolveImageForPdf(pdfDoc, primaryUrl, imageCache);
        if (embedded) {
          drawImageCover(
            page,
            embedded,
            imgBoxX + 4,
            imgBoxY + 4,
            imgBoxW - 8,
            imgBoxH - 8
          );
        }
      }

      // Unboxed metadata line
      const condLabel = CONDITION_LABELS[product.condition] || product.condition;
      const availLabel = AVAILABILITY_LABELS[product.availability] || product.availability;
      const metaText = toWinAnsiSafe(
        `${product.category} · ${condLabel} · ${availLabel}`
      );
      const availColor =
        product.availability === 'disponivel'
          ? rgb(4 / 255, 120 / 255, 87 / 255)
          : product.availability === 'reservado'
          ? rgb(180 / 255, 83 / 255, 9 / 255)
          : rgb(185 / 255, 28 / 255, 28 / 255);

      page.drawText(metaText, {
        x: cx + 10,
        y: imgBoxY - 13,
        size: 7.5,
        font: fontBold,
        color: availColor,
      });

      // Title
      const titleLines = wrapTextLines(product.name, fontBold, 10.5, cardW - 20, 2);
      titleLines.forEach((line, ti) => {
        page.drawText(line, {
          x: cx + 10,
          y: imgBoxY - 26 - ti * 12,
          size: 10.5,
          font: fontBold,
          color: textPrimary,
        });
      });

      // Model / Storage subtitle
      const subParts = [product.brand, product.model, product.storage]
        .filter(Boolean)
        .join(' · ');
      const subLines = wrapTextLines(subParts, fontRegular, 8, cardW - 20, 1);
      if (subLines[0]) {
        page.drawText(subLines[0], {
          x: cx + 10,
          y: imgBoxY - 51,
          size: 8,
          font: fontRegular,
          color: textMuted,
        });
      }

      // Price
      const priceText = toWinAnsiSafe(formatBRL(product.price));
      page.drawText(priceText, {
        x: cx + 10,
        y: imgBoxY - 68,
        size: 12.5,
        font: fontBold,
        color: textPrimary,
      });

      if (
        typeof product.previousPrice === 'number' &&
        product.previousPrice > product.price
      ) {
        const priceW = fontBold.widthOfTextAtSize(priceText, 12.5);
        const prevText = toWinAnsiSafe(`Antes ${formatBRL(product.previousPrice)}`);
        page.drawText(prevText, {
          x: cx + 16 + priceW,
          y: imgBoxY - 67,
          size: 8,
          font: fontRegular,
          color: textMuted,
        });
      }

      // Description excerpt
      const descSource = product.paymentTerms || product.description || '';
      const descLines = wrapTextLines(descSource, fontRegular, 7.5, cardW - 20, 2);
      descLines.forEach((dl, di) => {
        page.drawText(dl, {
          x: cx + 10,
          y: imgBoxY - 82 - di * 9.5,
          size: 7.5,
          font: fontRegular,
          color: textMuted,
        });
      });

      // Card WhatsApp CTA button
      const pWaUrl = formatWhatsAppUrl(
        settings.whatsappNumber,
        buildProductWhatsAppMessage(product)
      );
      const ctaX = cx + 10;
      const ctaY = cy + 8;
      const ctaW = cardW - 20;
      const ctaH = 20;
      const isSoldOut = product.availability === 'esgotado';
      page.drawRectangle({
        x: ctaX,
        y: ctaY,
        width: ctaW,
        height: ctaH,
        color: isSoldOut ? darkBg : accent,
      });
      const ctaLabel = isSoldOut
        ? 'Consultar reposição no WhatsApp ->'
        : 'Consultar no WhatsApp ->';
      const ctaLabelW = fontBold.widthOfTextAtSize(ctaLabel, 8);
      page.drawText(ctaLabel, {
        x: ctaX + (ctaW - ctaLabelW) / 2,
        y: ctaY + 6.5,
        size: 8,
        font: fontBold,
        color: isSoldOut ? white : textPrimary,
      });
      if (pWaUrl) {
        addLinkAnnotation(pdfDoc, page, ctaX, ctaY, ctaW, ctaH, pWaUrl);
      }
    }

    drawFooter(page, pageNum);
  }

  return pdfDoc.save();
}
