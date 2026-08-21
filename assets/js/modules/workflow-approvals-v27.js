// ==========================================================
// VG DASHBOARD V27 — COMPATIBILIDADE LEGADA
// ==========================================================
// O motor visual V27 foi substituído pelo Workflow V36.
// Mantém-se este ficheiro porque versões antigas do HTML/service worker ainda o
// referenciam e porque o backend legado ops-approval continua disponível para
// compatibilidade histórica. Este ficheiro NÃO pode voltar a assumir
// window.VG.approvals nem renderizar #approvalsRoot.
(function(){
  'use strict';
  window.VG=window.VG||{};
  window.VG.approvalsLegacy=Object.assign(window.VG.approvalsLegacy||{}, {
    version:27,
    disabled:true,
    reason:'Workflow operacional transferido para V36'
  });
  // Não criar approvalsRender/approvalsOpen aqui. O V36 é o único proprietário
  // desses aliases globais e do ecrã Workflow de Aprovações.
})();
