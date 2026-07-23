const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable');

try {
  const doc = new jsPDF();
  
  const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAABQElEQVR4nO2XvUoDQRSFz2wSRRtrSytLQa1EwUbQRiT4CD6AvZ1Y+gI+hU+gYGEjVhFEERsttNJG/GEnY2Z1A+6uJDu7swsH/uByFvY799w7M0MoKCgoKPymSA7IgU9G9C/Y3jA2jWNj2PZhM8aWse0Y28a2Y2wbx8YwNo1jY9j2YTPGlrHtGNvGsWkcG8P2f61FckUOT3JGDt6L16U1XjLwJcZ75EwkD2TvnfhMWrNFDh6K74YckV0gB2/Fe8uaLHKQit8H2SGH4m2RNW3w/c+o1hD+C8Qj8bbImnK49/g38Y60ZoscmOKfQnZ705o2eErj78e70houeAje61O3743Yg6fmD1zL1z4j89YQngQf8kXOTGsuuALvlY2671/EDlzJlx8j81Yf3vH3y1dE8k0Onv+j95p0VlBQUFBQUOgbnNolYc0bQz4AAAAASUVORK5CYII=";
  
  doc.addImage(LOGO_BASE64, 'PNG', 14, 15, 10, 10);
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text("STORE REPORT", 30, 22);
  
  autoTable(doc, {
    head: [['Col 1', 'Col 2']],
    body: [['Val 1', 'Val 2']],
  });
  
  console.log("Success");
} catch (e) {
  console.error("Error:", e);
}
