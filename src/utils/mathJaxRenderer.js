/**
 * MathJax Renderer Utility
 * 
 * This utility helps render mathematical and scientific content using MathJax.
 * It dynamically loads MathJax if not already loaded and processes content
 * for proper display of math equations, chemistry formulas, and other specialized notation.
 */

// Check if MathJax is already loaded
const isMathJaxLoaded = () => {
  return window.MathJax !== undefined;
};

// Load MathJax dynamically
const loadMathJax = () => {
  return new Promise((resolve, reject) => {
    if (isMathJaxLoaded()) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    
    script.onload = () => {
      // Configure MathJax
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true,
          packages: ['base', 'ams', 'noerrors', 'noundefined']
        },
        svg: {
          fontCache: 'global'
        },
        options: {
          renderActions: {
            addMenu: [],
            checkLoading: []
          },
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
          processHtmlClass: 'math-tex'
        },
        startup: {
          pageReady: () => {
            resolve();
          }
        },
        chtml: {
          scale: 1,
          minScale: 0.5,
          matchFontHeight: true,
          mtextInheritFont: true
        }
      };
      
      // Signal that MathJax is ready to use
      document.body.classList.add('mathjax-loaded');
    };
    
    script.onerror = (error) => {
      console.error('Failed to load MathJax:', error);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Render MathJax in a given DOM element
 * 
 * @param {HTMLElement} element - The DOM element containing math content to render
 */
export const renderMathJax = async (element) => {
  if (!element) return;
  
  try {
    // Load MathJax if not already loaded
    if (!isMathJaxLoaded()) {
      await loadMathJax();
    }
    
    // Process potential chemical formulas using mhchem
    processPotentialChemicalFormulas(element);
    
    // Typeset the element with MathJax
    if (window.MathJax && window.MathJax.typesetPromise) {
      await window.MathJax.typesetPromise([element]);
    }
  } catch (error) {
    console.error('Error rendering MathJax content:', error);
  }
};

/**
 * Process potential chemical formulas in text content
 * Makes sure chemical formulas are properly formatted for MathJax
 * 
 * @param {HTMLElement} element - The DOM element to process
 */
const processPotentialChemicalFormulas = (element) => {
  // Skip if element is not provided
  if (!element) return;
  
  // Check for chemical formula patterns and wrap them with proper syntax
  const content = element.innerHTML;
  
  // Process chemical formulas with proper mhchem syntax
  const processedContent = content
    // Match patterns like "H2O", "CO2", etc. not already in math delimiters
    .replace(/(?<!\$|\\)([A-Z][a-z]?\d*)+(?!\$)/g, '\\ce{$&}')
    // Match reaction arrows → ← ⇌ ⇋
    .replace(/(?<!\$)(→|←|⇌|⇋)(?!\$)/g, '\\ce{$&}')
    // Match patterns like "2H2 + O2 → 2H2O" if not already wrapped
    .replace(/(?<!\$|\\ce\{)(\d*[A-Z][a-z]?\d*\s*[\+\-]\s*\d*[A-Z][a-z]?\d*\s*[→←⇌⇋]\s*\d*[A-Z][a-z]?\d*)(?!\$)/g, '\\ce{$&}')
    // For better formatting of subscripts in text
    .replace(/\_([0-9]+)(?!\$|\})/g, '_{$1}');
  
  // Update the element content if changes were made
  if (content !== processedContent) {
    element.innerHTML = processedContent;
  }
};

/**
 * Preload MathJax and required components
 * Call this early in your app to ensure MathJax is ready when needed
 */
export const preloadMathJax = () => {
  if (typeof window !== 'undefined') {
    loadMathJax().catch(err => {
      console.warn('Failed to preload MathJax:', err);
    });
  }
};

/**
 * Generate MathJax-formatted content for PDF export
 * 
 * @param {string} text - The text containing math to format for PDF
 * @returns {string} - Text with math formatting optimized for PDF
 */
export const formatMathForPDF = (text) => {
  if (!text) return '';
  
  // Prepare text for PDF export by ensuring math is properly formatted
  return text
    // Ensure inline math is wrapped properly
    .replace(/\$(.*?)\$/g, '\\($1\\)')
    // Ensure display math is wrapped properly
    .replace(/\$\$(.*?)\$\$/g, '\\[$1\\]')
    // Process chemical formulas
    .replace(/([A-Z][a-z]?\d*)+/g, '\\ce{$&}')
    // Format subscripts
    .replace(/\_([0-9]+)(?!\$|\})/g, '_{$1}');
};

export default {
  renderMathJax,
  preloadMathJax,
  formatMathForPDF
};