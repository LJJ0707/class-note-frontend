const d=(n,o="export.md")=>{o.endsWith(".md")||(o+=".md");const t="\uFEFF",e=new Blob([t+n],{type:"text/markdown;charset=utf-8"});c(e,o)},s=(n,o="大纲")=>{const t=`# ${o}

导出时间: ${new Date().toLocaleString("zh-CN")}

---

`;d(t+n,`${o}_${Date.now()}.md`)},c=(n,o)=>{const t=URL.createObjectURL(n),e=document.createElement("a");e.href=t,e.download=o,e.style.display="none",document.body.appendChild(e),e.click(),setTimeout(()=>{document.body.removeChild(e),URL.revokeObjectURL(t)},100)};export{s as a,d as e};
