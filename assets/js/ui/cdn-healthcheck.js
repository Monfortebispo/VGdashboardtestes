
  // Verifica passados alguns segundos se as bibliotecas externas chegaram a carregar
  setTimeout(function(){
    var missing = [];
    if (typeof Chart === 'undefined') missing.push('Chart.js');
    if (typeof XLSX === 'undefined') missing.push('XLSX');
    if (missing.length) {
      var b = document.getElementById('cdnWarningBanner');
      if (b) b.style.display = 'block';
      console.error('Bibliotecas externas não carregadas:', missing.join(', '));
    }
  }, 4000);
