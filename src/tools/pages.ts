import { execute } from '../../utils/execute';
import { ToolDefinition } from '@modelcontextprotocol/sdk/server/types';

const execAppleScript = async (script: string): Promise<{ status: string; output: string }> => {
  try {
  return { status: 'success', output: (await execute('osascript', ['-e', script])).trim() };
  } catch (e: any) {
    return { status: 'error', output: e.message };
  }
};

const sanitize = (text: string): string => text.replace(/"/g, '\\"').replace(/\n/g, '\\n');

const pagesTools: ToolDefinition[] = [
  {
    name: 'pages_insert_text',
    description: 'Ersetzt den gesamten Text im aktiven Pages-Dokument',
    parameters: {
      properties: { text: { type: 'string', description: 'Einzufügender Text' } },
      required: ['text']
    },
    handler: async ({ text }: { text: string }) => execAppleScript(`
      tell application "Pages"
        if not (exists document 1) then make new document
        tell document 1
          set body text to "${sanitize(text)}"
        end tell
      end tell
    `)
  },
  {
    name: 'pages_append_text',
    description: 'Fügt Text am Ende des aktiven Pages-Dokuments hinzu',
    parameters: {
      properties: { text: { type: 'string', description: 'Anzuhängender Text' } },
      required: ['text']
    },
    handler: async ({ text }: { text: string }) => execAppleScript(`
      tell application "Pages"
        if not (exists document 1) then make new document
        tell document 1
          set body text to body text & "${sanitize(text)}"
        end tell
      end tell
    `)
  },
  {
    name: 'pages_create_document',
    description: 'Erstellt ein neues Pages-Dokument mit optionalem Text und Vorlage',
    parameters: {
      properties: {
        text: { type: 'string', description: 'Initialtext für das Dokument (optional)' },
        template: { type: 'string', description: 'Name der zu verwendenden Vorlage (optional)' }
      },
      required: []
    },
    handler: async ({ text, template }: { text?: string; template?: string }) => execAppleScript(`
      tell application "Pages"
        set newDoc to make new document ${template ? `with properties {template:"${sanitize(template)}"}` : ''}
        ${text ? `tell newDoc\n  set body text to "${sanitize(text)}"\nend tell` : ''}
      end tell
    `)
  },
  {
    name: 'pages_format_paragraph',
    description: 'Formatiert einen Absatz im aktiven Pages-Dokument',
    parameters: {
      properties: {
        paragraph: { type: 'number', description: 'Absatznummer (1-basiert)' },
        alignment: { type: 'string', description: 'Ausrichtung (left, center, right, justify)' },
        fontSize: { type: 'number', description: 'Schriftgröße' },
        fontName: { type: 'string', description: 'Schriftart' },
        bold: { type: 'boolean', description: 'Fettdruck' },
        italic: { type: 'boolean', description: 'Kursivschrift' }
      },
      required: ['paragraph']
    },
    handler: async ({ paragraph, alignment, fontSize, fontName, bold, italic }: 
      { paragraph: number; alignment?: string; fontSize?: number; fontName?: string; bold?: boolean; italic?: boolean }) => {
      
      const props = [
        alignment && `alignment:"${alignment}"`,
        fontSize && `font size:${fontSize}`,
        fontName && `font:"${sanitize(fontName)}"`,
        bold !== undefined && `bold:${bold}`,
        italic !== undefined && `italic:${italic}`
      ].filter(Boolean).join(', ');
      
      return props 
        ? execAppleScript(`
            tell application "Pages"
              tell document 1
                set properties of paragraph ${paragraph} to {${props}}
              end tell
            end tell
          `)
        : { status: 'error', output: 'Keine Formatierungseigenschaften angegeben' };
    }
  },
  {
    name: 'pages_insert_paragraph',
    description: 'Fügt einen neuen Absatz an bestimmter Position ein',
    parameters: {
      properties: {
        text: { type: 'string', description: 'Absatztext' },
        position: { type: 'string', description: 'Position (beginning, end, after <n>)' }
      },
      required: ['text', 'position']
    },
    handler: async ({ text, position }: { text: string; position: string }) => {
      const sanitizedText = sanitize(text);
      
      if (position === 'beginning' || position === 'end') {
        return execAppleScript(`
          tell application "Pages"
            tell document 1
              make new paragraph at ${position} with data "${sanitizedText}"
            end tell
          end tell
        `);
      } 
      
      if (position.startsWith('after ')) {
        const paraNum = parseInt(position.substring(6), 10);
        return isNaN(paraNum)
          ? { status: 'error', output: 'Ungültige Position. Format: "after <n>"' }
          : execAppleScript(`
              tell application "Pages"
                tell document 1
                  make new paragraph after paragraph ${paraNum} with data "${sanitizedText}"
                end tell
              end tell
            `);
      }
      
      return { status: 'error', output: 'Ungültige Position. Verwende "beginning", "end" oder "after <n>"' };
    }
  },
  {
    name: 'pages_get_document_text',
    description: 'Ruft den Text des aktiven Pages-Dokuments ab',
    parameters: { properties: {}, required: [] },
    handler: async () => execAppleScript(`
      tell application "Pages"
        if not (exists document 1) then return "Kein geöffnetes Dokument"
        tell document 1
          return body text
        end tell
      end tell
    `)
  }
 ];
 
 export default pagesTools;;
