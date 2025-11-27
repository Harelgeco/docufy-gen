import { renderAsync } from "docx-preview";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface PDFGeneratorOptions {
  docxBlob: Blob;
  fileName: string;
  onProgress?: (status: string) => void;
}

export class PDFGenerator {
  private container: HTMLDivElement | null = null;

  async generate({ docxBlob, fileName, onProgress }: PDFGeneratorOptions): Promise<void> {
    try {
      onProgress?.("Creating container...");
      this.createContainer();
      
      if (!this.container) {
        throw new Error("Failed to create container");
      }

      onProgress?.("Rendering DOCX...");
      await this.renderDocx(docxBlob);
      
      onProgress?.("Waiting for content to load...");
      await this.waitForContent();
      
      onProgress?.("Generating PDF...");
      await this.captureAndSavePDF(fileName);
      
      onProgress?.("Cleaning up...");
      this.cleanup();
      
      onProgress?.("Done!");
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  private createContainer(): void {
    this.container = document.createElement("div");
    
    // Make it visible but out of view - critical for html2canvas!
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 210mm;
      min-height: 297mm;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      box-sizing: border-box;
      z-index: 999999;
      opacity: 0;
      pointer-events: none;
      overflow: visible;
    `;
    
    this.container.id = "pdf-generation-container";
    document.body.appendChild(this.container);
    
    // Add global styles to remove all borders from docx content
    const style = document.createElement("style");
    style.textContent = `
      #pdf-generation-container,
      #pdf-generation-container *,
      #pdf-generation-container .docx-wrapper,
      #pdf-generation-container .docx,
      #pdf-generation-container section,
      #pdf-generation-container article,
      #pdf-generation-container div {
        background: white !important;
        border: none !important;
        border-top: none !important;
        border-bottom: none !important;
        border-left: none !important;
        border-right: none !important;
        box-shadow: none !important;
        outline: none !important;
      }
      #pdf-generation-container .docx-wrapper section {
        margin: 0 !important;
        padding: 20mm !important;
        page-break-after: avoid !important;
      }
      #pdf-generation-container .docx-wrapper section:first-child {
        padding-top: 20mm !important;
      }
    `;
    document.head.appendChild(style);
    this.container.dataset.styleId = style.id = "pdf-gen-styles";
    
    console.log("✅ Container created:", this.container);
  }

  private async renderDocx(blob: Blob): Promise<void> {
    if (!this.container) throw new Error("No container");
    
    await renderAsync(blob, this.container, undefined, {
      className: "docx-wrapper",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: false,
      useBase64URL: true,
      renderHeaders: true,
      renderFooters: true,
      renderEndnotes: false,
      renderFootnotes: false,
    });
    
    console.log("✅ DOCX rendered, container HTML length:", this.container.innerHTML.length);
    console.log("Container children:", this.container.children.length);
  }

  private async waitForContent(): Promise<void> {
    if (!this.container) throw new Error("No container");
    
    // Wait for fonts
    await document.fonts.ready;
    console.log("✅ Fonts ready");
    
    // Wait for images
    const images = Array.from(this.container.querySelectorAll("img")) as HTMLImageElement[];
    console.log(`Found ${images.length} images`);
    
    if (images.length > 0) {
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
            setTimeout(() => resolve(true), 5000);
          });
        })
      );
      console.log("✅ All images loaded");
    }
    
    // Additional wait for rendering
    await new Promise((r) => setTimeout(r, 1000));
    console.log("✅ Additional wait completed");
    
    // Check if container has content
    const hasContent = this.container.children.length > 0;
    console.log("Has content:", hasContent);
    
    if (!hasContent) {
      throw new Error("Container is empty after rendering!");
    }
  }

  private async captureAndSavePDF(fileName: string): Promise<void> {
    if (!this.container) throw new Error("No container");
    
    // Make visible for capture
    this.container.style.opacity = "1";
    await new Promise((r) => setTimeout(r, 100));
    
    console.log("Starting canvas capture...");
    
    // Capture with html2canvas
    const canvas = await html2canvas(this.container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: this.container.scrollWidth,
      height: this.container.scrollHeight,
      windowWidth: this.container.scrollWidth,
      windowHeight: this.container.scrollHeight,
      removeContainer: false,
    });
    
    console.log("✅ Canvas created:", canvas.width, "x", canvas.height);
    
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas is empty!");
    }
    
    // Convert to PDF
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    
    // A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;
    
    // Calculate image dimensions to fit A4
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: imgHeight > pdfHeight ? "portrait" : "portrait",
      unit: "mm",
      format: "a4",
    });
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add image without margins
    if (imgHeight <= pdfHeight) {
      // Single page - center it
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    } else {
      // Multiple pages
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }
    
    console.log("✅ PDF created, saving...");
    pdf.save(fileName);
    console.log("✅ PDF saved:", fileName);
  }

  private cleanup(): void {
    // Remove styles
    const styleElement = document.getElementById("pdf-gen-styles");
    if (styleElement) {
      styleElement.remove();
    }
    
    // Remove container
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      console.log("✅ Container removed");
    }
    this.container = null;
  }
}
