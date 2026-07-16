import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType, ExternalHyperlink } from "docx";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { marked, Token } from 'marked';

const parseInlineTokens = (tokens: any[]): any[] => {
  if (!tokens) return [];
  return tokens.map(token => {
    if (token.type === 'strong') {
      return new TextRun({ text: token.text, bold: true });
    } else if (token.type === 'em') {
      return new TextRun({ text: token.text, italics: true });
    } else if (token.type === 'link') {
      return new ExternalHyperlink({
        children: [
          new TextRun({ text: token.text, color: "0000FF", underline: {} })
        ],
        link: token.href
      });
    } else {
      return new TextRun({ text: token.raw || token.text });
    }
  });
};

export const documentService = {
  async exportToDocx(content: string, filename: string) {
    try {
      const tokens = marked.lexer(content);
      const docElements: any[] = [];

      tokens.forEach((token) => {
        if (token.type === 'heading') {
          const level = token.depth === 1 ? HeadingLevel.HEADING_1 :
                        token.depth === 2 ? HeadingLevel.HEADING_2 :
                        token.depth === 3 ? HeadingLevel.HEADING_3 :
                        token.depth === 4 ? HeadingLevel.HEADING_4 :
                        HeadingLevel.HEADING_5;
          docElements.push(new Paragraph({
            children: parseInlineTokens(token.tokens),
            heading: level,
            spacing: { before: 240, after: 120 },
          }));
        } else if (token.type === 'paragraph') {
          docElements.push(new Paragraph({
            children: parseInlineTokens(token.tokens),
            spacing: { after: 120 },
            alignment: AlignmentType.JUSTIFIED,
          }));
        } else if (token.type === 'list') {
          token.items.forEach((item: any) => {
            docElements.push(new Paragraph({
              children: parseInlineTokens(item.tokens[0]?.tokens || [{ type: 'text', text: item.text }]),
              bullet: { level: 0 },
              spacing: { after: 60 },
            }));
          });
        } else if (token.type === 'table') {
          const rows = [];
          
          // Header
          const headerCells = token.header.map((cell: any) => {
            return new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cell.text, bold: true })] })],
              shading: { fill: "F2F2F2" },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            });
          });
          rows.push(new TableRow({ children: headerCells, tableHeader: true }));

          // Body
          token.rows.forEach((row: any) => {
            const cells = row.map((cell: any) => {
              return new TableCell({
                children: [new Paragraph({ children: parseInlineTokens(cell.tokens) })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
              });
            });
            rows.push(new TableRow({ children: cells }));
          });

          docElements.push(new Table({
            rows: rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
          }));
          docElements.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacing after table
        }
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: docElements,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to DOCX:", error);
      alert("Erro ao exportar documento. Tente novamente.");
    }
  },

  exportToPdf(content: string, filename: string) {
    const doc = new jsPDF();
    
    // Basic text wrapping
    const splitText = doc.splitTextToSize(content.replace(/\*\*/g, '').replace(/#/g, ''), 180);
    
    let y = 10;
    for (let i = 0; i < splitText.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      doc.text(splitText[i], 10, y);
      y += 7;
    }

    doc.save(`${filename}.pdf`);
  },

  exportToXlsx(data: any[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pesquisa de Preços");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
};
