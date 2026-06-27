import PDFDocument from "pdfkit";

export function generateInvoicePDF(order, stream) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  // Pipe to response stream
  doc.pipe(stream);

  // Logo / Brand
  doc.fillColor("#4F46E5")
     .fontSize(24)
     .font("Helvetica-Bold")
     .text("ShopSphere", 50, 50);

  doc.fillColor("#4B5563")
     .fontSize(10)
     .font("Helvetica")
     .text("Your Premium E-Commerce Store", 50, 78);

  // Invoice Title
  doc.fillColor("#111827")
     .fontSize(20)
     .font("Helvetica-Bold")
     .text("INVOICE", 400, 50, { align: "right" });

  // Invoice Meta Info
  doc.fillColor("#4B5563")
     .fontSize(9)
     .font("Helvetica")
     .text(`Invoice Number: INV-${order._id.toString().substring(0, 8).toUpperCase()}`, 400, 75, { align: "right" })
     .text(`Order ID: ${order._id}`, 400, 90, { align: "right" })
     .text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 105, { align: "right" })
     .text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 400, 120, { align: "right" })
     .text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 400, 135, { align: "right" });

  // horizontal line
  doc.moveTo(50, 160).lineTo(550, 160).strokeColor("#E5E7EB").lineWidth(1).stroke();

  // Addresses
  doc.fillColor("#111827")
     .fontSize(11)
     .font("Helvetica-Bold")
     .text("Billing Address:", 50, 180)
     .text("Shipping Address:", 300, 180);

  const address = order.shippingAddress;
  const fullName = address.fullName || (order.user?.name || "Customer");
  const phone = address.phone || "";

  doc.fillColor("#4B5563")
     .fontSize(9)
     .font("Helvetica")
     .text(fullName, 50, 200)
     .text(`Phone: ${phone}`, 50, 215)
     .text(address.street, 50, 230)
     .text(`${address.city}, ${address.state} - ${address.zipCode}`, 50, 245)
     .text(address.country, 50, 260);

  doc.fillColor("#4B5563")
     .fontSize(9)
     .font("Helvetica")
     .text(fullName, 300, 200)
     .text(`Phone: ${phone}`, 300, 215)
     .text(address.street, 300, 230)
     .text(`${address.city}, ${address.state} - ${address.zipCode}`, 300, 245)
     .text(address.country, 300, 260);

  // Line items table header
  let y = 300;
  doc.moveTo(50, y).lineTo(550, y).strokeColor("#E5E7EB").lineWidth(1).stroke();

  y += 10;
  doc.fillColor("#111827")
     .fontSize(9)
     .font("Helvetica-Bold")
     .text("Item Name", 50, y)
     .text("Qty", 320, y, { width: 30, align: "right" })
     .text("Unit Price", 370, y, { width: 80, align: "right" })
     .text("Total", 470, y, { width: 80, align: "right" });

  y += 15;
  doc.moveTo(50, y).lineTo(550, y).strokeColor("#E5E7EB").lineWidth(1).stroke();

  // Loop items
  doc.font("Helvetica").fontSize(9).fillColor("#4B5563");
  for (const item of order.orderItems) {
    y += 15;
    
    // Page break prevention
    if (y > 700) {
      doc.addPage();
      y = 50;
      // Re-draw headers on new page
      doc.fillColor("#111827")
         .fontSize(9)
         .font("Helvetica-Bold")
         .text("Item Name", 50, y)
         .text("Qty", 320, y, { width: 30, align: "right" })
         .text("Unit Price", 370, y, { width: 80, align: "right" })
         .text("Total", 470, y, { width: 80, align: "right" });
      
      y += 15;
      doc.moveTo(50, y).lineTo(550, y).strokeColor("#E5E7EB").lineWidth(1).stroke();
      y += 15;
      doc.font("Helvetica").fontSize(9).fillColor("#4B5563");
    }

    const itemTotal = item.price * item.quantity;
    
    // Item name may wrap, use text options to limit width
    doc.text(item.name, 50, y, { width: 250 })
       .text(item.quantity.toString(), 320, y, { width: 30, align: "right" })
       .text(`$${item.price.toFixed(2)}`, 370, y, { width: 80, align: "right" })
       .text(`$${itemTotal.toFixed(2)}`, 470, y, { width: 80, align: "right" });

    // In case item name wraps, adjust y based on height
    const nameHeight = doc.heightOfString(item.name, { width: 250 });
    y += Math.max(0, nameHeight - 12);
  }

  y += 20;
  doc.moveTo(50, y).lineTo(550, y).strokeColor("#E5E7EB").lineWidth(1).stroke();

  // Totals calculations
  y += 15;
  const rightColumnX = 350;
  const valueWidth = 200;

  doc.font("Helvetica").fontSize(9).fillColor("#4B5563");
  
  doc.text("Subtotal:", rightColumnX, y)
     .text(`$${order.itemsPrice.toFixed(2)}`, rightColumnX, y, { width: valueWidth, align: "right" });

  if (order.discountApplied > 0) {
    y += 15;
    doc.text(`Discount (${order.couponCode || "Coupon"}):`, rightColumnX, y)
       .text(`-$${order.discountApplied.toFixed(2)}`, rightColumnX, y, { width: valueWidth, align: "right" });
  }

  y += 15;
  doc.text("Shipping:", rightColumnX, y)
     .text(order.shippingPrice > 0 ? `$${order.shippingPrice.toFixed(2)}` : "Free", rightColumnX, y, { width: valueWidth, align: "right" });

  y += 15;
  doc.text("Tax (18%):", rightColumnX, y)
     .text(`$${order.taxPrice.toFixed(2)}`, rightColumnX, y, { width: valueWidth, align: "right" });

  y += 20;
  doc.moveTo(rightColumnX, y).lineTo(550, y).strokeColor("#E5E7EB").lineWidth(1).stroke();

  y += 10;
  doc.fillColor("#4F46E5")
     .fontSize(12)
     .font("Helvetica-Bold")
     .text("Grand Total:", rightColumnX, y)
     .text(`$${order.totalPrice.toFixed(2)}`, rightColumnX, y, { width: valueWidth, align: "right" });

  // Thank you note
  y += 40;
  if (y > 750) {
    doc.addPage();
    y = 50;
  }
  doc.fillColor("#9CA3AF")
     .fontSize(9)
     .font("Helvetica-Oblique")
     .text("Thank you for shopping with ShopSphere! If you have any questions, please contact support@shopsphere.com", 50, y, { align: "center", width: 500 });

  doc.end();
}
