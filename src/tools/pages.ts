import { runAppleScript } from '../utils';
import { z } from 'zod';

/**
 * Pages tool schema definitions
 */
const InsertTextSchema = z.object({
  text: z.string().describe('Text to insert into the document'),
});

const AppendTextSchema = z.object({
  text: z.string().describe('Text to append to the document'),
});

const FormatTextSchema = z.object({
  paragraph: z.number().positive().describe('Paragraph number to format'),
  alignment: z.enum(['left', 'center', 'right', 'justify']).describe('Text alignment'),
  fontSize: z.number().optional().describe('Font size'),
  fontName: z.string().optional().describe('Font name'),
  bold: z.boolean().optional().describe('Bold formatting'),
  italic: z.boolean().optional().describe('Italic formatting'),
});

const InsertParagraphSchema = z.object({
  text: z.string().describe('Text for the new paragraph'),
  position: z.enum(['beginning', 'end']).default('end').describe('Position to insert paragraph'),
});

const CreateDocumentSchema = z.object({
  template: z.string().optional().describe('Template to use'),
});

/**
 * Pages tool implementation
 */
export const pagesTools = [
  {
    name: 'pages_insert_text',
    description: 'Inserts text into a Pages document, replacing any existing content',
    parameters: InsertTextSchema,
    handler: async ({ text }) => {
      const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const script = `
        tell application "Pages"
          if not documents exists then make new document
          tell document 1
            set body text to "${escapedText}"
          end tell
          return "Text inserted successfully"
        end tell
      `;
      
      try {
        const result = await runAppleScript(script);
        return { success: true, message: result };
      } catch (e) {
        return { success: false, error: `Failed to insert text: ${e.message}` };
      }
    }
  },
  
  {
    name: 'pages_append_text',
    description: 'Appends text to the end of a Pages document',
    parameters: AppendTextSchema,
    handler: async ({ text }) => {
      const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const script = `
        tell application "Pages"
          if not documents exists then make new document
          tell document 1
            set currentText to body text
            set body text to currentText & "${escapedText}"
          end tell
          return "Text appended successfully"
        end tell
      `;
      
      try {
        const result = await runAppleScript(script);
        return { success: true, message: result };
      } catch (e) {
        return { success: false, error: `Failed to append text: ${e.message}` };
      }
    }
  },
  
  {
    name: 'pages_format_text',
    description: 'Formats a paragraph in a Pages document',
    parameters: FormatTextSchema,
    handler: async ({ paragraph, alignment, fontSize, fontName, bold, italic }) => {
      let formattingProperties = `alignment:"${alignment}"`;
      
      if (fontSize) formattingProperties += `, font size:${fontSize}`;
      if (fontName) formattingProperties += `, font:"${fontName}"`;
      if (bold !== undefined) formattingProperties += `, bold:${bold}`;
      if (italic !== undefined) formattingProperties += `, italic:${italic}`;
      
      const script = `
        tell application "Pages"
          if not documents exists then error "No document is open"
          tell document 1
            set properties of paragraph ${paragraph} to {${formattingProperties}}
          end tell
          return "Formatting applied successfully"
        end tell
      `;
      
      try {
        const result = await runAppleScript(script);
        return { success: true, message: result };
      } catch (e) {
        return { success: false, error: `Failed to format text: ${e.message}` };
      }
    }
  },
  
  {
    name: 'pages_insert_paragraph',
    description: 'Inserts a new paragraph at the beginning or end of a Pages document',
    parameters: InsertParagraphSchema,
    handler: async ({ text, position }) => {
      const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const script = `
        tell application "Pages"
          if not documents exists then make new document
          tell document 1
            make new paragraph at ${position} with data "${escapedText}"
          end tell
          return "Paragraph inserted successfully"
        end tell
      `;
      
      try {
        const result = await runAppleScript(script);
        return { success: true, message: result };
      } catch (e) {
        return { success: false, error: `Failed to insert paragraph: ${e.message}` };
      }
    }
  },
  
  {
    name: 'pages_create_document',
    description: 'Creates a new Pages document',
    parameters: CreateDocumentSchema,
    handler: async ({ template }) => {
      let script;
      
      if (template) {
        const escapedTemplate = template.replace(/"/g, '\\"');
        script = `
          tell application "Pages"
            make new document with properties {template:"${escapedTemplate}"}
            return "Document created with template: ${escapedTemplate}"
          end tell
        `;
      } else {
        script = `
          tell application "Pages"
            make new document
            return "New document created"
          end tell
        `;
      }
      
      try {
        const result = await runAppleScript(script);
        return { success: true, message: result };
      } catch (e) {
        return { success: false, error: `Failed to create document: ${e.message}` };
      }
    }
  }
];

export default pagesTools;