import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// -------------------------------------------------------------
// CURRENCY & FORMATTING HELPERS
// -------------------------------------------------------------
const formatCurrencyHelper = (amount: number, currency: string = 'PKR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
};

// Convert image URL to base64 canvas-style helper
export const preloadImageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve('');
      return;
    }
    // Handle data URIs directly
    if (url.startsWith('data:')) {
      resolve(url);
      return;
    }
    
    let fullUrl = url;
    if (!url.startsWith('http') && !url.startsWith('data:')) {
      const isLogo = url.startsWith('/logo.png') || url === 'logo.png';
      const base = isLogo
        ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        : (typeof window !== 'undefined'
            ? (process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3002')
            : 'http://localhost:3002');
      fullUrl = `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
          return;
        }
      } catch (e) {
        console.error('Canvas conversion error:', e);
      }
      resolve('');
    };
    img.onerror = () => {
      resolve('');
    };
    img.src = fullUrl;
    setTimeout(() => {
      resolve('');
    }, 2000); // 2 second timeout max
  });
};

// Preload multiple images in parallel
export const preloadAllImages = async (urls: string[]): Promise<Record<string, string>> => {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  const results = await Promise.all(
    uniqueUrls.map(async (url) => {
      const base64 = await preloadImageToBase64(url);
      return { url, base64 };
    })
  );
  const cache: Record<string, string> = {};
  results.forEach((r) => {
    if (r.base64) {
      cache[r.url] = r.base64;
    }
  });
  return cache;
};

// Export to Excel utility
export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// -------------------------------------------------------------
// VECTOR DRAWING CHART HELPERS
// -------------------------------------------------------------
const drawLineChart = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  points: { label: string; value: number }[],
  accentColor: [number, number, number]
) => {
  const primaryColor = [15, 23, 42];
  const borderLight = [226, 232, 240];
  const lightBg = [248, 250, 252];

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h + 12, 2, 2, 'FD');

  // Top border accent bar
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(x, y, w, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(title.toUpperCase(), x + 6, y + 6);

  if (points.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('No data available', x + w / 2 - 12, y + h / 2 + 4);
    return;
  }

  const maxVal = Math.max(...points.map((p) => p.value), 10);
  const minVal = 0;
  const valRange = maxVal - minVal;

  const chartX = x + 12;
  const chartY = y + 10;
  const chartW = w - 24;
  const chartH = h - 12;

  // Draw plot area background
  doc.setFillColor(255, 255, 255);
  doc.rect(chartX, chartY, chartW, chartH, 'F');

  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.1);
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);

  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const ly = chartY + chartH - (i / gridCount) * chartH;
    doc.line(chartX, ly, chartX + chartW, ly);
    
    const val = minVal + (i / gridCount) * valRange;
    doc.text(val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0), chartX - 8, ly + 1.5);
  }

  const stepX = points.length > 1 ? chartW / (points.length - 1) : chartW;

  // Draw filled area under the line path (SaaS Area Chart style)
  if (points.length > 1) {
    const tintR = Math.min(255, accentColor[0] + (255 - accentColor[0]) * 0.85);
    const tintG = Math.min(255, accentColor[1] + (255 - accentColor[1]) * 0.85);
    const tintB = Math.min(255, accentColor[2] + (255 - accentColor[2]) * 0.85);
    doc.setFillColor(tintR, tintG, tintB);

    for (let idx = 0; idx < points.length - 1; idx++) {
      const cx1 = chartX + idx * stepX;
      const cy1 = chartY + chartH - ((points[idx].value - minVal) / valRange) * chartH;
      const cx2 = chartX + (idx + 1) * stepX;
      const cy2 = chartY + chartH - ((points[idx + 1].value - minVal) / valRange) * chartH;

      doc.triangle(cx1, chartY + chartH, cx1, cy1, cx2, cy2, 'F');
      doc.triangle(cx1, chartY + chartH, cx2, cy2, cx2, chartY + chartH, 'F');
    }
  }

  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(1.2);

  points.forEach((pt, idx) => {
    const cx = chartX + idx * stepX;
    const cy = chartY + chartH - ((pt.value - minVal) / valRange) * chartH;

    if (idx > 0) {
      const px = chartX + (idx - 1) * stepX;
      const py = chartY + chartH - ((points[idx - 1].value - minVal) / valRange) * chartH;
      doc.line(px, py, cx, cy);
    }

    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.circle(cx, cy, 0.8, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    if (points.length <= 10 || idx % 2 === 0 || idx === points.length - 1) {
      doc.text(pt.label, cx - 4, chartY + chartH + 5);
    }
  });
};

const drawBarChart = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  points: { label: string; value: number }[],
  accentColor: [number, number, number]
) => {
  const primaryColor = [15, 23, 42];
  const borderLight = [226, 232, 240];
  const lightBg = [248, 250, 252];

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h + 12, 3, 3, 'FD');

  // Top border accent bar
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(x, y, w, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(title.toUpperCase(), x + 6, y + 6);

  if (points.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('No data available', x + w / 2 - 12, y + h / 2 + 4);
    return;
  }

  const maxVal = Math.max(...points.map((p) => p.value), 10);
  const minVal = 0;
  const valRange = maxVal - minVal;

  const chartX = x + 12;
  const chartY = y + 10;
  const chartW = w - 24;
  const chartH = h - 12;

  // Draw plot area background
  doc.setFillColor(255, 255, 255);
  doc.rect(chartX, chartY, chartW, chartH, 'F');

  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.1);
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);

  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const ly = chartY + chartH - (i / gridCount) * chartH;
    doc.line(chartX, ly, chartX + chartW, ly);
    
    const val = minVal + (i / gridCount) * valRange;
    doc.text(val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0), chartX - 8, ly + 1.5);
  }

  const totalBars = points.length;
  const spacingRatio = 0.4;
  const totalBarWidth = chartW / totalBars;
  const barWidth = totalBarWidth * (1 - spacingRatio);
  const barSpacing = totalBarWidth * spacingRatio;

  points.forEach((pt, idx) => {
    const bx = chartX + idx * totalBarWidth + barSpacing / 2;
    const bH = ((pt.value - minVal) / valRange) * chartH;
    const by = chartY + chartH - bH;

    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(bx, by, barWidth, bH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const valStr = pt.value >= 1000 ? `${(pt.value / 1000).toFixed(1)}k` : pt.value.toFixed(0);
    doc.text(valStr, bx + barWidth / 2, by - 1.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    const shortLabel = pt.label.length > 8 ? pt.label.slice(0, 8) + '..' : pt.label;
    doc.text(shortLabel, bx + barWidth / 2, chartY + chartH + 5, { align: 'center' });
  });
};

const drawPageFooterHelper = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    if (i === 1) continue; // Skip cover page footer

    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    
    doc.text(`Page ${i} of ${pageCount}`, 15, h - 8);
    doc.text("Microcart: A Distributed & Secure E-Commerce Store.", w - 15, h - 8, { align: 'right' });
  }
};

// -------------------------------------------------------------
// SALES REPORT PDF GENERATION
// -------------------------------------------------------------
export const generateSalesReportPDF = async (
  title: string,
  orders: any[],
  filters: { startDate?: string; endDate?: string; vendorName?: string; category?: string; status?: string },
  currency: string = 'PKR'
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentColor: [number, number, number] = [79, 70, 229]; // Indigo 600
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50
  const borderLight: [number, number, number] = [226, 232, 240]; // Slate 200

  // Extract all product image URLs to preload
  const imageUrls: string[] = [];
  orders.forEach((o) => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach((i: any) => {
        if (i.image) imageUrls.push(i.image);
      });
    }
  });
  
  const imageCache = await preloadAllImages(imageUrls);

  // Preload local logo.png
  const logoBase64 = await preloadImageToBase64('/logo.png');

  // Compute KPI statistics up front for Page 1 Executive Summary
  const totalOrders = orders.length;

  const isOrderRevenue = (o: any) => {
    const isOnline = ['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod);
    if (isOnline) {
      return o.status !== 'cancelled' && o.status !== 'refunded';
    }
    return o.status === 'delivered';
  };

  const totalRevenue = orders
    .filter(isOrderRevenue)
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const refundAmount = orders
    .filter(o => o.status === 'refunded' || o.status === 'returned')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  let totalUnits = 0;
  const productQuantities: Record<string, number> = {};
  orders.forEach((o) => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach((item: any) => {
        totalUnits += item.quantity || 0;
        const name = item.productName || 'Unknown';
        productQuantities[name] = (productQuantities[name] || 0) + (item.quantity || 0);
      });
    }
  });

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const netRevenue = Math.max(0, totalRevenue - refundAmount);

  let bestSellingProduct = 'N/A';
  let maxQty = 0;
  Object.entries(productQuantities).forEach(([name, qty]) => {
    if (qty > maxQty) {
      maxQty = qty;
      bestSellingProduct = name;
    }
  });
  if (bestSellingProduct.length > 20) {
    bestSellingProduct = bestSellingProduct.slice(0, 20) + '...';
  }

  // 1. PAGE 1: COVER PAGE & EXECUTIVE SUMMARY
  // Header Banner Card with soft background color
  doc.setFillColor(245, 247, 255); // Soft Indigo 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 12, 180, 44, 2, 2, 'FD');

  // MicroCart Logo branding - Left aligned
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 22, 17, 22, 22);
    } catch (e) {
      console.error('Error drawing cover logo:', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('MICROCART', 50, 22);

  doc.setFontSize(7.5);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('A DISTRIBUTED & SECURE E-COMMERCE STORE', 50, 27.5);

  // Premium horizontal accent rule line
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(50, 30.5, 135, 0.8, 'F');

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('MARKETPLACE SALES REPORT', 50, 37.5);

  // Enhanced Audit Logistics Card (2x2 Grid Layout to prevent horizontal overlap)
  doc.setFillColor(252, 253, 254);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.2);
  doc.roundedRect(15, 66, 180, 22, 1.5, 1.5, 'FD');

  doc.setFillColor(148, 163, 184); // Slate 400 accent line
  doc.rect(15, 66, 180, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AUDIT LOGISTICS', 105, 71, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);

  const scope = filters.vendorName || 'Consolidated Global Marketplace';
  const displayScope = scope.length > 40 ? scope.slice(0, 38) + '..' : scope;
  
  // Row 1
  doc.text(`Scope: ${displayScope}`, 20, 77);
  doc.text(`Date Range: ${filters.startDate || 'All Time'} - ${filters.endDate || 'Present'}`, 110, 77);

  // Row 2
  doc.text(`Category: ${filters.category || 'All'} / Status: ${filters.status || 'All'}`, 20, 83);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 110, 83);

  // Sales Executive Summary section
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES EXECUTIVE SUMMARY', 15, 93);

  // Underline
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(15, 95, 195, 95);

  // 2 rows of 4 KPI cards
  const drawKpiCard = (x: number, y: number, w: number, h: number, label: string, val: string, trendLabel: string) => {
    doc.setFillColor(252, 253, 254);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

    // Accent line on top of card
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(x, y, w, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(val, x + 4, y + 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(trendLabel, x + 4, y + 16);
  };

  const cW = 42;
  const cH = 18;
  const sX = 15;
  const sY = 99;

  drawKpiCard(sX, sY, cW, cH, 'Total Orders', totalOrders.toString(), 'Order transaction count');
  drawKpiCard(sX + 46, sY, cW, cH, 'Total Revenue', formatCurrencyHelper(totalRevenue, currency), 'Gross platform volume');
  drawKpiCard(sX + 92, sY, cW, cH, 'Net Revenue', formatCurrencyHelper(netRevenue, currency), 'Revenue after refunds');
  drawKpiCard(sX + 138, sY, cW, cH, 'Units Sold', totalUnits.toString(), 'Product items shipped');

  drawKpiCard(sX, sY + 24, cW, cH, 'Avg Order Value', formatCurrencyHelper(averageOrderValue, currency), 'AOV per checkout');
  drawKpiCard(sX + 46, sY + 24, cW, cH, 'Refund Amount', formatCurrencyHelper(refundAmount, currency), 'Returned value volume');
  drawKpiCard(sX + 92, sY + 24, cW, cH, 'Cancelled Orders', cancelledOrders.toString(), 'Unfilled orders count');
  drawKpiCard(sX + 138, sY + 24, cW, cH, 'Best Seller', bestSellingProduct, 'Top volume product SKU');

  // Security Markings on Page 1
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Microcart: A Distributed & Secure E-Commerce Store.', 15, 280);

  // 2. PAGE 2: CHARTS SECTION (2x2 Grid)
  doc.addPage();
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, 210, 3, 'F');

  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES TRENDS & DATA VISUALIZATIONS', 15, 12);

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(15, 15, 195, 15);

  // Group aggregates for charts
  const dailyDataMap: Record<string, number> = {};
  const weeklyDataMap: Record<string, number> = {};
  const monthlyDataMap: Record<string, number> = {};
  let cumulativeRevenue = 0;
  const trendPoints: { label: string; value: number }[] = [];

  // Sort orders by date for time-series aggregation
  const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  sortedOrders.forEach((o) => {
    const oDate = new Date(o.createdAt);
    const dateStr = oDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const monthStr = oDate.toLocaleDateString(undefined, { month: 'short' });
    
    // Daily
    dailyDataMap[dateStr] = (dailyDataMap[dateStr] || 0) + Number(o.totalAmount);
    
    // Weekly (approx via day groups)
    const weekNum = Math.ceil(oDate.getDate() / 7);
    const weekStr = `W${weekNum} ${monthStr}`;
    weeklyDataMap[weekStr] = (weeklyDataMap[weekStr] || 0) + Number(o.totalAmount);

    // Monthly
    monthlyDataMap[monthStr] = (monthlyDataMap[monthStr] || 0) + Number(o.totalAmount);

    // Cumulative
    cumulativeRevenue += Number(o.totalAmount);
    trendPoints.push({ label: dateStr, value: cumulativeRevenue });
  });

  const dailyPoints = Object.entries(dailyDataMap).map(([label, value]) => ({ label, value })).slice(-8);
  const weeklyPoints = Object.entries(weeklyDataMap).map(([label, value]) => ({ label, value })).slice(-4);
  const monthlyPoints = Object.entries(monthlyDataMap).map(([label, value]) => ({ label, value })).slice(-6);
  const trendPointsReduced = trendPoints.filter((_, idx) => trendPoints.length <= 10 || idx % Math.ceil(trendPoints.length / 10) === 0).slice(-10);

  // Draw 2x2 Grid of vector charts
  drawLineChart(doc, 15, 25, 86, 50, 'Daily Sales', dailyPoints, [79, 70, 229]);
  drawBarChart(doc, 109, 25, 86, 50, 'Weekly Sales', weeklyPoints, [14, 116, 144]);
  drawBarChart(doc, 15, 95, 86, 50, 'Monthly Sales', monthlyPoints, [16, 185, 129]);
  drawLineChart(doc, 109, 95, 86, 50, 'Cumulative Revenue Trend', trendPointsReduced, [217, 70, 239]);

  // 4. DATA TABLE IN LANDSCAPE
  doc.addPage('a4', 'l');
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, 297, 3, 'F');

  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES TRANSACTION REGISTER', 15, 12);

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(15, 15, 282, 15);

  const columns = [
    'Image', 'Product Name', 'SKU', 'Category', 'Vendor', 'Order ID', 
    'Customer', 'Qty', 'Price', 'Discount', 'Tax', 'Shipping', 'Total', 
    'Pay Status', 'Status', 'Date'
  ];

  const rows: any[][] = [];
  orders.forEach((o) => {
    if (o.items && Array.isArray(o.items)) {
      const orderSubtotal = o.items.reduce((sum: number, item: any) => sum + (Number(item.price) * (item.quantity || 1)), 0);
      
      o.items.forEach((item: any) => {
        const itemTotal = Number(item.price) * (item.quantity || 1);
        const itemDiscount = typeof item.discount === 'number' ? item.discount : (orderSubtotal > 0 ? (itemTotal / orderSubtotal) * Number(o.discountAmount || 0) : 0);
        const itemTax = Math.max(0, (itemTotal - itemDiscount) * 15 / 115);
        const itemShipping = typeof item.shipping === 'number' ? item.shipping : 0;
        const netTotal = itemTotal - itemDiscount + itemShipping;

        rows.push([
          item.image || '', // holds image URL to render inside didDrawCell
          item.productName || 'N/A',
          item.sku || item.productId?.slice(0, 8).toUpperCase() || 'N/A',
          item.category || 'N/A',
          item.storeName || item.sellerId?.slice(-6) || 'Platform',
          `#${o.id.slice(-6)}`,
          o.buyer?.firstName ? `${o.buyer.firstName} ${o.buyer.lastName}` : 'Guest',
          item.quantity || 1,
          formatCurrencyHelper(Number(item.price), currency),
          formatCurrencyHelper(itemDiscount, currency),
          formatCurrencyHelper(itemTax, currency),
          formatCurrencyHelper(itemShipping, currency),
          formatCurrencyHelper(netTotal, currency),
          (o.paymentStatus || (o.paymentMethod === 'cash_on_delivery' ? 'UNPAID' : 'PAID')).toUpperCase(),
          o.status.toUpperCase(),
          new Date(o.createdAt).toLocaleDateString()
        ]);
      });
    }
  });

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 22,
    theme: 'grid',
    styles: {
      fontSize: 5.5,
      cellPadding: 2,
      lineColor: borderLight,
      lineWidth: 0.1,
      font: 'helvetica',
      valign: 'middle',
      overflow: 'ellipsize'
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [250, 251, 252]
    },
    columnStyles: {
      0: { cellWidth: 12 }, // Image column
      2: { cellWidth: 14 }, // SKU
      5: { cellWidth: 15 }, // Order ID
      7: { cellWidth: 10, halign: 'right' },  // Qty
      8: { cellWidth: 18, halign: 'right' }, // Price
      9: { cellWidth: 18, halign: 'right' }, // Discount
      10: { cellWidth: 16, halign: 'right' }, // Tax
      11: { cellWidth: 16, halign: 'right' }, // Shipping
      12: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }, // Total
      15: { cellWidth: 18 }  // Date
    },
    willDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        data.cell.text = [''];
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const imageUrl = data.cell.raw as string;
        const imgBase64 = imageUrl ? imageCache[imageUrl] : '';
        if (imgBase64) {
          try {
            doc.addImage(imgBase64, 'JPEG', data.cell.x + 1.5, data.cell.y + 1, 9, 7);
          } catch (e) {
            console.error('autotable image render error:', e);
          }
        } else {
          // Draw fallback shape placeholder
          doc.setFillColor(241, 245, 249);
          doc.rect(data.cell.x + 1.5, data.cell.y + 1, 9, 7, 'F');
          doc.setFontSize(4);
          doc.setTextColor(148, 163, 184);
          doc.text('NO IMG', data.cell.x + 2.5, data.cell.y + 5.5);
        }
      }
    }
  });

  drawPageFooterHelper(doc);
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

// -------------------------------------------------------------
// INVENTORY REPORT PDF GENERATION
// -------------------------------------------------------------
export const generateInventoryReportPDF = async (
  title: string,
  products: any[],
  filters: { vendorName?: string; category?: string; warehouse?: string },
  currency: string = 'PKR'
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentColor: [number, number, number] = [14, 116, 144]; // Cyan 700
  const lightBg: [number, number, number] = [248, 250, 252];
  const borderLight: [number, number, number] = [226, 232, 240];

  // Extract all images
  const imageUrls: string[] = [];
  products.forEach((p) => {
    if (p.images && p.images[0]) imageUrls.push(p.images[0]);
  });
  const featuredImageUrl = imageUrls[0] || '';
  const imageCache = await preloadAllImages(imageUrls);

  // Preload local logo.png
  const logoBase64 = await preloadImageToBase64('/logo.png');

  // 1. PAGE 1: COVER PAGE
  // Header Banner Card with soft background color
  doc.setFillColor(240, 250, 253); // Soft Cyan 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 20, 180, 44, 2, 2, 'FD');

  // MicroCart Logo branding - Left aligned
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 22, 25, 22, 22);
    } catch (e) {
      console.error('Error drawing cover logo:', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('MICROCART', 50, 30);

  doc.setFontSize(7.5);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('A DISTRIBUTED & SECURE E-COMMERCE STORE', 50, 35.5);

  // Premium horizontal accent rule line
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(50, 38.5, 135, 0.8, 'F');

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('INVENTORY ANALYSIS REPORT', 50, 45.5);

  // Cover Page Featured Product Details
  const topProduct = products[0];
  if (featuredImageUrl && imageCache[featuredImageUrl]) {
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 78, 86, 55, 1, 1, 'FD');
    try {
      doc.addImage(imageCache[featuredImageUrl], 'JPEG', 17, 80, 82, 51);
    } catch (e) {
      console.error(e);
    }
  } else {
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(15, 78, 86, 55, 1, 1, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No product visuals configured', 25, 108);
  }

  // Cover page details metadata
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(107, 78, 88, 55, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('AUDIT LOGISTICS', 113, 87);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  const scope = filters.vendorName || 'Consolidated Global Marketplace';
  doc.text(`Scope/Vendor: ${scope.length > 25 ? scope.slice(0, 25) + '..' : scope}`, 113, 96);
  doc.text(`Category:     ${filters.category || 'All Categories'}`, 113, 103);
  doc.text(`Warehouse:    ${filters.warehouse || 'Main Warehouse'}`, 113, 110);
  doc.text(`Featured SKU: ${topProduct?.sku || topProduct?.id?.slice(0, 8).toUpperCase() || 'N/A'}`, 113, 117);
  doc.text(`Generated:    ${new Date().toLocaleString()}`, 113, 124);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Microcart: A Distributed & Secure E-Commerce Store.', 15, 280);

  // 2. EXECUTIVE SUMMARY
  doc.addPage();
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, 210, 3, 'F');

  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('INVENTORY AUDIT SUMMARY', 15, 12);

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(15, 15, 195, 15);

  // Computations
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock)), 0);
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const drawInvKpiCard = (x: number, y: number, w: number, h: number, label: string, val: string, trendLabel: string) => {
    doc.setFillColor(252, 253, 254);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

    // Colored accent stripe
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(x, y, w, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(val, x + 4, y + 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(trendLabel, x + 4, y + 16);
  };

  const cardW = 54;
  const cardH = 18;
  const startX = 15;
  const startY = 25;

  drawInvKpiCard(startX, startY, cardW, cardH, 'Total Products', totalProducts.toString(), 'Unique catalog SKUs');
  drawInvKpiCard(startX + 58, startY, cardW, cardH, 'Inventory Value', formatCurrencyHelper(totalInventoryValue, currency), 'Total portfolio valuation');
  drawInvKpiCard(startX + 116, startY, cardW, cardH, 'Total Units', totalStock.toString(), 'Warehouse units');

  drawInvKpiCard(startX, startY + 24, cardW, cardH, 'Low Stock items', lowStockCount.toString(), 'Reorder threshold warning');
  drawInvKpiCard(startX + 58, startY + 24, cardW, cardH, 'Out of Stock', outOfStockCount.toString(), 'Replenishment required');
  drawInvKpiCard(startX + 116, startY + 24, cardW, cardH, 'Active Status', `${Math.round(((totalProducts - outOfStockCount) / (totalProducts || 1)) * 100)}% active`, 'Availability profile');

  // Analytics Insight Note box
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(153, 246, 228);
  doc.setLineWidth(0.2);
  doc.roundedRect(15, 75, 180, 16, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(13, 148, 136);
  doc.text('CATALOG PERFORMANCE SUMMARY:', 20, 82);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(17, 94, 89);
  doc.text(`Active catalog maintains ${totalProducts} SKUs with a combined stock layout of ${totalStock} units. The total estimated portfolio valuation sits at ${formatCurrencyHelper(totalInventoryValue, currency)}.`, 20, 87);

  // 3. CHARTS PAGE (2x2 Grid)
  doc.addPage();
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, 210, 3, 'F');

  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('INVENTORY TRENDS & CATALOG PROFILES', 15, 12);

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(15, 15, 195, 15);

  // Sort and select records for charts
  const stockTrendPoints = [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)
    .map(p => ({ label: p.name, value: p.stock }));

  const valueTrendPoints = [...products]
    .sort((a, b) => (b.stock * b.price) - (a.stock * a.price))
    .slice(0, 5)
    .map(p => ({ label: p.name, value: p.stock * p.price }));

  const fastMovingPoints = [...products]
    .filter(p => p.stock > 0)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)
    .map(p => ({ label: p.name, value: p.stock }));

  const slowMovingPoints = [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(-5)
    .map(p => ({ label: p.name, value: p.stock }));

  // Draw 2x2 Grid of charts
  drawBarChart(doc, 15, 25, 86, 50, 'Stock Levels (Top 5)', stockTrendPoints, [14, 116, 144]);
  drawBarChart(doc, 109, 25, 86, 50, 'Inventory Valuation (Top 5)', valueTrendPoints, [16, 185, 129]);
  drawBarChart(doc, 15, 95, 86, 50, 'Velocity Alert - Low Stock', fastMovingPoints, [239, 68, 68]);
  drawBarChart(doc, 109, 95, 86, 50, 'Velocity Alert - Surplus Stock', slowMovingPoints, [245, 158, 11]);

  // 4. INVENTORY DATA REGISTER TABLE IN LANDSCAPE
  doc.addPage('a4', 'l');
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, 297, 3, 'F');

  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('CATALOG INVENTORY REGISTER', 15, 12);

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(15, 15, 282, 15);

  const columns = [
    'Image', 'Product Name', 'SKU', 'Barcode', 'Category', 'Vendor', 
    'Current Stock', 'Reserved Stock', 'Available Stock', 'Reorder Lvl', 
    'Cost Price', 'Selling Price', 'Inv. Value', 'Restocked', 'Last Sold'
  ];

  const rows = products.map((p) => {
    const costPrice = p.costPrice || Number(p.price) * 0.7; // 30% margin standard fallback
    const sellingPrice = p.isOnSale && p.salePrice ? p.salePrice : p.price;
    const reserved = p.reservedStock || 0;
    const available = Math.max(0, p.stock - reserved);
    const reorderLevel = p.reorderLevel || 5;

    return [
      p.images?.[0] || '', // holds image URL to render inside didDrawCell
      p.name || 'N/A',
      p.sku || p.id.slice(0, 8).toUpperCase() || 'N/A',
      p.barcode || '890' + p.id.replace(/-/g, '').slice(0, 10),
      p.category || 'N/A',
      p.storeName || p.sellerId?.slice(-6) || 'Platform',
      p.stock || 0,
      reserved,
      available,
      reorderLevel,
      formatCurrencyHelper(costPrice, currency),
      formatCurrencyHelper(sellingPrice, currency),
      formatCurrencyHelper(Number(p.price) * Number(p.stock), currency),
      p.lastRestocked ? new Date(p.lastRestocked).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString(),
      p.lastSold ? new Date(p.lastSold).toLocaleDateString() : 'N/A'
    ];
  });

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 22,
    theme: 'grid',
    styles: {
      fontSize: 5.5,
      cellPadding: 2,
      lineColor: borderLight,
      lineWidth: 0.1,
      font: 'helvetica',
      valign: 'middle',
      overflow: 'ellipsize'
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [250, 251, 252]
    },
    columnStyles: {
      0: { cellWidth: 12 }, // Image column
      2: { cellWidth: 15 }, // SKU
      3: { cellWidth: 22 }, // Barcode
      6: { cellWidth: 14, halign: 'right' }, // Current Stock
      7: { cellWidth: 14, halign: 'right' }, // Reserved Stock
      8: { cellWidth: 14, halign: 'right' }, // Available Stock
      9: { cellWidth: 14, halign: 'right' }, // Reorder level
      10: { cellWidth: 18, halign: 'right' }, // Cost Price
      11: { cellWidth: 18, halign: 'right' }, // Selling Price
      12: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }, // Inventory Value
      13: { cellWidth: 18 }, // Last Restocked
      14: { cellWidth: 18 }  // Last Sold
    },
    willDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        data.cell.text = [''];
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const imageUrl = data.cell.raw as string;
        const imgBase64 = imageUrl ? imageCache[imageUrl] : '';
        if (imgBase64) {
          try {
            doc.addImage(imgBase64, 'JPEG', data.cell.x + 1.5, data.cell.y + 1, 9, 7);
          } catch (e) {
            console.error('autotable image render error:', e);
          }
        } else {
          doc.setFillColor(241, 245, 249);
          doc.rect(data.cell.x + 1.5, data.cell.y + 1, 9, 7, 'F');
          doc.setFontSize(4);
          doc.setTextColor(148, 163, 184);
          doc.text('NO IMG', data.cell.x + 2.5, data.cell.y + 5.5);
        }
      }
    }
  });

  drawPageFooterHelper(doc);
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

// -------------------------------------------------------------
// TRANSACTION RECEIPT PDF GENERATOR
// -------------------------------------------------------------
export const generateTransactionReceiptPDF = async (
  tx: any,
  buyerUser: any,
  order: any,
  items: any[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const emeraldColor: [number, number, number] = [16, 185, 129]; // Emerald 500
  const textDark: [number, number, number] = [30, 41, 59];
  const textGray: [number, number, number] = [100, 116, 139];
  const borderLight: [number, number, number] = [226, 232, 240];

  const receiptRef = `TRX-${(tx.id || '').slice(0, 8).toUpperCase()}`;

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 32, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MICROCART MARKETPLACE', 15, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('OFFICIAL PAYMENT RECEIPT & SLIP', 15, 22);

  // Receipt Number & Date (Right aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(52, 211, 153); // Emerald
  doc.text(`Receipt #: ${receiptRef}`, 195, 14, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${new Date(tx.createdAt).toLocaleDateString()} ${new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 195, 22, { align: 'right' });

  // Preload product images for the receipt
  const imageUrls = (items || []).map(item => item.image || item.productImage || item.images?.[0]).filter(Boolean);
  const imageCache = await preloadAllImages(imageUrls);

  // Status & Overview Block
  let currentY = 40;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(15, currentY, 180, 24, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(...textGray);
  doc.text('TOTAL AMOUNT PAID / DUE', 22, currentY + 7);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...emeraldColor);
  doc.text(`Rs. ${Number(tx.amount || 0).toFixed(2)}`, 22, currentY + 17);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`Payment Method: ${(tx.paymentMethod || 'cash_on_delivery').toUpperCase()}`, 110, currentY + 10);
  doc.text(`Payment Status: ${(tx.status || 'completed').toUpperCase()}`, 110, currentY + 17);

  currentY += 32;

  // Customer & Reference Information Boxes (Two columns)
  // Left Box: Customer Info
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, currentY, 86, 32, 2, 2, 'D');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('CUSTOMER DETAILS', 20, currentY + 7);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  const buyerName = buyerUser ? `${buyerUser.firstName} ${buyerUser.lastName}` : 'Guest Customer';
  const buyerEmail = buyerUser ? buyerUser.email : tx.userId;
  doc.text(`Name: ${buyerName}`, 20, currentY + 14);
  doc.text(`Email: ${buyerEmail}`, 20, currentY + 20);
  doc.text(`User ID: ${(tx.userId || '').slice(0, 16)}...`, 20, currentY + 26);

  // Right Box: Transaction References
  doc.roundedRect(109, currentY, 86, 32, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('REFERENCE IDENTIFIERS', 114, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  doc.text(`Transaction ID: ${(tx.id || '').slice(0, 22)}...`, 114, currentY + 14);
  doc.text(`Order ID: ${(tx.orderId || '').slice(0, 22)}...`, 114, currentY + 20);
  if (tx.transactionReference) {
    doc.text(`Gateway Ref: ${tx.transactionReference}`, 114, currentY + 26);
  }

  currentY += 38;

  // Items Table
  const tableHead = [['Img', '#', 'Product Title', 'Unit Price', 'Qty', 'Total']];
  const tableRows = (items || []).map((item: any, idx: number) => {
    const imgUrl = item.image || item.productImage || item.images?.[0] || '';
    const itemTotal = Number(item.price || 0) * (item.quantity || 1);
    return [
      imgUrl,
      (idx + 1).toString(),
      item.productName || item.title || 'Product Item',
      `Rs. ${Number(item.price || 0).toFixed(2)}`,
      (item.quantity || 1).toString(),
      `Rs. ${itemTotal.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    head: tableHead,
    body: tableRows,
    startY: currentY,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: borderLight,
      lineWidth: 0.1,
      font: 'helvetica',
      valign: 'middle'
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 80 },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 36, halign: 'right', fontStyle: 'bold' }
    },
    willDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        data.cell.text = [''];
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const imageUrl = data.cell.raw as string;
        const imgBase64 = imageUrl ? imageCache[imageUrl] : '';
        if (imgBase64) {
          try {
            doc.addImage(imgBase64, 'JPEG', data.cell.x + 1.5, data.cell.y + 1, 9, 7);
          } catch (e) {
            console.error('Receipt table image draw error:', e);
          }
        } else {
          doc.setFillColor(241, 245, 249);
          doc.rect(data.cell.x + 1.5, data.cell.y + 1, 9, 7, 'F');
          doc.setFontSize(4);
          doc.setTextColor(148, 163, 184);
          doc.text('NO IMG', data.cell.x + 2.5, data.cell.y + 5);
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 40;

  // Footer Summary & Stamp
  doc.setDrawColor(...borderLight);
  doc.line(15, finalY + 10, 195, finalY + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...textGray);
  doc.text('Thank you for choosing MicroCart Marketplace! This is an official system-generated payment receipt.', 105, finalY + 17, { align: 'center' });

  doc.save(`Receipt_${receiptRef}.pdf`);
};

