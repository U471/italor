const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter using environment variables.
 * Supports SendGrid (via SMTP) and any generic SMTP provider.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Sends a verification email to a newly registered user.
 *
 * @param {object} options
 * @param {string} options.toEmail - Recipient email address
 * @param {string} options.firstName - Recipient first name
 * @param {string} options.verificationToken - Raw (unhashed) verification token
 * @returns {Promise<void>}
 */
async function sendVerificationEmail({ toEmail, firstName, verificationToken }) {
  const transporter = createTransporter();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const fromAddress = process.env.EMAIL_FROM || 'noreply@italor.com';

  const mailOptions = {
    from: `"iTailor" <${fromAddress}>`,
    to: toEmail,
    subject: 'Verify your iTailor account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Welcome to iTailor, ${firstName}!</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          Thank you for registering. Please verify your email address by clicking the button below.
          This link will expire in <strong>24 hours</strong>.
        </p>
        <a
          href="${verificationLink}"
          style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 16px 0;"
        >
          Verify Email Address
        </a>
        <p style="color: #8a8a8a; font-size: 14px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #8a8a8a; font-size: 12px;">
          If the button above doesn't work, copy and paste this link into your browser:<br />
          <a href="${verificationLink}" style="color: #4a90e2;">${verificationLink}</a>
        </p>
      </div>
    `,
    text: `Welcome to iTailor, ${firstName}!\n\nVerify your email address by visiting:\n${verificationLink}\n\nThis link expires in 24 hours.`,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Sends a password reset email to a user.
 *
 * @param {object} options
 * @param {string} options.toEmail - Recipient email address
 * @param {string} options.firstName - Recipient first name
 * @param {string} options.resetToken - Raw (unhashed) password reset token
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail({ toEmail, firstName, resetToken }) {
  const transporter = createTransporter();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const fromAddress = process.env.EMAIL_FROM || 'noreply@italor.com';

  const mailOptions = {
    from: `"iTailor" <${fromAddress}>`,
    to: toEmail,
    subject: 'Reset your iTailor password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Reset your password, ${firstName}</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          We received a request to reset your iTailor account password.
          Click the button below to choose a new password.
          This link will expire in <strong>1 hour</strong>.
        </p>
        <a
          href="${resetLink}"
          style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 16px 0;"
        >
          Reset Password
        </a>
        <p style="color: #8a8a8a; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will not change.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #8a8a8a; font-size: 12px;">
          If the button above doesn't work, copy and paste this link into your browser:<br />
          <a href="${resetLink}" style="color: #4a90e2;">${resetLink}</a>
        </p>
      </div>
    `,
    text: `Reset your iTailor password\n\nClick the link below to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request this, ignore this email.`,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Builds an HTML string representing the suit configuration summary.
 *
 * @param {object} suitConfig
 * @returns {string}
 */
function formatSuitConfig(suitConfig) {
  if (!suitConfig || typeof suitConfig !== 'object') return '';
  const lines = [];
  if (suitConfig.style?.breasting) lines.push(`Style: ${suitConfig.style.breasting}-breasted`);
  if (suitConfig.lapel?.style) lines.push(`Lapel: ${suitConfig.lapel.style}`);
  if (suitConfig.lining?.color) lines.push(`Lining: ${suitConfig.lining.color}`);
  if (suitConfig.buttons?.count) lines.push(`Buttons: ${suitConfig.buttons.count}`);
  if (suitConfig.vent?.style) lines.push(`Vent: ${suitConfig.vent.style}`);
  return lines.join(' · ');
}

/**
 * Generates a PDF invoice Buffer for the given order using pdfkit.
 *
 * @param {object} order - Populated order document
 * @param {string} customerName - Customer's full name
 * @returns {Promise<Buffer>} PDF binary
 */
async function generateInvoicePdf(order, customerName) {
  // eslint-disable-next-line global-require
  const PDFDocument = require('pdfkit');
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('iTailor', 50, 50)
      .fontSize(10)
      .font('Helvetica')
      .text('Custom Made-to-Measure Suits', 50, 80)
      .text('hello@italor.com', 50, 93)
      .moveDown(2);

    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Invoice', { align: 'right' })
      .fontSize(10)
      .font('Helvetica');

    doc
      .text(`Order Number: ${order.orderNumber}`, { align: 'right' })
      .text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB')}`, { align: 'right' })
      .text(`Status: ${order.status}`, { align: 'right' })
      .moveDown(2);

    // Bill To
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Bill To:')
      .fontSize(10)
      .font('Helvetica')
      .text(customerName || order.shippingAddress?.fullName || '')
      .text(order.shippingAddress?.line1 || '')
      .text(order.shippingAddress?.line2 || '')
      .text(`${order.shippingAddress?.city || ''}${order.shippingAddress?.postalCode ? ', ' + order.shippingAddress.postalCode : ''}`)
      .text(order.shippingAddress?.country || '')
      .moveDown(2);

    // Items table header
    const tableTop = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Item', 50, tableTop)
      .text('Qty', 380, tableTop, { width: 50, align: 'right' })
      .text('Unit Price', 430, tableTop, { width: 60, align: 'right' })
      .text('Total', 490, tableTop, { width: 60, align: 'right' });

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    let currentY = tableTop + 25;

    (order.items || []).forEach((item) => {
      const itemName = item.fabricName || 'Custom Suit';
      const config = formatSuitConfig(item.suitConfig);
      const lineTotal = (item.unitPrice * item.quantity).toFixed(2);

      doc
        .font('Helvetica')
        .fontSize(10)
        .text(itemName, 50, currentY)
        .text(String(item.quantity), 380, currentY, { width: 50, align: 'right' })
        .text(`£${item.unitPrice.toFixed(2)}`, 430, currentY, { width: 60, align: 'right' })
        .text(`£${lineTotal}`, 490, currentY, { width: 60, align: 'right' });

      if (config) {
        currentY += 15;
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#888888')
          .text(config, 50, currentY)
          .fillColor('#000000');
      }

      currentY += 25;
    });

    // Totals
    doc
      .moveTo(50, currentY)
      .lineTo(550, currentY)
      .stroke();

    currentY += 10;
    const totalsX = 430;

    const totalsRows = [
      { label: 'Subtotal', value: `£${order.subtotal?.toFixed(2)}` },
      ...(order.discountAmount > 0 ? [{ label: `Discount${order.promoCode ? ' (' + order.promoCode + ')' : ''}`, value: `-£${order.discountAmount?.toFixed(2)}` }] : []),
      { label: 'Shipping', value: `£${order.shippingCost?.toFixed(2)}` },
      ...(order.taxAmount > 0 ? [{ label: 'Tax', value: `£${order.taxAmount?.toFixed(2)}` }] : []),
    ];

    totalsRows.forEach((row) => {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(row.label, totalsX, currentY, { width: 60 })
        .text(row.value, 490, currentY, { width: 60, align: 'right' });
      currentY += 18;
    });

    // Total
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Paid', totalsX, currentY, { width: 60 })
      .text(`£${order.total?.toFixed(2)}`, 490, currentY, { width: 60, align: 'right' });

    // Footer
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#888888')
      .text('Thank you for your order with iTailor. Your bespoke suit is being crafted with care.', 50, 750, { align: 'center' });

    doc.end();
  });
}

/**
 * Sends an order confirmation email with a PDF invoice attachment.
 *
 * @param {object} options
 * @param {string} options.toEmail - Customer email
 * @param {string} options.firstName - Customer first name
 * @param {object} options.order - Order document
 * @returns {Promise<void>}
 */
async function sendOrderConfirmationEmail({ toEmail, firstName, order }) {
  const transporter = createTransporter();
  const fromAddress = process.env.EMAIL_FROM || 'noreply@italor.com';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const estimatedDelivery = new Date(
    new Date(order.createdAt || Date.now()).getTime() + 35 * 24 * 60 * 60 * 1000
  ).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Build items HTML
  const itemsHtml = (order.items || [])
    .map((item) => {
      const config = formatSuitConfig(item.suitConfig);
      return `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <strong>${item.fabricName || 'Custom Suit'}</strong>
          ${config ? `<br/><span style="color: #888; font-size: 12px;">${config}</span>` : ''}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">£${(item.unitPrice * item.quantity).toFixed(2)}</td>
      </tr>`;
    })
    .join('');

  const discountRow = order.discountAmount > 0
    ? `<tr><td colspan="2" style="padding: 4px 0; color: #16a34a;">Discount${order.promoCode ? ' (' + order.promoCode + ')' : ''}</td><td style="padding: 4px 0; text-align: right; color: #16a34a;">-£${order.discountAmount.toFixed(2)}</td></tr>`
    : '';

  const taxRow = order.taxAmount > 0
    ? `<tr><td colspan="2" style="padding: 4px 0;">Tax</td><td style="padding: 4px 0; text-align: right;">£${order.taxAmount.toFixed(2)}</td></tr>`
    : '';

  const { shippingAddress: addr } = order;
  const addrStr = addr
    ? [addr.fullName, addr.line1, addr.line2, `${addr.city}${addr.state ? ', ' + addr.state : ''} ${addr.postalCode}`, addr.country]
        .filter(Boolean)
        .join('<br/>')
    : '';

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #1a1a1a; padding: 24px 32px;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">iTailor</h1>
        <p style="color: #aaaaaa; font-size: 14px; margin: 4px 0 0;">Custom Made-to-Measure Suits</p>
      </div>

      <div style="padding: 32px;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Order Confirmed!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for your order. We're thrilled to be crafting your bespoke suit!</p>

        <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 4px;"><strong>Order Number:</strong> <span style="font-family: monospace; font-size: 16px;">${order.orderNumber}</span></p>
          <p style="margin: 0 0 4px;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
          <p style="margin: 0;"><a href="${frontendUrl}/orders/${order._id}/confirmation" style="color: #2563eb;">View Order Details</a></p>
        </div>

        <h3 style="border-bottom: 2px solid #e5e5e5; padding-bottom: 8px;">Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="color: #888;">
              <th style="text-align: left; padding: 4px 0; font-weight: 600; font-size: 13px;">Item</th>
              <th style="text-align: center; padding: 4px 0; font-weight: 600; font-size: 13px;">Qty</th>
              <th style="text-align: right; padding: 4px 0; font-weight: 600; font-size: 13px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr><td colspan="2" style="padding: 8px 0;">Subtotal</td><td style="padding: 8px 0; text-align: right;">£${order.subtotal?.toFixed(2)}</td></tr>
            ${discountRow}
            <tr><td colspan="2" style="padding: 4px 0;">Shipping</td><td style="padding: 4px 0; text-align: right;">£${order.shippingCost?.toFixed(2)}</td></tr>
            ${taxRow}
            <tr style="font-size: 16px; font-weight: bold; border-top: 2px solid #1a1a1a;">
              <td colspan="2" style="padding: 12px 0;">Total Paid</td>
              <td style="padding: 12px 0; text-align: right;">£${order.total?.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <h3 style="border-bottom: 2px solid #e5e5e5; padding-bottom: 8px;">Shipping To</h3>
        <p style="line-height: 1.8;">${addrStr}</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #166534;">Your invoice is attached to this email as a PDF. Please keep it for your records.</p>
        </div>

        <p style="color: #4a4a4a; font-size: 14px;">
          If you have any questions, reply to this email or contact us at
          <a href="mailto:support@italor.com" style="color: #2563eb;">support@italor.com</a>.
        </p>
      </div>

      <div style="background: #f5f5f5; padding: 16px 32px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} iTailor. All rights reserved.
        </p>
      </div>
    </div>
  `;

  // Generate PDF invoice
  let pdfBuffer;
  try {
    pdfBuffer = await generateInvoicePdf(order, firstName);
  } catch (pdfErr) {
    // Non-fatal: send email without PDF attachment if generation fails
    pdfBuffer = null;
  }

  const attachments = pdfBuffer
    ? [{ filename: `iTailor-Invoice-${order.orderNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    : [];

  await transporter.sendMail({
    from: `"iTailor" <${fromAddress}>`,
    to: toEmail,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html: htmlBody,
    text: `Hi ${firstName},\n\nYour iTailor order ${order.orderNumber} has been confirmed!\nTotal paid: £${order.total?.toFixed(2)}\nEstimated delivery: ${estimatedDelivery}\n\nView your order: ${frontendUrl}/orders/${order._id}/confirmation`,
    attachments,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendOrderConfirmationEmail };
