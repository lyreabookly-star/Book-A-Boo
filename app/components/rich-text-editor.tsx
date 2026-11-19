"use client";

import { useEffect, useRef, useState } from "react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Minus, Plus, Underline } from "lucide-react";

type Props = { content: string; chapterId: string; locale?: string; onChange: (value: string) => void };

export function RichTextEditor({ content, chapterId, locale = "fr", onChange }: Props) {
  const tx = (fr: string, en: string, es: string, pt: string) => locale === "en" ? en : locale === "es" ? es : locale === "pt" ? pt : fr;
  const editor = useRef<HTMLDivElement>(null);
  const [font, setFont] = useState("Georgia");
  const [size, setSize] = useState("16");

  useEffect(() => {
    try {
      setFont(localStorage.getItem("bab-editor-font") || "Georgia");
      setSize(localStorage.getItem("bab-editor-size") || "16");
    } catch {
      // Keep readable defaults when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (!editor.current) return;
    const value = content || "";
    if (/<\/?[a-z][\s\S]*>/i.test(value)) editor.current.innerHTML = value;
    else editor.current.innerHTML = value.split(/\n{2,}/).map(part => "<p>" + part.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>") + "</p>").join("");
  }, [chapterId]);

  function sync() { if (editor.current) onChange(editor.current.innerHTML); }
  function command(name: string, value?: string) {
    editor.current?.focus();
    document.execCommand(name, false, value);
    sync();
  }
  function remember(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch {
      // Formatting still works for this session if storage is unavailable.
    }
  }
  function setFontFamily(value: string) {
    setFont(value);
    remember("bab-editor-font", value);
    command("fontName", value);
  }
  function setFontSize(value: string) {
    setSize(value);
    remember("bab-editor-size", value);
    editor.current?.focus();
    document.execCommand("fontSize", false, "7");
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (editor.current && range) {
      editor.current.querySelectorAll('font[size="7"]').forEach(node => {
        try {
          if (!range.intersectsNode(node)) return;
        } catch { return; }
        const span = document.createElement("span");
        span.style.fontSize = value + "px";
        while (node.firstChild) span.appendChild(node.firstChild);
        node.replaceWith(span);
      });
    }
    sync();
  }
  function stepSize(direction: number) {
    const values = [12,14,16,18,20,22,24];
    const index = values.indexOf(Number(size));
    setFontSize(String(values[Math.max(0, Math.min(values.length - 1, index + direction))]));
  }

  return <div className="rich-editor">
    <div className="writer-font-toolbar">
      <label>{tx("Police","Font","Fuente","Fonte")} <select value={font} onChange={e => setFontFamily(e.target.value)}>
        <option>Georgia</option><option>Arial</option><option>Times New Roman</option><option>Garamond</option><option>Verdana</option><option>Courier New</option><option>Trebuchet MS</option><option>Palatino Linotype</option>
      </select></label>
      <div className="writer-format-actions" aria-label={tx("Mise en forme","Formatting","Formato","Formatação")}>
        <button type="button" title={tx("Gras","Bold","Negrita","Negrito")} aria-label={tx("Gras","Bold","Negrita","Negrito")} onMouseDown={e=>e.preventDefault()} onClick={()=>command("bold")}><Bold size={16}/></button>
        <button type="button" title={tx("Italique","Italic","Cursiva","Itálico")} aria-label={tx("Italique","Italic","Cursiva","Itálico")} onMouseDown={e=>e.preventDefault()} onClick={()=>command("italic")}><Italic size={16}/></button>
        <button type="button" title={tx("Souligné","Underline","Subrayado","Sublinhado")} aria-label={tx("Souligné","Underline","Subrayado","Sublinhado")} onMouseDown={e=>e.preventDefault()} onClick={()=>command("underline")}><Underline size={16}/></button>
        <span className="writer-toolbar-separator"/>
        <button type="button" title={tx("Aligner à gauche","Align left","Alinear a la izquierda","Alinhar à esquerda")} aria-label={tx("Aligner à gauche","Align left","Alinear a la izquierda","Alinhar à esquerda")} onMouseDown={e=>e.preventDefault()} onClick={()=>command("justifyLeft")}><AlignLeft size={16}/></button>
        <button type="button" title={tx("Centrer","Center","Centrar","Centralizar")} aria-label={tx("Centrer","Center","Centrar","Centralizar")} onMouseDown={e=>e.preventDefault()} onClick={()=>command("justifyCenter")}><AlignCenter size={16}/></button>
        <button type="button" title={tx("Aligner à droite","Align right","Alinear a la derecha","Alinhar à direita")} aria-label={tx("Aligner à droite","Align right","Alinear a la derecha","Alinhar à direita")} onMouseDown={e=>e.preventDefault()} onClick={()=>command("justifyRight")}><AlignRight size={16}/></button>
        <button type="button" title={tx("Justifier","Justify","Justificar","Justificar")} aria-label={tx("Justifier","Justify","Justificar","Justificar")} onMouseDown={e=>e.preventDefault()} onClick={()=>command("justifyFull")}><AlignJustify size={16}/></button>
        <span className="writer-toolbar-separator"/>
        <button type="button" title={tx("Diminuer la taille","Decrease font size","Reducir tamaño","Diminuir tamanho")} aria-label={tx("Diminuer la taille","Decrease font size","Reducir tamaño","Diminuir tamanho")} onMouseDown={e=>e.preventDefault()} onClick={()=>stepSize(-1)}><Minus size={16}/></button>
        <select aria-label={tx("Taille du texte","Text size","Tamaño del texto","Tamanho do texto")} value={size} onChange={e=>setFontSize(e.target.value)}>{[12,14,16,18,20,22,24].map(n=><option key={n} value={n}>{n}px</option>)}</select>
        <button type="button" title={tx("Augmenter la taille","Increase font size","Aumentar tamaño","Aumentar tamanho")} aria-label={tx("Augmenter la taille","Increase font size","Aumentar tamaño","Aumentar tamanho")} onMouseDown={e=>e.preventDefault()} onClick={()=>stepSize(1)}><Plus size={16}/></button>
      </div>
    </div>
    <div ref={editor} className="writer-manuscript writer-rich-manuscript" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" onInput={sync} onBlur={sync} data-placeholder={tx("Votre histoire commence ici…","Your story begins here…","Tu historia comienza aquí…","Sua história começa aqui…")} style={{fontFamily:font,fontSize:size+"px"}}/>
  </div>;
}
