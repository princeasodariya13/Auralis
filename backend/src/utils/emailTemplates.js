// Auralis Premium Email Templates

const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
            background-color: #0f172a;
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .content {
            padding: 40px;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 24px 40px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
        }
        h2 {
            font-size: 20px;
            font-weight: 600;
            margin-top: 0;
            color: #1e293b;
        }
        p {
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 24px;
            color: #334155;
        }
        .order-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
            margin-bottom: 24px;
        }
        .order-table th {
            text-align: left;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
        }
        .order-table td {
            padding: 16px 0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
        }
        .text-right {
            text-align: right !important;
        }
        .totals {
            margin-top: 24px;
            border-top: 2px solid #e2e8f0;
            padding-top: 16px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
            color: #475569;
        }
        .totals-row.grand-total {
            font-size: 18px;
            font-weight: 600;
            color: #0f172a;
            margin-top: 16px;
        }
        .btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 4px;
            font-weight: 500;
            font-size: 15px;
            margin-top: 16px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            background-color: #e0e7ff;
            color: #4338ca;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Auralis</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Auralis Audio. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

const generateOrderItemsHTML = (order) => {
    let itemsHTML = `
    <table class="order-table">
        <thead>
            <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
            </tr>
        </thead>
        <tbody>
    `;

    order.items.forEach(item => {
        itemsHTML += `
            <tr>
                <td>${item.productName}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.unitPrice, order.currency)}</td>
            </tr>
        `;
    });

    itemsHTML += `
        </tbody>
    </table>
    <div class="totals">
        <div style="display: table; width: 100%;">
            <div style="display: table-row;">
                <div style="display: table-cell; padding: 4px 0;">Subtotal</div>
                <div style="display: table-cell; text-align: right;">${formatCurrency(order.subtotal, order.currency)}</div>
            </div>
            <div style="display: table-row;">
                <div style="display: table-cell; padding: 4px 0;">Shipping</div>
                <div style="display: table-cell; text-align: right;">${formatCurrency(order.shippingCost, order.currency)}</div>
            </div>
            <div style="display: table-row;">
                <div style="display: table-cell; padding: 4px 0;">Tax</div>
                <div style="display: table-cell; text-align: right;">${formatCurrency(order.tax, order.currency)}</div>
            </div>
            <div style="display: table-row; font-weight: bold; font-size: 18px; padding-top: 12px;">
                <div style="display: table-cell; padding: 12px 0;">Total</div>
                <div style="display: table-cell; text-align: right;">${formatCurrency(order.total, order.currency)}</div>
            </div>
        </div>
    </div>
    `;

    return itemsHTML;
};

export const orderConfirmationTemplate = (order, user) => {
    const content = `
        <h2>Order Confirmation</h2>
        <p>Hi ${user.name},</p>
        <p>Thank you for your purchase from Auralis. Your payment has been verified and your order is now confirmed.</p>
        <p><span class="badge">Order #${order.orderNumber}</span></p>
        ${generateOrderItemsHTML(order)}
        <p>We'll send you another email as soon as your order ships.</p>
    `;
    return baseTemplate('Order Confirmation - Auralis', content);
};

export const orderStatusTemplate = (order, user, statusText, customMessage) => {
    const content = `
        <h2>Order Update: ${statusText}</h2>
        <p>Hi ${user.name},</p>
        <p>${customMessage}</p>
        <p><span class="badge">Order #${order.orderNumber}</span></p>
        ${generateOrderItemsHTML(order)}
    `;
    return baseTemplate(`Order ${statusText} - Auralis`, content);
};

export const paymentFailedTemplate = (order, user) => {
    const content = `
        <h2>Payment Failed</h2>
        <p>Hi ${user.name},</p>
        <p>We encountered an issue verifying your payment for Order #${order.orderNumber}. Your account has not been charged, and the order is currently on hold.</p>
        <p>Please return to the store to complete your purchase using a different payment method or try again.</p>
        ${generateOrderItemsHTML(order)}
    `;
    return baseTemplate('Payment Failed - Auralis', content);
};

export const inventoryAlertTemplate = (product, triggerType) => {
    const content = `
        <h2>Admin Alert: Inventory Issue</h2>
        <p>Automated inventory notification for <strong>${product.name}</strong> (SKU: ${product.sku}).</p>
        <table class="order-table">
            <tr>
                <td><strong>Event Type</strong></td>
                <td>${triggerType === 'out_of_stock' ? 'Out of Stock' : 'Low Stock Warning'}</td>
            </tr>
            <tr>
                <td><strong>Current Stock</strong></td>
                <td style="color: ${triggerType === 'out_of_stock' ? '#ef4444' : '#f59e0b'}; font-weight: bold;">${product.stockQuantity}</td>
            </tr>
        </table>
        <p>Please review your inventory management dashboard to restock this item.</p>
    `;
    return baseTemplate('Inventory Alert - Auralis', content);
};
