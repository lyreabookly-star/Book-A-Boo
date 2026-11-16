"use client";

import { useEffect, useRef, useState } from "react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Minus, Plus, Underline } from "lucide-react";

type Props = { content: string; chapterId: string; onChange: (value: string) => void };

export function RichTextEditor({ content, chapterId, onChange }: Props) {
  const editor = useRef<HTMLDivElement>(null);
  const [font, setFont] = useState("Georgia");
  const [size, setSize] = useState("16");

  useEffect(() => {
    setFont(localStorage.getItem("bab-editor-font") || "Georgia");
    setSize(localStorage.getItem("bab-editor-size") || "16");
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
  function setFontFamily(value: string) {
    setFont(value); localStorage.setItem("bab-editor-font", value); command("fontName", value);
  }
  function setFontSize(value: string) {
    setSize(value); localStorage.setItem("bab-editor-size", value);
    const n = Number(value);
    command("fontSize", n <= 14 ? "2" : n <= 16 ? "3" : n <= 18 ? "4" : n <= 22 ? "5" : n <= 28 ? "6" : "7");
  }
  function stepSize(direction: number) {
    const values = [12,14,16,18,20,22,24];
    const index = values.indexOf(Number(size));
    setFontSize(String(values[Math.max(0, Math.min(values.length - 1, index + direction))]));
  }

  return <div className="rich-editor">
    <div className="writer-font-toolbar">
      <label>Police <select value={font} onChange={e => setFontFamily(e.target.value)}>
        <option>Georgia</option><option>Arial</option><option>Times New Roman</option><option>Garamond</option><option>Verdana</option><option>Courier New</option><option>Trebuchet MS</option><option>Palatino Linotype</option>
      </select></label>
      <div className="writer-format-actions" aria-label="Mise en forme">
        <button type="button" title="Gras" aria-label="Gras" onMouseDown={e=>e.preventDefault()} onClick={()=>command("bold")}><Bold size={16}/></button>
        <button type="button" title="Italique" aria-label="Italique" onMouseDown={e=>e.preventDefault()} onClick={()=>command("italic")}><Italic size={16}/></button>
        <button type="button" title="Souligné" aria-label="Souligné" onMouseDown={e=>e.preventDefault()} onClick={()=>command("underline")}><Underline size={16}/></button>
        <span className="writer-toolbar-separator"/>
        <button type="button" title="Aligner à gauche" aria-label="Aligner à gauche" onMouseDown={e=>e.preventDefault()} onClick={()=>command("justifyLeft")}><AlignLeft size={16}/></button>
        <button type="button" title="Centrer" aria-label="Centrer" onMouseDown={e=>e.preventDefault()} onClick={()=>command("justifyCenter")}><AlignCenter size={16}/></button>
        <button type="button" title="Aligner à droite" aria-label="Aligner à droite" onMouseDown={e=>e.preventDefault()} onClick={()=>command("justifyRight")}><AlignRight size={16}/></button>
        <button type="button" title="Justifier" aria-label="Justifier" onMouseDown={e=>e.preventDefault()} onClick={()=>command("justifyFull")}><AlignJustify size={16}/></button>
        <span className="writer-toolbar-separator"/>
        <button type="button" title="Diminuer la taille" aria-label="Diminuer la taille" onMouseDown={e=>e.preventDefault()} onClick={()=>stepSize(-1)}><Minus size={16}/></button>
        <select aria-label="Taille du texte" value={size} onChange={e=>setFontSize(e.target.value)}>{[12,14,16,18,20,22,24].map(n=><option key={n} value={n}>{n}px</option>)}</select>
        <button type="button" title="Augmenter la taille" aria-label="Augmenter la taille" onMouseDown={e=>e.preventDefault()} onClick={()=>stepSize(1)}><Plus size={16}/></button>
      </div>
    </div>
    <div ref={editor} className="writer-manuscript writer-rich-manuscript" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" onInput={sync} onBlur={sync} data-placeholder="Votre histoire commence ici…" style={{fontFamily:font,fontSize:size+"px"}}/>
  </div>;
}
