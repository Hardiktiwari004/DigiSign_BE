import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fetch from 'node-fetch';

export interface SignPdfParams {
  originalPdfUrl: string;
  signatureImageBase64: string;
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

      // 3. Process the base64 signature image
      // Determine if it's PNG or JPG based on the data URI prefix
      const isPng = params.signatureImageBase64.startsWith('data:image/png');
      const isJpg =
        params.signatureImageBase64.startsWith('data:image/jpeg') ||
        params.signatureImageBase64.startsWith('data:image/jpg');

      if (!isPng && !isJpg) {
        throw new Error('Unsupported signature image format. Must be PNG or JPG.');
      }

      // Strip the data URI prefix (e.g., "data:image/png;base64,") to get raw base64
      const base64Data = params.signatureImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageBytes = Buffer.from(base64Data, 'base64');

      let signatureImage;
      if (isPng) {
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
};
