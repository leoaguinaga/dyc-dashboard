import { Jimp, JimpMime } from "jimp";
import { PDFDocument } from "pdf-lib";
import type { Comprobante } from "@/types/api";

const API_URL = process.env.API_URL ?? "http://localhost:3333/api";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

/** Lado máximo al incrustar una foto: suficiente para imprimir en A4 sin inflar el archivo. */
const MAX_LADO_PX = 2400;

export interface ImagenAdjunta {
  tipo: "imagen";
  nombre: string;
  data: Buffer;
  width: number;
  height: number;
}

export interface PdfAdjunto {
  tipo: "pdf";
  nombre: string;
  data: Buffer;
}

export type Adjunto = ImagenAdjunta | PdfAdjunto;

function esPdf(nombre: string, contentType: string) {
  return contentType.includes("pdf") || nombre.toLowerCase().endsWith(".pdf");
}

async function normalizarImagen(nombre: string, data: Buffer): Promise<ImagenAdjunta> {
  // Jimp aplica la orientación EXIF al leer (fotos de celular); el fondo blanco evita negros en PNG/WEBP con alfa.
  const original = await Jimp.read(data);
  if (Math.max(original.width, original.height) > MAX_LADO_PX) {
    original.scaleToFit({ w: MAX_LADO_PX, h: MAX_LADO_PX });
  }
  const lienzo = new Jimp({ width: original.width, height: original.height, color: 0xffffffff });
  lienzo.composite(original, 0, 0);
  const jpeg = await lienzo.getBuffer(JimpMime.jpeg, { quality: 90 });
  return { tipo: "imagen", nombre, data: jpeg, width: lienzo.width, height: lienzo.height };
}

/**
 * Descarga los documentos de sustento del pago, en el orden en que se muestran
 * en pantalla. Un archivo que no se pueda leer se omite para no bloquear la constancia.
 */
export async function cargarAdjuntos(comprobantes: Comprobante[]): Promise<Adjunto[]> {
  const resultado = await Promise.all(
    comprobantes.map(async (c): Promise<Adjunto | null> => {
      try {
        const res = await fetch(`${API_ORIGIN}${c.archivoUrl}`, { cache: "no-store" });
        if (!res.ok) return null;
        const data = Buffer.from(await res.arrayBuffer());
        if (esPdf(c.archivoUrl, res.headers.get("content-type") ?? "")) {
          return { tipo: "pdf", nombre: c.archivoNombre, data };
        }
        return await normalizarImagen(c.archivoNombre, data);
      } catch (err) {
        console.error(`No se pudo adjuntar ${c.archivoNombre}:`, err);
        return null;
      }
    }),
  );
  return resultado.filter((a): a is Adjunto => a !== null);
}

// A4 en puntos (PDF) — el margen es mínimo para que la foto ocupe casi toda la hoja.
const A4_W = 595.28;
const A4_H = 841.89;
const MARGEN_PT = 18;

/** Anexa cada adjunto al final del PDF de la constancia: PDFs tal cual, fotos a página completa. */
export async function anexarAdjuntosPdf(base: Uint8Array, adjuntos: Adjunto[]) {
  if (adjuntos.length === 0) return base;
  const doc = await PDFDocument.load(base);

  for (const adjunto of adjuntos) {
    if (adjunto.tipo === "pdf") {
      try {
        const origen = await PDFDocument.load(adjunto.data, { ignoreEncryption: true });
        const paginas = await doc.copyPages(origen, origen.getPageIndices());
        paginas.forEach((p) => doc.addPage(p));
      } catch (err) {
        console.error(`No se pudo anexar el PDF ${adjunto.nombre}:`, err);
      }
      continue;
    }

    // La hoja toma la orientación de la foto para aprovechar todo el espacio.
    const horizontal = adjunto.width > adjunto.height;
    const [pw, ph] = horizontal ? [A4_H, A4_W] : [A4_W, A4_H];
    const escala = Math.min((pw - MARGEN_PT * 2) / adjunto.width, (ph - MARGEN_PT * 2) / adjunto.height);
    const w = adjunto.width * escala;
    const h = adjunto.height * escala;
    const imagen = await doc.embedJpg(adjunto.data);
    const pagina = doc.addPage([pw, ph]);
    pagina.drawImage(imagen, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }

  return doc.save();
}

/**
 * Word no incrusta PDFs: cada página se rasteriza a imagen para que entre como
 * una hoja más. Las fotos pasan directo.
 */
export async function adjuntosComoImagenes(adjuntos: Adjunto[]): Promise<ImagenAdjunta[]> {
  const imagenes: ImagenAdjunta[] = [];
  for (const adjunto of adjuntos) {
    if (adjunto.tipo === "imagen") {
      imagenes.push(adjunto);
      continue;
    }
    try {
      const mupdf = await import("mupdf");
      const doc = mupdf.Document.openDocument(adjunto.data, "application/pdf");
      for (let i = 0; i < doc.countPages(); i++) {
        const pix = doc
          .loadPage(i)
          .toPixmap(mupdf.Matrix.scale(2, 2), mupdf.ColorSpace.DeviceRGB, false, true);
        imagenes.push({
          tipo: "imagen",
          nombre: `${adjunto.nombre} (pág. ${i + 1})`,
          data: Buffer.from(pix.asJPEG(88)),
          width: pix.getWidth(),
          height: pix.getHeight(),
        });
      }
    } catch (err) {
      console.error(`No se pudo convertir el PDF ${adjunto.nombre} para Word:`, err);
    }
  }
  return imagenes;
}
