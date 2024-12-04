import { join } from 'path'

// Base paths
export const FONTS_PATH = join(process.cwd(), 'node_modules', 'pdfkit', 'js', 'data')

// Font configurations
export const FONTS = {
  helvetica: {
    normal: join(FONTS_PATH, 'Helvetica.afm'),
    bold: join(FONTS_PATH, 'Helvetica-Bold.afm'),
    italic: join(FONTS_PATH, 'Helvetica-Oblique.afm'),
    boldItalic: join(FONTS_PATH, 'Helvetica-BoldOblique.afm')
  }
} as const 