/* Older entry URLs continue inside the registered Academy. */
(async()=>{
 'use strict';
 if(!await window.AcademyAccess.require())return;
 const kind=document.documentElement.dataset.academyEntry;
 const next=kind==='courses'?'/dashboard#paths':'/workspace.html';
 location.replace(next);
})();
