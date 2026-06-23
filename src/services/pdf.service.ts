import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fetch from 'node-fetch';

export interface SignPdfParams {
  originalPdfUrl: string;
  signatureImageSource: string;
  page: number; // 1-indexed
  x: number;
  y: number;
  width: number;
  height: number;
  verificationCode: string;
  signerName: string;
}

/**
 * PDF Manipulation Service.
 * Isolates all pdf-lib logic (fetching, drawing, saving) from the business layer.
 */
export const pdfService = {
  /**
   * Downloads the original PDF, embeds the base64 signature image at the specified coordinates,
   * injects a verification footer on every page, and returns the modified PDF as a Buffer.
   *
   * @param params SignPdfParams
   * @returns Promise<Buffer> The signed PDF buffer ready for Cloudinary upload
   */
  signPdf: async (params: SignPdfParams): Promise<Buffer> => {
    try {
      // 1. Fetch the original PDF from Cloudinary
      const response = await fetch(params.originalPdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch original PDF: ${response.statusText}`);
      }
      const pdfBytes = await response.arrayBuffer();

      // 2. Load the PDF into pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // 3. Process the signature image.
      const { bytes: imageBytes, kind: imageKind } = await pdfService.loadSignatureImage(params.signatureImageSource);

      let signatureImage;
      if (imageKind === 'png') {
        signatureImage = await pdfDoc.embedPng(imageBytes);
      } else {
        signatureImage = await pdfDoc.embedJpg(imageBytes);
      }

      // 4. Get the target page (pdf-lib pages are 0-indexed)
      const pages = pdfDoc.getPages();
      const targetPageIndex = params.page - 1;

      if (targetPageIndex < 0 || targetPageIndex >= pages.length) {
        throw new Error(`Invalid page number. Document has ${pages.length} pages.`);
      }

      const targetPage = pages[targetPageIndex];

      // 5. Draw the signature image on the target page
      // Note: pdf-lib coordinate origin (0,0) is the BOTTOM-LEFT corner
      targetPage.drawImage(signatureImage, {
        x: params.x,
        y: params.y,
        width: params.width,
        height: params.height,
      });

      // 6. Embed the verification footer on EVERY page
      // "Digitally signed by [Name] | Verify at /verify/[Code]"
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const fontSize = 8;
      const footerText = `Digitally signed by ${params.signerName} | Verification Code: ${params.verificationCode}`;

      pages.forEach((page) => {
        const { width } = page.getSize();
        const textWidth = font.widthOfTextAtSize(footerText, fontSize);

        page.drawText(footerText, {
          x: width / 2 - textWidth / 2, // Center horizontally
          y: 15, // 15 points from the bottom
          size: fontSize,
          font: font,
          color: rgb(0.4, 0.4, 0.4), // Dark grey
        });
      });

      // 7. Save and return the modified PDF buffer
      const signedPdfBytes = await pdfDoc.save();
      return Buffer.from(signedPdfBytes);
    } catch (error) {
      console.error('PDF signing failed:', error);
      const err = new Error('Failed to process PDF signature') as Error & { statusCode: number };
      err.statusCode = 500;
      throw err;
    }
  },

  /**
   * Loads a signature image from either a data URI or a remote URL and returns
   * both the bytes and detected format.
   */
  loadSignatureImage: async (signatureImageSource: string): Promise<{ bytes: Buffer; kind: 'png' | 'jpg' }> => {
    if (signatureImageSource.startsWith('data:')) {
      const isPng = signatureImageSource.startsWith('data:image/png');
      const isJpg =
        signatureImageSource.startsWith('data:image/jpeg') ||
        signatureImageSource.startsWith('data:image/jpg');

      if (!isPng && !isJpg) {
        throw new Error('Unsupported signature image format. Must be PNG or JPG.');
      }

      const base64Data = signatureImageSource.replace(/^data:image\/\w+;base64,/, '');
      const bytes = Buffer.from(base64Data, 'base64');

      return {
        bytes,
        kind: isPng ? 'png' : 'jpg',
      };
    }

    const response = await fetch(signatureImageSource);
    if (!response.ok) {
      throw new Error(`Failed to fetch signature image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const bytes = Buffer.from(await response.arrayBuffer());

    if (contentType.includes('png')) {
      return { bytes, kind: 'png' };
    }

    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      return { bytes, kind: 'jpg' };
    }

    const lowerSource = signatureImageSource.toLowerCase();
    if (lowerSource.endsWith('.png')) {
      return { bytes, kind: 'png' };
    }

    if (lowerSource.endsWith('.jpg') || lowerSource.endsWith('.jpeg')) {
      return { bytes, kind: 'jpg' };
    }

    if (bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
      return { bytes, kind: 'png' };
    }

    if (bytes.subarray(0, 2).toString('hex') === 'ffd8') {
      return { bytes, kind: 'jpg' };
    }

    throw new Error('Unsupported signature image format. Must be PNG or JPG.');
  },
};
