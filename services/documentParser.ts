import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import { Platform } from 'react-native';

export class DocumentParser {
  /**
   * Reads a plain text file directly via FileSystem string formatting.
   */
  static async parseTextFile(uri: string): Promise<string> {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      return await response.text();
    }
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: 'utf8',
    });
    return content;
  }

  /**
   * Retrieves the raw Base64 payload required by JSZip and Gemini
   */
  static async resolveBase64(uri: string): Promise<string> {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const base64Chunk = dataUrl.split(',')[1];
          resolve(base64Chunk || dataUrl); // Fallback to full string if safely base
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    return await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
  }

  /**
   * Unzips a DOCX file and extracts its inner XML document format natively,
   * then strips the XML tags iteratively to fetch all string paragraph literals.
   */
  static async parseDocx(uri: string): Promise<string> {
    const base64 = await this.resolveBase64(uri);
    const zip = await JSZip.loadAsync(base64, { base64: true });
    
    // In docx schemas, the core texts are locked inside 'word/document.xml'
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error("Invalid DOCX format: missing document root chunk.");
    }
    
    // Execute synchronous read locally on the mobile phone
    const xmlContent = await docXmlFile.async('string');
    
    // Highly efficient regex to grab values exclusively within <w:t> textual element nodes
    // and strip away the formatting and stylistic wrappers.
    const rawParagraphFragments = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    if (!rawParagraphFragments) return "";
    
    return rawParagraphFragments
      .map(node => node.replace(/<[^>]+>/g, "").trim())
      .join(" ")
      .trim();
  }

  /**
   * Iterates through a PPTX Presentation ZIP structure and aggregates text fragments.
   */
  static async parsePptx(uri: string): Promise<string> {
    const base64 = await this.resolveBase64(uri);
    const zip = await JSZip.loadAsync(base64, { base64: true });
    
    let combinedPresentationText = "";

    // PPTX holds slides in 'ppt/slides/slideN.xml'
    const slideFiles = Object.keys(zip.files).filter(fileName => 
      fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')
    );

    for (const slideFileName of slideFiles) {
      const slideXmlFile = zip.file(slideFileName);
      if (slideXmlFile) {
        const slideXml = await slideXmlFile.async('string');
        // Extract paragraph/run text values constrained within `<a:t>` bounds
        const rawSlideFragments = slideXml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
        
        if (rawSlideFragments) {
          const slideCleanedText = rawSlideFragments
            .map(node => node.replace(/<[^>]+>/g, "").trim())
            .join(" ");
            
          combinedPresentationText += slideCleanedText + "\n";
        }
      }
    }
    return combinedPresentationText.trim();
  }
}
