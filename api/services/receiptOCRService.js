const Tesseract = require('tesseract.js');
const sharp = require('sharp');

class ReceiptOCRService {
  constructor() {
    this.isEnabled = true;
  }

  // Extract text from receipt image
  async extractTextFromImage(imageBuffer) {
    try {
      // Preprocess image for better OCR accuracy
      const processedImage = await this.preprocessImage(imageBuffer);
      
      // Extract text using Tesseract
      const { data: { text } } = await Tesseract.recognize(processedImage, 'eng', {
        logger: m => console.log(m)
      });

      return {
        success: true,
        text: text.trim(),
        confidence: 0.8
      };
    } catch (error) {
      console.error('OCR Error:', error);
      return {
        success: false,
        error: 'Failed to extract text from image',
        text: ''
      };
    }
  }

  // Preprocess image for better OCR
  async preprocessImage(imageBuffer) {
    try {
      return await sharp(imageBuffer)
        .resize(1200, null, { withoutEnlargement: true })
        .greyscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();
    } catch (error) {
      console.error('Image preprocessing error:', error);
      return imageBuffer;
    }
  }

  // Parse receipt text and extract transaction data
  parseReceiptText(text) {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Extract merchant name (usually first few lines)
      const merchantName = this.extractMerchantName(lines);
      
      // Extract total amount
      const totalAmount = this.extractTotalAmount(lines);
      
      // Extract date
      const date = this.extractDate(lines);
      
      // Extract items
      const items = this.extractItems(lines);
      
      // Determine category based on merchant and items
      const category = this.categorizeReceipt(merchantName, items);

      return {
        success: true,
        transaction: {
          name: merchantName || 'Receipt Transaction',
          amount: totalAmount || 0,
          description: this.generateDescription(merchantName, items),
          category: category,
          date: date || new Date(),
          type: 'expense',
          source: 'receipt_ocr',
          items: items,
          rawText: text
        }
      };
    } catch (error) {
      console.error('Receipt parsing error:', error);
      return {
        success: false,
        error: 'Failed to parse receipt data'
      };
    }
  }

  // Extract merchant name from receipt
  extractMerchantName(lines) {
    // Look for merchant name in first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Skip lines that look like addresses or phone numbers
      if (this.isLikelyMerchantName(line)) {
        return line;
      }
    }
    return null;
  }

  // Check if line is likely a merchant name
  isLikelyMerchantName(line) {
    // Skip if contains numbers that look like phone/address
    if (/^\d+/.test(line) || /\d{3,}/.test(line)) return false;
    // Skip if too short or contains special chars
    if (line.length < 3 || /[#@$%^&*()_+=\[\]{}|\\:";'<>?,./]/.test(line)) return false;
    // Skip common receipt headers
    const skipWords = ['receipt', 'invoice', 'bill', 'tax', 'gst', 'total', 'subtotal'];
    if (skipWords.some(word => line.toLowerCase().includes(word))) return false;
    
    return true;
  }

  // Extract total amount from receipt
  extractTotalAmount(lines) {
    const amountPatterns = [
      /total[:\s]*₹?[\s]*(\d+\.?\d*)/i,
      /grand total[:\s]*₹?[\s]*(\d+\.?\d*)/i,
      /amount[:\s]*₹?[\s]*(\d+\.?\d*)/i,
      /₹[\s]*(\d+\.?\d*)/,
      /(\d+\.\d{2})$/
    ];

    // Search from bottom up for total
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      for (const pattern of amountPatterns) {
        const match = line.match(pattern);
        if (match) {
          const amount = parseFloat(match[1]);
          if (amount > 0 && amount < 100000) { // Reasonable range
            return amount;
          }
        }
      }
    }

    return null;
  }

  // Extract date from receipt
  extractDate(lines) {
    const datePatterns = [
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
      /(\d{1,2}\s+\w+\s+\d{2,4})/,
      /(\d{2,4}[-\/]\d{1,2}[-\/]\d{1,2})/
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          const dateStr = match[1];
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        }
      }
    }

    return new Date(); // Default to current date
  }

  // Extract items from receipt
  extractItems(lines) {
    const items = [];
    const itemPatterns = [
      /^(.+?)\s+₹?(\d+\.?\d*)$/,
      /^(.+?)\s+(\d+\.?\d*)\s*$/,
      /(\w+.*?)\s+₹?(\d+\.?\d*)$/
    ];

    for (const line of lines) {
      // Skip header/footer lines
      if (this.isHeaderFooterLine(line)) continue;

      for (const pattern of itemPatterns) {
        const match = line.match(pattern);
        if (match) {
          const itemName = match[1].trim();
          const itemPrice = parseFloat(match[2]);
          
          if (itemName.length > 2 && itemPrice > 0 && itemPrice < 10000) {
            items.push({
              name: itemName,
              price: itemPrice
            });
            break;
          }
        }
      }
    }

    return items;
  }

  // Check if line is header/footer
  isHeaderFooterLine(line) {
    const skipPatterns = [
      /thank you/i,
      /visit again/i,
      /customer copy/i,
      /merchant copy/i,
      /gst|tax/i,
      /phone|tel|mobile/i,
      /address/i,
      /^\d+$/,
      /^-+$/
    ];

    return skipPatterns.some(pattern => pattern.test(line));
  }

  // Categorize receipt based on merchant and items
  categorizeReceipt(merchantName, items) {
    const merchant = (merchantName || '').toLowerCase();
    const itemNames = items.map(item => item.name.toLowerCase()).join(' ');
    const allText = `${merchant} ${itemNames}`;

    // Category keywords
    const categories = {
      'Food & Dining': ['restaurant', 'cafe', 'food', 'pizza', 'burger', 'coffee', 'tea', 'meal', 'lunch', 'dinner', 'breakfast'],
      'Shopping': ['store', 'shop', 'mall', 'market', 'retail', 'clothes', 'shirt', 'shoes', 'bag'],
      'Transportation': ['fuel', 'petrol', 'diesel', 'gas', 'taxi', 'uber', 'ola', 'transport'],
      'Healthcare': ['pharmacy', 'medical', 'hospital', 'clinic', 'medicine', 'doctor', 'health'],
      'Entertainment': ['movie', 'cinema', 'theater', 'game', 'entertainment', 'ticket'],
      'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'mobile', 'recharge', 'bill']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }

  // Generate description from merchant and items
  generateDescription(merchantName, items) {
    if (items.length === 0) {
      return `Purchase at ${merchantName || 'Unknown Merchant'}`;
    }

    if (items.length === 1) {
      return `${items[0].name} at ${merchantName || 'Store'}`;
    }

    if (items.length <= 3) {
      const itemNames = items.map(item => item.name).join(', ');
      return `${itemNames} at ${merchantName || 'Store'}`;
    }

    return `${items.length} items at ${merchantName || 'Store'}`;
  }

  // Process multiple receipts in batch
  async processBatchReceipts(imageBuffers) {
    const results = [];
    
    for (const imageBuffer of imageBuffers) {
      try {
        const textResult = await this.extractTextFromImage(imageBuffer);
        if (textResult.success) {
          const parseResult = this.parseReceiptText(textResult.text);
          results.push(parseResult);
        } else {
          results.push({ success: false, error: textResult.error });
        }
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = new ReceiptOCRService();
