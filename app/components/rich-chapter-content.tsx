"use client";

import { useEffect, useState } from "react";

const allowedTags = new Set(["P","DIV","BR","STRONG","B","EM","I","U","SPAN","H1","H2","H3","BLOCKQUOTE","UL","OL","LI"]);

function cleanMarkup(value: string) {
  if (!/<\/?[a-z][\s\S]*>/i.test(value)) {
    return value.split(/\n{2,}/).map(part => "<p>" + part.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>") + "</p>").join("");
  }
  const doc = new DOMParser().parseFromString(value, "text/html");
  doc.body.querySelectorAll("*").forEach(node => {
    if (node.tagName === "FONT") {
      const span = doc.createElement("span");
      span.innerHTML = node.innerHTML;
      const face = node.getAttribute("face") || "";
      const fontSize = ({"1":"10px","2":"13px","3":"16px","4":"18px","5":"24px","6":"32px","7":"48px"} as Record<string,string>)[node.getAttribute("size") || ""];
      span.style.fontFamily = face;
      if (fontSize) span.style.fontSize = fontSize;
      node.replaceWith(span);
      return;
    }
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }
    const element = node as HTMLElement;
    const style = element.style;
    const align = style.textAlign;
    const family = style.fontFamily;
    const size = style.fontSize;
    element.removeAttribute("style");
    element.removeAttribute("class");
    element.removeAttribute("id");
    if (["left","center","right","justify"].includes(align)) element.style.textAlign = align;
    if (/^[a-z0-9 ,'"-]+$/i.test(family)) element.style.fontFamily = family;
    if (/^\d+(px|pt|em|rem)$/.test(size)) element.style.fontSize = size;
    Array.from(element.attributes).forEach(attr => { if (attr.name !== "style") element.removeAttribute(attr.name); });
  });
  doc.body.querySelectorAll("font").forEach(node => {
    const span = doc.createElement("span");
    span.innerHTML = node.innerHTML;
    span.style.fontSize = ({"1":"10px","2":"13px","3":"16px","4":"18px","5":"24px","6":"32px","7":"48px"} as Record<string,string>)[node.getAttribute("size") || ""] || "16px";
    node.replaceWith(span);
  });
  return doc.body.innerHTML;
}

export function RichChapterContent({ content }: { content: string }) {
  const [html, setHtml] = useState("");
  useEffect(() => { setHtml(cleanMarkup(content)); }, [content]);
  return <div className="story-rich-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
