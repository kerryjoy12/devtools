/**
 * DevForge Tools - Pure Client-Side Tools Engine
 * 100% private in-browser formatters, minifiers, encoders, and generators.
 * Zero telemetry, zero uploads, zero dependencies.
 */

(function(global) {
  'use strict';

  // =========================================================================
  // 1. JSON ENGINE
  // =========================================================================
  const JSONEngine = {
    validate(input) {
      if (typeof input !== 'string' || input.trim() === '') {
        return {
          valid: false,
          error: {
            message: 'Input is empty. Paste or type valid JSON to validate.',
            line: 1,
            column: 1
          }
        };
      }

      try {
        const parsed = JSON.parse(input);
        return {
          valid: true,
          data: parsed,
          stats: {
            type: Array.isArray(parsed) ? 'Array' : typeof parsed === 'object' && parsed !== null ? 'Object' : typeof parsed,
            keysCount: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 1,
            byteSize: new Blob([input]).size
          }
        };
      } catch (err) {
        // Compute line and column
        let line = 1;
        let column = 1;
        let errorMsg = err.message || 'SyntaxError: Invalid JSON';

        // Check if error message provides position or context snippet
        const posMatch = errorMsg.match(/at position (\d+)/i) || errorMsg.match(/position (\d+)/i);
        const snippetMatch = errorMsg.match(/\.\.\.([\s\S]+?)(?="?\s*is not valid JSON|$)/);
        const lineMatch = errorMsg.match(/line (\d+) column (\d+)/i);

        if (posMatch) {
          const position = parseInt(posMatch[1], 10);
          const lines = input.slice(0, position).split('\n');
          line = lines.length;
          column = lines[lines.length - 1].length + 1;
        } else if (lineMatch) {
          line = parseInt(lineMatch[1], 10);
          column = parseInt(lineMatch[2], 10);
        } else if (snippetMatch) {
          const rawSnip = snippetMatch[1].trim();
          const cleanToken = rawSnip.replace(/[^\w]/g, '');
          const position = cleanToken ? input.indexOf(cleanToken) : input.indexOf(rawSnip);
          if (position !== -1) {
            const lines = input.slice(0, position).split('\n');
            line = lines.length;
            column = lines[lines.length - 1].length + 1;
          }
        }

        return {
          valid: false,
          error: {
            message: errorMsg,
            line,
            column
          }
        };
      }
    },

    format(input, indent = 2, sortKeys = false) {
      const validation = this.validate(input);
      if (!validation.valid) {
        throw new Error(`Line ${validation.error.line}, Column ${validation.error.column}: ${validation.error.message}`);
      }

      let data = validation.data;
      if (sortKeys) {
        data = this.sortObjectKeys(data);
      }

      const indentStr = indent === 'tab' ? '\t' : ' '.repeat(Number(indent) || 2);
      return JSON.stringify(data, null, indentStr);
    },

    minify(input) {
      const validation = this.validate(input);
      if (!validation.valid) {
        throw new Error(`Line ${validation.error.line}, Column ${validation.error.column}: ${validation.error.message}`);
      }
      return JSON.stringify(validation.data);
    },

    sortObjectKeys(obj) {
      if (Array.isArray(obj)) {
        return obj.map(item => this.sortObjectKeys(item));
      } else if (obj !== null && typeof obj === 'object') {
        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
          sorted[key] = this.sortObjectKeys(obj[key]);
        });
        return sorted;
      }
      return obj;
    },

    renderTreeHtml(data, keyName = null, isLast = true) {
      const isArr = Array.isArray(data);
      const isObj = data !== null && typeof data === 'object';

      if (!isObj) {
        let valClass = 'tree-null';
        let valText = 'null';
        if (typeof data === 'string') {
          valClass = 'tree-string';
          valText = JSON.stringify(data);
        } else if (typeof data === 'number') {
          valClass = 'tree-number';
          valText = String(data);
        } else if (typeof data === 'boolean') {
          valClass = 'tree-boolean';
          valText = String(data);
        }
        return `
          <div class="tree-item">
            ${keyName !== null ? `<span class="tree-key">"${escapeHtml(keyName)}"</span><span class="tree-colon">: </span>` : ''}
            <span class="${valClass}">${escapeHtml(valText)}</span>${isLast ? '' : '<span class="tree-comma">,</span>'}
          </div>
        `;
      }

      const keys = Object.keys(data);
      const count = keys.length;
      const openBracket = isArr ? '[' : '{';
      const closeBracket = isArr ? ']' : '}';

      let childrenHtml = '';
      keys.forEach((key, index) => {
        const lastChild = index === keys.length - 1;
        childrenHtml += this.renderTreeHtml(data[key], isArr ? null : key, lastChild);
      });

      return `
        <div class="tree-node expanded">
          <div class="tree-node-header" onclick="this.parentElement.classList.toggle('expanded')">
            <span class="tree-toggle" aria-hidden="true">▼</span>
            ${keyName !== null ? `<span class="tree-key">"${escapeHtml(keyName)}"</span><span class="tree-colon">: </span>` : ''}
            <span class="tree-bracket">${openBracket}</span>
            <span class="tree-badge">${count} ${count === 1 ? 'item' : 'items'}</span>
          </div>
          <div class="tree-node-children">
            ${childrenHtml}
          </div>
          <div class="tree-node-footer">
            <span class="tree-bracket">${closeBracket}</span>${isLast ? '' : '<span class="tree-comma">,</span>'}
          </div>
        </div>
      `;
    }
  };

  // =========================================================================
  // 2. HTML MINIFIER ENGINE
  // =========================================================================
  const HTMLMinifierEngine = {
    minify(html, options = {}) {
      if (!html || typeof html !== 'string') {
        return {
          minified: '',
          originalSize: 0,
          minifiedSize: 0,
          savedBytes: 0,
          percentSaved: 0
        };
      }

      const opts = Object.assign({
        removeComments: true,
        collapseWhitespace: true,
        removeOptionalTags: false,
        removeQuotes: false,
        preservePres: true
      }, options);

      const originalSize = new Blob([html]).size;
      const preservedTokens = [];

      // Tokenize and preserve content inside <pre>, <textarea>, <script>, and <style>
      let processed = html.replace(/<(pre|textarea|script|style)(\b[^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, content) => {
        const id = `___DEVFORGE_PRESERVE_${preservedTokens.length}___`;
        preservedTokens.push({
          id,
          tag,
          attrs,
          content
        });
        return id;
      });

      // 1. Remove comments (except conditional comments e.g. <!--[if ...]-->)
      if (opts.removeComments) {
        processed = processed.replace(/<!--(?!\s*\[if)[\s\S]*?-->/gi, '');
      }

      // 2. Collapse whitespace outside tags and between tags
      if (opts.collapseWhitespace) {
        // Collapse whitespace around block level tags safely
        processed = processed.replace(/>\s+</g, '> <');
        // Collapse multiple whitespace characters into a single space
        processed = processed.replace(/\s+/g, ' ');
        // Trim leading and trailing spaces
        processed = processed.trim();
        // Remove spaces inside tag brackets e.g. < div > to <div>
        processed = processed.replace(/<\s+/g, '<').replace(/\s+>/g, '>');
      }

      // 3. Remove optional closing tags if enabled
      if (opts.removeOptionalTags) {
        processed = processed.replace(/<\/(li|dt|dd|tr|th|td|p)>/gi, '');
      }

      // 4. Remove unneeded attribute quotes if enabled (safe alphanumeric values)
      if (opts.removeQuotes) {
        processed = processed.replace(/=(["][a-zA-Z0-9_\-:]+["])/g, (match, val) => {
          return '=' + val.slice(1, -1);
        });
      }

      // Restore preserved blocks
      for (let i = 0; i < preservedTokens.length; i++) {
        const token = preservedTokens[i];
        let restoredContent = token.content;

        // If it's script or style, do safe trim
        if (token.tag.toLowerCase() === 'script' || token.tag.toLowerCase() === 'style') {
          restoredContent = restoredContent.trim();
        }

        const restoredTag = `<${token.tag}${token.attrs}>${restoredContent}</${token.tag}>`;
        processed = processed.replace(token.id, restoredTag);
      }

      const minifiedSize = new Blob([processed]).size;
      const savedBytes = Math.max(0, originalSize - minifiedSize);
      const percentSaved = originalSize > 0 ? ((savedBytes / originalSize) * 100).toFixed(1) : '0.0';

      return {
        minified: processed,
        originalSize,
        minifiedSize,
        savedBytes,
        percentSaved
      };
    }
  };

  // =========================================================================
  // 3. CSS BEAUTIFIER & MINIFIER ENGINE
  // =========================================================================
  const CSSBeautifierEngine = {
    beautify(css, options = {}) {
      if (!css || typeof css !== 'string') return '';

      const indentStr = options.indent === '4' ? '    ' : options.indent === 'tab' ? '\t' : '  ';
      const preservedTokens = [];

      // Protect comments, strings, and url(...) values
      let processed = css.replace(/url\(([\s\S]*?)\)|("[\s\S]*?")|('[\s\S]*?')|(\/\*[\s\S]*?\*\/)/gi, (match) => {
        const id = `___DEVFORGE_CSS_${preservedTokens.length}___`;
        preservedTokens.push(match);
        return id;
      });

      // Normalize spaces around brackets, colons, semicolons
      processed = processed
        .replace(/\s+/g, ' ')
        .replace(/\s*{\s*/g, ' {\n')
        .replace(/\s*}\s*/g, '\n}\n')
        .replace(/\s*;\s*/g, ';\n')
        .replace(/\s*:\s*/g, ': ')
        .replace(/\s*,\s*/g, ', ')
        .trim();

      // Format indentation properly handling nested blocks (@media, @keyframes)
      const lines = processed.split('\n');
      let depth = 0;
      const formattedLines = [];

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('}')) {
          depth = Math.max(0, depth - 1);
        }

        const indent = indentStr.repeat(depth);
        formattedLines.push(indent + line);

        if (line.endsWith('{')) {
          depth++;
        }
      }

      let result = formattedLines.join('\n');

      // Restore comments, strings, and URLs
      for (let i = 0; i < preservedTokens.length; i++) {
        result = result.replace(`___DEVFORGE_CSS_${i}___`, preservedTokens[i]);
      }

      return result;
    },

    minify(css) {
      if (!css || typeof css !== 'string') {
        return {
          minified: '',
          originalSize: 0,
          minifiedSize: 0,
          savedBytes: 0,
          percentSaved: 0
        };
      }

      const originalSize = new Blob([css]).size;
      const preservedTokens = [];

      // Protect strings and url(...) values
      let processed = css.replace(/url\(([\s\S]*?)\)|("[\s\S]*?")|('[\s\S]*?')/gi, (match) => {
        const id = `___DEVFORGE_CSSMIN_${preservedTokens.length}___`;
        preservedTokens.push(match);
        return id;
      });

      // Strip comments
      processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');

      // Collapse whitespace around punctuation
      processed = processed
        .replace(/\s+/g, ' ')
        .replace(/\s*([\{\}\:\;\,])\s*/g, '$1')
        .replace(/;\}/g, '}') // Remove trailing semicolons
        .trim();

      // Restore strings and URLs
      for (let i = 0; i < preservedTokens.length; i++) {
        processed = processed.replace(`___DEVFORGE_CSSMIN_${i}___`, preservedTokens[i]);
      }

      const minifiedSize = new Blob([processed]).size;
      const savedBytes = Math.max(0, originalSize - minifiedSize);
      const percentSaved = originalSize > 0 ? ((savedBytes / originalSize) * 100).toFixed(1) : '0.0';

      return {
        minified: processed,
        originalSize,
        minifiedSize,
        savedBytes,
        percentSaved
      };
    }
  };

  // =========================================================================
  // 4. BASE64 ENGINE (UTF-8 Safe)
  // =========================================================================
  const Base64Engine = {
    encode(text, options = {}) {
      if (typeof text !== 'string') return '';
      const opts = Object.assign({ urlSafe: false, stripPadding: false }, options);

      // Safe UTF-8 encoding supporting emojis, CJK, accents
      const encoder = new TextEncoder();
      const bytes = encoder.encode(text);
      let binString = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binString += String.fromCharCode(bytes[i]);
      }

      let b64 = btoa(binString);

      if (opts.urlSafe) {
        b64 = b64.replace(/\+/g, '-').replace(/\//g, '_');
      }

      if (opts.stripPadding) {
        b64 = b64.replace(/=+$/, '');
      }

      return b64;
    },

    decode(b64, options = {}) {
      if (typeof b64 !== 'string') return '';
      let cleaned = b64.trim().replace(/\s+/g, '');

      if (!cleaned) return '';

      // Support URL-safe base64
      cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');

      // Re-pad if needed
      while (cleaned.length % 4 !== 0) {
        cleaned += '=';
      }

      // Validate base64 format
      const validB64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
      if (!validB64Regex.test(cleaned)) {
        throw new Error('Invalid Base64 sequence: contains unsupported characters or invalid padding.');
      }

      try {
        const binString = atob(cleaned);
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) {
          bytes[i] = binString.charCodeAt(i);
        }

        const decoder = new TextDecoder('utf-8', { fatal: true });
        return decoder.decode(bytes);
      } catch (err) {
        // If not valid UTF-8, return latin1 representation with warning
        try {
          return atob(cleaned);
        } catch (e) {
          throw new Error('Failed to decode Base64 string: ' + err.message);
        }
      }
    },

    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        if (!file) {
          reject(new Error('No file provided'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const dataUri = reader.result;
          const commaIndex = dataUri.indexOf(',');
          const base64Only = commaIndex !== -1 ? dataUri.substring(commaIndex + 1) : dataUri;

          resolve({
            dataUri,
            base64: base64Only,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream'
          });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    }
  };

  // =========================================================================
  // 5. URL ENCODER/DECODER ENGINE
  // =========================================================================
  const URLEngine = {
    encode(text, mode = 'component') {
      if (typeof text !== 'string') return '';
      if (mode === 'full') {
        return encodeURI(text);
      }
      return encodeURIComponent(text);
    },

    decode(text, mode = 'component') {
      if (typeof text !== 'string') return '';
      try {
        if (mode === 'full') {
          return decodeURI(text);
        }
        return decodeURIComponent(text);
      } catch (err) {
        throw new Error(`Malformed URI sequence: ${err.message}. Check for incomplete '%' escape tokens.`);
      }
    },

    parseQuery(input) {
      if (!input || typeof input !== 'string') {
        return { baseUrl: '', params: [] };
      }

      let urlStr = input.trim();
      let baseUrl = '';
      let queryString = '';

      const qIndex = urlStr.indexOf('?');
      if (qIndex !== -1) {
        baseUrl = urlStr.substring(0, qIndex);
        queryString = urlStr.substring(qIndex + 1);
        const hashIndex = queryString.indexOf('#');
        if (hashIndex !== -1) {
          queryString = queryString.substring(0, hashIndex);
        }
      } else if (urlStr.includes('=') || urlStr.includes('&')) {
        queryString = urlStr;
      } else {
        return { baseUrl: urlStr, params: [] };
      }

      const params = [];
      const pairs = queryString.split('&');

      for (let pair of pairs) {
        if (!pair) continue;
        const eqIndex = pair.indexOf('=');
        let rawKey = '';
        let rawVal = '';

        if (eqIndex !== -1) {
          rawKey = pair.substring(0, eqIndex);
          rawVal = pair.substring(eqIndex + 1);
        } else {
          rawKey = pair;
          rawVal = '';
        }

        let decodedKey = rawKey;
        let decodedVal = rawVal;
        try {
          decodedKey = decodeURIComponent(rawKey.replace(/\+/g, ' '));
        } catch (e) {}
        try {
          decodedVal = decodeURIComponent(rawVal.replace(/\+/g, ' '));
        } catch (e) {}

        params.push({
          rawKey,
          rawValue: rawVal,
          key: decodedKey,
          value: decodedVal
        });
      }

      return { baseUrl, params };
    },

    buildUrl(baseUrl, params) {
      if (!params || params.length === 0) return baseUrl || '';

      const queryParts = params
        .filter(p => p.key && p.key.trim() !== '')
        .map(p => {
          const encodedKey = encodeURIComponent(p.key);
          const encodedVal = encodeURIComponent(p.value || '');
          return `${encodedKey}=${encodedVal}`;
        });

      if (queryParts.length === 0) return baseUrl || '';

      const queryString = queryParts.join('&');
      if (!baseUrl) return queryString;

      return baseUrl.includes('?') ? `${baseUrl}&${queryString}` : `${baseUrl}?${queryString}`;
    }
  };

  // =========================================================================
  // 6. UUID GENERATOR ENGINE (RFC 4122 v4 & RFC 9562 v7)
  // =========================================================================
  const UUIDEngine = {
    generateV4(options = {}) {
      const opts = Object.assign({ uppercase: false, hyphens: true, braces: false }, options);

      let uuidStr = '';
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' && !opts.uppercase && opts.hyphens && !opts.braces) {
        uuidStr = crypto.randomUUID();
      } else {
        const bytes = new Uint8Array(16);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          crypto.getRandomValues(bytes);
        } else {
          for (let i = 0; i < 16; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
          }
        }

        // Set version 4 (0100 in high 4 bits of byte 6)
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        // Set variant RFC 4122 (10 in high 2 bits of byte 8)
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = [];
        for (let i = 0; i < 16; i++) {
          hex.push(bytes[i].toString(16).padStart(2, '0'));
        }

        uuidStr = [
          hex.slice(0, 4).join(''),
          hex.slice(4, 6).join(''),
          hex.slice(6, 8).join(''),
          hex.slice(8, 10).join(''),
          hex.slice(10, 16).join('')
        ].join('-');
      }

      return this.formatUUID(uuidStr, opts);
    },

    generateV7(options = {}) {
      const opts = Object.assign({ uppercase: false, hyphens: true, braces: false }, options);

      const bytes = new Uint8Array(16);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < 16; i++) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
      }

      // 48-bit timestamp in milliseconds
      const now = Date.now();
      bytes[0] = (now / 0x10000000000) & 0xff;
      bytes[1] = (now / 0x100000000) & 0xff;
      bytes[2] = (now / 0x1000000) & 0xff;
      bytes[3] = (now / 0x10000) & 0xff;
      bytes[4] = (now / 0x100) & 0xff;
      bytes[5] = now & 0xff;

      // Set version 7 (0111 in high 4 bits of byte 6)
      bytes[6] = (bytes[6] & 0x0f) | 0x70;
      // Set variant RFC 4122 (10 in high 2 bits of byte 8)
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      const hex = [];
      for (let i = 0; i < 16; i++) {
        hex.push(bytes[i].toString(16).padStart(2, '0'));
      }

      const uuidStr = [
        hex.slice(0, 4).join(''),
        hex.slice(4, 6).join(''),
        hex.slice(6, 8).join(''),
        hex.slice(8, 10).join(''),
        hex.slice(10, 16).join('')
      ].join('-');

      return this.formatUUID(uuidStr, opts);
    },

    formatUUID(uuidStr, opts) {
      let result = uuidStr;
      if (!opts.hyphens) {
        result = result.replace(/-/g, '');
      }
      if (opts.uppercase) {
        result = result.toUpperCase();
      } else {
        result = result.toLowerCase();
      }
      if (opts.braces) {
        result = `{${result}}`;
      }
      return result;
    },

    generateBulk(count, version = 'v4', options = {}) {
      const safeCount = Math.max(1, Math.min(1000, parseInt(count, 10) || 1));
      const list = [];
      const generator = version === 'v7' ? () => this.generateV7(options) : () => this.generateV4(options);

      for (let i = 0; i < safeCount; i++) {
        list.push(generator());
      }
      return list;
    },

    isValid(uuidStr, version = null) {
      if (!uuidStr || typeof uuidStr !== 'string') return false;
      const clean = uuidStr.replace(/^\{/, '').replace(/\}$/, '').toLowerCase();

      if (version === 'v4' || version === 4) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(clean);
      }
      if (version === 'v7' || version === 7) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(clean);
      }
      // Any valid RFC UUID
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(clean);
    }
  };

  // Helper utility
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Export to global scope
  global.DevForgeTools = {
    JSONEngine,
    HTMLMinifierEngine,
    CSSBeautifierEngine,
    Base64Engine,
    URLEngine,
    UUIDEngine,
    escapeHtml
  };

})(typeof window !== 'undefined' ? window : globalThis);
