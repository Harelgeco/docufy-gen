import { renderAsync } from "docx-preview";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { prepareDocxForRender } from "./docxRenderPrep";

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
      width: max-content;
      direction: ltr;
      background: white;
      padding: 0;
      box-sizing: border-box;
      z-index: 999999;
      opacity: 0;
      pointer-events: none;
      overflow: visible;
    `;
    
    this.container.id = "pdf-generation-container";
    document.body.appendChild(this.container);
    
    console.log("✅ Container created:", this.container);
  }

  private async renderDocx(blob: Blob): Promise<void> {
    if (!this.container) throw new Error("No container");
    
    await renderAsync(await prepareDocxForRender(blob), this.container, undefined, {
      className: "docx-wrapper",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      experimental: true,
      useBase64URL: true,
      renderHeaders: true,
      renderFooters: true,
    });

    // Preview chrome is not template content: never include its gray backdrop
    // or page shadows in the PDF. Keep all document elements untouched.
    const wrapper = this.container.querySelector<HTMLElement>(".docx-wrapper-wrapper");
    if (wrapper) {
      wrapper.style.background = "transparent";
      wrapper.style.padding = "0";
    }
    this.container.querySelectorAll<HTMLElement>(".docx-wrapper-wrapper > section.docx-wrapper").forEach((page) => {
      page.style.boxShadow = "none";
      page.style.margin = "0";
      // Keep "behind text" pictures behind the text when captured
      page.style.position = "relative";
      page.style.zIndex = "0";
      // Floating pictures (e.g. page backgrounds) sit in zero-size holders;
      // send them behind the text, like Word's "behind text" layout.
      page.querySelectorAll<HTMLElement>("img").forEach((img) => {
        const holder = img.parentElement;
        if (holder && holder.style.width === "0px" && holder.style.height === "0px") {
          holder.style.zIndex = "-1";
          if (!holder.style.position) holder.style.position = "relative";
        }
      });
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
    
    // Capture actual Word pages, not the preview container and its spacing.
    // This preserves original page margins and avoids a trailing overflow page.
    const pages = Array.from(this.container.querySelectorAll<HTMLElement>(
      ".docx-wrapper-wrapper > section.docx-wrapper"
    ));
    if (pages.length === 0) throw new Error("No document pages rendered");

    let pdf: jsPDF | undefined;
    for (const page of pages) {
      const bounds = page.getBoundingClientRect();
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: bounds.width,
        height: bounds.height,
        windowWidth: Math.max(document.documentElement.clientWidth, page.scrollWidth),
        windowHeight: Math.max(document.documentElement.clientHeight, page.scrollHeight),
      });
      if (canvas.width === 0 || canvas.height === 0) throw new Error("Canvas is empty!");

      const width = bounds.width * 25.4 / 96;
      const height = bounds.height * 25.4 / 96;
      const orientation = width > height ? "landscape" : "portrait";
      if (!pdf) {
        pdf = new jsPDF({ orientation, unit: "mm", format: [width, height] });
      } else {
        pdf.addPage([width, height], orientation);
      }
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, width, height);
    }

    if (!pdf) throw new Error("No PDF pages generated");
    
    console.log("✅ PDF created, saving...");
    pdf.save(fileName);
    console.log("✅ PDF saved:", fileName);
  }

  private cleanup(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      console.log("✅ Container removed");
    }
    this.container = null;
  }
}
