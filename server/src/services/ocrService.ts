import { createWorker, Worker } from 'tesseract.js';
import fs from 'fs/promises';
import path from 'path';
import pdfToText from 'pdf-parse';
import mammoth from 'mammoth';
import { promisify } from 'util';

class OCRService {
  private static instance: OCRService;

  private constructor() {}

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  private async extractTextFromImage(filePath: string): Promise<string> {
    const worker = await createWorker({
      // @ts-ignore - The type definitions don't include the logger option
      logger: (m: any) => console.log(m),
    });
    
    try {
      // @ts-ignore - The type definitions are incomplete
      await worker.loadLanguage('eng');
      // @ts-ignore - The type definitions are incomplete
      await worker.initialize('eng');
      // @ts-ignore - The type definitions are incomplete
      const { data: { text } } = await worker.recognize(filePath);
      return text;
    } finally {
      // @ts-ignore - The type definitions are incomplete
      await worker.terminate();
    }
  }

  private async extractTextFromPdf(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfToText(dataBuffer);
    return data.text;
  }

  private async extractTextFromDocx(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer } as any);
    return result.value;
  }

  public async extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        return await this.extractTextFromImage(filePath);
      } else if (ext === '.pdf') {
        return await this.extractTextFromPdf(filePath);
      } else if (['.doc', '.docx'].includes(ext)) {
        return await this.extractTextFromDocx(filePath);
      } else {
        throw new Error('Unsupported file type for OCR');
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error('Failed to extract text from file');
    }
  }

  public parseExpenseFromText(text: string): {
    description: string;
    amount: number;
    date: Date;
    category: string;
  } {
    // Simple regex patterns to extract common expense information
    const amountMatch = text.match(/Total.*?\$?(\d+\.?\d{0,2})/i) || 
                       text.match(/\$?(\d+\.?\d{0,2})/);
    
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
    
    // Default values
    const result = {
      description: 'Expense from receipt',
      amount: amountMatch ? parseFloat(amountMatch[1]) : 0,
      date: dateMatch ? new Date(dateMatch[1]) : new Date(),
      category: 'other'
    };

    // Try to determine category from common keywords
    const lowerText = text.toLowerCase();
    const categories = {
      'food': /(restaurant|cafe|food|eat|dine|meal|coffee|tea|breakfast|lunch|dinner)/i,
      'travel': /(travel|flight|taxi|uber|lyft|train|bus|transport|fuel|gas|parking)/i,
      'accommodation': /(hotel|motel|hostel|airbnb|accommodation|stay|lodging)/i,
      'office-supplies': /(office|stationery|printer|ink|paper|pen|pencil|notebook|staple|folder|file)/i,
      'equipment': /(laptop|computer|monitor|keyboard|mouse|desk|chair|equipment|hardware)/i
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(lowerText)) {
        result.category = category;
        result.description = `Expense from receipt (${category})`;
        break;
      }
    }

    return result;
  }
}

export default OCRService.getInstance();
