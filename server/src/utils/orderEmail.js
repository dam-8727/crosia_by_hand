const { transporter, emailEnabled, emailUser } = require('../config/mailer');

function currency(n) {
  return `\u20B9${n}`;
}

function buildHtml(order, customerName) {
  const rows = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${currency(
            i.price * i.qty
          )}</td>
        </tr>`
    )
    .join('');

  const s = order.shipping;
  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (Paid)';

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#3d2b1f;">
    <div style="text-align:center;padding:20px 0;">
      <h1 style="margin:0;font-size:22px;color:#a9744f;">Crosia by Hand</h1>
      <p style="margin:4px 0 0;font-size:12px;letter-spacing:1px;color:#8a7a6a;">EVERY LOOP MADE WITH LOVE</p>
    </div>
    <div style="background:#fbf6ef;border:1px solid #eaddcd;border-radius:10px;padding:24px;">
      <h2 style="margin:0 0 8px;font-size:18px;">Thank you for your order, ${customerName}!</h2>
      <p style="margin:0 0 16px;color:#6b5b4b;">Your order has been confirmed. Here are the details:</p>

      <p style="margin:0 0 4px;"><strong>Order ID:</strong> ${order._id}</p>
      <p style="margin:0 0 16px;"><strong>Payment:</strong> ${paymentLabel}</p>

      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-radius:6px;overflow:hidden;">
        <thead>
          <tr style="background:#f3e9dd;">
            <th style="padding:8px 12px;text-align:left;font-size:13px;">Item</th>
            <th style="padding:8px 12px;text-align:center;font-size:13px;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:13px;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:10px 12px;text-align:right;font-weight:bold;">Total</td>
            <td style="padding:10px 12px;text-align:right;font-weight:bold;">${currency(order.amount)}</td>
          </tr>
        </tfoot>
      </table>

      <h3 style="margin:20px 0 6px;font-size:15px;">Shipping to</h3>
      <p style="margin:0;color:#6b5b4b;line-height:1.5;">
        ${s.fullName}<br/>
        ${s.address}, ${s.city} - ${s.pincode}<br/>
        Phone: ${s.phone}
      </p>
    </div>
    <p style="text-align:center;color:#8a7a6a;font-size:12px;margin:20px 0;">
      This is an automated confirmation from Crosia by Hand.
    </p>
  </div>`;
}

// Best-effort: never throws — email failures must not break order placement.
async function sendOrderConfirmation(order, toEmail, customerName) {
  if (!emailEnabled) return;
  try {
    await transporter.sendMail({
      from: `"Crosia by Hand" <${emailUser}>`,
      to: toEmail,
      subject: `Order Confirmed - ${order._id}`,
      html: buildHtml(order, customerName || 'there'),
    });
    console.log(`Order confirmation email sent to ${toEmail}`);
  } catch (err) {
    console.error('Order confirmation email failed:', err.message);
  }
}

const statusMessages = {
  shipped: {
    subject: 'Your order is on the way!',
    heading: 'Your order has been shipped',
    line: 'Good news! Your order is on its way and will reach you soon.',
  },
  delivered: {
    subject: 'Your order has been delivered',
    heading: 'Your order has been delivered',
    line: 'Your order has been delivered. We hope you love it! Thank you for shopping with us.',
  },
};

function buildStatusHtml(order, customerName, status) {
  const msg = statusMessages[status];
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#3d2b1f;">
    <div style="text-align:center;padding:20px 0;">
      <h1 style="margin:0;font-size:22px;color:#a9744f;">Crosia by Hand</h1>
      <p style="margin:4px 0 0;font-size:12px;letter-spacing:1px;color:#8a7a6a;">EVERY LOOP MADE WITH LOVE</p>
    </div>
    <div style="background:#fbf6ef;border:1px solid #eaddcd;border-radius:10px;padding:24px;">
      <h2 style="margin:0 0 8px;font-size:18px;">Hi ${customerName},</h2>
      <h3 style="margin:0 0 10px;font-size:16px;color:#a9744f;">${msg.heading}</h3>
      <p style="margin:0 0 16px;color:#6b5b4b;">${msg.line}</p>
      <p style="margin:0 0 4px;"><strong>Order ID:</strong> ${order._id}</p>
      <p style="margin:0;"><strong>Total:</strong> ${currency(order.amount)}</p>
    </div>
    <p style="text-align:center;color:#8a7a6a;font-size:12px;margin:20px 0;">
      This is an automated update from Crosia by Hand.
    </p>
  </div>`;
}

// Best-effort status-change email (only for shipped / delivered).
async function sendStatusUpdate(order, toEmail, customerName, status) {
  if (!emailEnabled) return;
  if (!statusMessages[status]) return;
  try {
    await transporter.sendMail({
      from: `"Crosia by Hand" <${emailUser}>`,
      to: toEmail,
      subject: `${statusMessages[status].subject} - ${order._id}`,
      html: buildStatusHtml(order, customerName || 'there', status),
    });
    console.log(`Order ${status} email sent to ${toEmail}`);
  } catch (err) {
    console.error('Order status email failed:', err.message);
  }
}

module.exports = { sendOrderConfirmation, sendStatusUpdate };
