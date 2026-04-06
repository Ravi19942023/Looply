import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax/svg";

/**
 * SURGICAL MATHJAX PLUGIN
 * 
 * This version is the most robust yet. It performs "Deep Splitting" of text nodes
 * to find and isolate math patterns like (V_{...}) or naked \text commands
 * without breaking the surrounding regular text.
 */

// Handle ESM/CJS interop
const resolvePlugin = (plugin: any) => {
  if (!plugin) return null;
  if (typeof plugin === "function") return plugin;
  if (plugin.default && typeof plugin.default === "function") return plugin.default;
  return null;
};

const ResolvedRemarkMath = resolvePlugin(remarkMath);
const ResolvedRehypeMathjax = resolvePlugin(rehypeMathjax);

/**
 * Advanced transformer that performs surgical splitting of text nodes.
 */
const surgicalMathTransformer = () => (tree: any) => {
  const traverse = (node: any) => {
    if (!node.children || !Array.isArray(node.children)) return;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Handle Code Blocks early
      if (child.type === "code") {
        const lang = (child.lang || "").toLowerCase();
        if (lang === "math" || lang === "latex" || lang === "tex") {
          child.type = "math";
          delete child.lang;
          delete child.meta;
          continue;
        }
      }

      // Surgical Text Splitting
      if (child.type === "text") {
        const value = child.value || "";
        
        // 1. Look for parentheses-wrapped math like ( V_{object} )
        // 2. Look for naked commands like \text{m}^3
        // 3. Look for naked superscripts in units like m^3 (aggressive)
        const pattern = /(\((?:[^)]*[\\_^][^)]*)\))|(\\[a-zA-Z]+\{?[^}]*\}?)|(\b[a-zA-Z]\^[0-9]\b)/g;
        
        let lastIndex = 0;
        let match;
        const newNodes = [];

        while ((match = pattern.exec(value)) !== null) {
          // Add text before the match
          if (match.index > lastIndex) {
            newNodes.push({ type: "text", value: value.slice(lastIndex, match.index) });
          }

          let mathContent = match[0];
          // Strip parentheses if they were the wrapper
          if (mathContent.startsWith("(") && mathContent.endsWith(")")) {
            mathContent = mathContent.slice(1, -1);
          }

          newNodes.push({ type: "inlineMath", value: mathContent.trim() });
          lastIndex = pattern.lastIndex;
        }

        // Add remaining text
        if (lastIndex < value.length) {
          newNodes.push({ type: "text", value: value.slice(lastIndex) });
        }

        // If we found math, replace the single text node with our new sequence
        if (newNodes.length > 0) {
          node.children.splice(i, 1, ...newNodes);
          i += newNodes.length - 1; // Skip the nodes we just added
        }
        continue;
      }

      // Handle block-level healing (Alignment wrap)
      if (child.type === "math") {
        const v = child.value || "";
        if ((v.includes("&") || v.includes("\\\\")) && !v.includes("\\begin{") && !v.includes("\\end{")) {
          child.value = `\\begin{aligned}${v}\\end{aligned}`;
        }
      }

      // Recurse
      traverse(child);
    }
  };

  traverse(tree);
};

export const mathjaxPlugin: any = {
  name: "katex",
  type: "math",
  remarkPlugin: [
    function (this: any, options: any) {
      if (ResolvedRemarkMath) ResolvedRemarkMath.call(this, options);
      return surgicalMathTransformer();
    },
    { singleDollar: true },
  ],
  rehypePlugin: [
    ResolvedRehypeMathjax,
    {
      tex: {
        tags: "ams",
        processEnvironments: true,
      },
      svg: {
        fontCache: "none",
        scale: 1.25,
      },
    },
  ],
  getStyles: () => `
    .math-display { overflow-x: auto; margin: 1em 0; min-height: 1em; }
    .math-inline { display: inline-block; padding: 0 0.1em; }
    mjx-container > svg { color: inherit; fill: currentColor; }
    mjx-container { transform: translateZ(0); }
    .mathjax-error { font-size: 0.8em; color: #ee3333; white-space: pre-wrap; }
  `,
};
