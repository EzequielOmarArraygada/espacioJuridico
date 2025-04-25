import config from '../config/config.js';
import nodemailer from 'nodemailer';
import { formatDate} from '../utils/utils.js'

const transporter = nodemailer.createTransport({
    service: config.mailing.SERVICE,
    auth: {
        lawer: config.mailing.lawer,
        pass: config.mailing.PASSWORD
    }
});

export function sendPasswordResetEmail(email, token) {
    const resetLink = `http://ymir.up.railway.app/api/sessions/reset-password?token=${token}`;
    const mailOptions = {
        from: `"🛡️ Ymir Store" <${process.env.EMAIL_lawer}>`,
        to: email,
        subject: '🛡️ Restablece tu contraseña',
        html: `
        <div style="font-family: 'Arial', sans-serif; background-color: #E7E2D1; padding: 20px; color: #5B1F0F;">
            <div style="max-width: 600px; margin: auto; background-color: #C2B7A0; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); padding: 30px;">
                <div style="text-align: center;">
                    <img src="https://res.cloudinary.com/dsvo0wjue/image/upload/v1744145650/banner2_gm9jzu.jpg" alt="Banner medieval" style="width: 100%; border-radius: 8px;" />
                    <h2 style="margin-top: 20px;">¿Olvidaste tu contraseña?</h2>
                    <p>No te preocupes, puedes restablecerla haciendo clic en el siguiente botón:</p>
                    <a href="${resetLink}" style="display: inline-block; margin-top: 20px; background-color: #5B1F0F; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none;">Restablecer contraseña</a>
                </div>
                <p style="margin-top: 30px;">⚔️ Este enlace expirará en unos minutos. Si no solicitaste este cambio, ignora este mensaje.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <img src="https://res.cloudinary.com/dsvo0wjue/image/upload/v1744145651/logoMail_bkhkmd.png" alt="Logo medieval" width="120" />
                </div>
            </div>
        </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error al enviar correo de restablecimiento:', error);
        } else {
            console.log('Correo de restablecimiento enviado:', info.response);
        }
    });
}

export function sendCompraAprobada(email, ticket) {
    const metodoPago = {
        credit_card: 'Tarjeta de crédito',
        debit_card: 'Tarjeta de débito',
        account_money: 'Dinero en cuenta de MercadoPago',
        ticket: 'Pago en efectivo',
        bank_transfer: 'Transferencia bancaria',
    };
    const mailOptions = {
        from: `"🛡️ Ymir Store" <${process.env.EMAIL_lawer}>`,
        to: email,
        subject: '🛡️ ¡Compra Aprobada! Gracias por confiar en nosotros',
        html: `
        <div style="font-family: 'Arial', sans-serif; background-color: #E7E2D1; padding: 20px; color: #5B1F0F;">
            <div style="max-width: 700px; margin: auto; background-color: #C2B7A0; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); padding: 30px;">
            <div style="text-align: center; margin-top: 30px;">
                <img src="https://res.cloudinary.com/dsvo0wjue/image/upload/v1744145650/banner2_gm9jzu.jpg" alt="Banner" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px;" />
            </div>
                <h1 style="text-align: center; color: #5B1F0F;">¡${ticket.purchaser.first_name}, gracias por tu compra!</h1>
              
                <p>Hemos recibido y aprobado tu pedido con el código <strong>${ticket.code}</strong> el <strong>${formatDate(ticket.purchase_datetime)}</strong>.</p>

                <h2>🧍 Tus datos:</h2>
                <ul>
                    <li><strong>Nombre:</strong> ${ticket.purchaser.first_name} ${ticket.purchaser.last_name}</li>
                    <li><strong>Email:</strong> ${ticket.purchaser.email}</li>
                </ul>

                <h2>🛒 Productos:</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #8B5B29; color: white;">
                            <th style="padding: 10px; border: 1px solid #ddd;">Producto</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Precio</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Cantidad</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ticket.products.map(p => `
                            <tr style="background-color: #E7E2D1;">
                                <td style="padding: 10px; border: 1px solid #ddd;">${p.title}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">$${p.price}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${p.quantity}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">$${p.price * p.quantity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2 style="text-align: right;">💰 Total: $${ticket.totalAmount.toFixed(2)}</h2>

                <h2>💳 Detalles del intento de pago:</h2>
            <ul>
                <li><strong>Método:</strong> ${metodoPago[ticket.paymentInf?.method] || 'Desconocido'}</li>
                ${ticket.paymentInf?.card?.lastFourDigits
                    ? `<li><strong>Tarjeta:</strong> ${ticket.paymentInf.card.issuerName} terminada en ${ticket.paymentInf.card.lastFourDigits}</li>`
                    : ''
                }
                ${ticket.paymentInf?.card?.installments
                    ? `<li><strong>Cuotas:</strong> ${ticket.paymentInf.card.installments}</li>`
                    : ''
                }
                ${ticket.paymentInf?.paymentDate
                    ? `<li><strong>Fecha:</strong> ${formatDate(ticket.purchase_datetime)}</li>`
                    : ''
                }
            </ul>

                <p style="margin-top: 20px;">⚔️ Gracias por confiar en nuestro comercio medieval. ¡Esperamos volver a verte pronto!</p>
                <div style="text-align: center; margin-top: 30px;">
                    <img src="https://res.cloudinary.com/dsvo0wjue/image/upload/v1744145651/logoMail_bkhkmd.png" alt="Logo medieval" width="150" />
                </div>
            </div>
        </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error al enviar correo de compra aprobada:', error);
        } else {
            console.log('Correo de compra aprobada enviado:', info.response);
        }
    });
}


export function sendCompraPendiente(email, ticket) {
    const metodoPago = {
        credit_card: 'Tarjeta de crédito',
        debit_card: 'Tarjeta de débito',
        account_money: 'Dinero en cuenta de MercadoPago',
        ticket: 'Pago en efectivo',
        bank_transfer: 'Transferencia bancaria',
    };
    const mailOptions = {
        from: `"🛡️ Ymir Store" <${process.env.EMAIL_lawer}>`,
        to: email,
        subject: '🛡️ ¡Falta un poco más! Tu pago esta pendiente',
        html: `
        <div style="font-family: 'Arial', sans-serif; background-color: #E7E2D1; padding: 20px; color: #5B1F0F;">
            <div style="max-width: 700px; margin: auto; background-color: #C2B7A0; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); padding: 30px;">
            <div style="text-align: center; margin-top: 30px;">
                <img src="https://res.cloudinary.com/dsvo0wjue/image/upload/v1744145650/banner2_gm9jzu.jpg" alt="Banner" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px;" />
            </div>
                <h1 style="text-align: center; color: #5B1F0F;">¡${ticket.purchaser.first_name}, gracias por tu compra!</h1>
              
                <p>Hemos recibido tu pedido co el coodigo <strong>${ticket.code}, el pago esta pendiente.</strong></p>
                
                <p><strong>Cuando se termine de procesar el pago recibiras una notificación por correo</strong></p>

                <h2>🧍 Tus datos:</h2>
                <ul>
                    <li><strong>Nombre:</strong> ${ticket.purchaser.first_name} ${ticket.purchaser.last_name}</li>
                    <li><strong>Email:</strong> ${ticket.purchaser.email}</li>
                </ul>

                <h2>🛒 Productos:</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #8B5B29; color: white;">
                            <th style="padding: 10px; border: 1px solid #ddd;">Producto</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Precio</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Cantidad</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ticket.products.map(p => `
                            <tr style="background-color: #E7E2D1;">
                                <td style="padding: 10px; border: 1px solid #ddd;">${p.title}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">$${p.price}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${p.quantity}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">$${p.price * p.quantity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2 style="text-align: right;">💰 Total: $${ticket.totalAmount.toFixed(2)}</h2>

                 <h2>💳 Detalles del intento de pago:</h2>
            <ul>
                <li><strong>Método:</strong> ${metodoPago[ticket.paymentInf?.method] || 'Desconocido'}</li>
                ${ticket.paymentInf?.card?.lastFourDigits
                    ? `<li><strong>Tarjeta:</strong> ${ticket.paymentInf.card.issuerName} terminada en ${ticket.paymentInf.card.lastFourDigits}</li>`
                    : ''
                }
                ${ticket.paymentInf?.card?.installments
                    ? `<li><strong>Cuotas:</strong> ${ticket.paymentInf.card.installments}</li>`
                    : ''
                }
                ${ticket.paymentInf?.paymentDate
                    ? `<li><strong>Fecha:</strong> ${formatDate(ticket.purchase_datetime)}</li>`
                    : ''
                }
            </ul>

                <p style="margin-top: 20px;">⚔️ Gracias por confiar en nuestro comercio medieval.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <img src="https://res.cloudinary.com/dsvo0wjue/image/upload/v1744145651/logoMail_bkhkmd.png" alt="Logo medieval" width="150" />
                </div>
            </div>
        </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error al enviar correo de compra aprobada:', error);
        } else {
            console.log('Correo de compra pendiente enviado:', info.response);
        }
    });
}

export function sendCompraCancelada(email, ticket) {
    const metodoPago = {
        credit_card: 'Tarjeta de crédito',
        debit_card: 'Tarjeta de débito',
        account_money: 'Dinero en cuenta de MercadoPago',
        ticket: 'Pago en efectivo',
        bank_transfer: 'Transferencia bancaria',
    };
    const mailOptions = {
        from: `"🛡️ Ymir Store" <${process.env.EMAIL_lawer}>`,
        to: email,
        subject: '🛡️ Tu pago fue rechazado ❌',
        html: `
        <div style="font-family: 'Arial', sans-serif; background-color: #E7E2D1; padding: 20px; color: #5B1F0F;">
            <div style="max-width: 700px; margin: auto; background-color: #C2B7A0; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); padding: 30px;">
                <div style="text-align: center; margin-top: 30px;">
                    <img src="https://res.cloudinary.com/dsvo0wjue/image/upload/v1744145650/banner2_gm9jzu.jpg" alt="Banner" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px;" />
                </div>

                <h1 style="text-align: center; color: #5B1F0F;">${ticket.purchaser.first_name}, tu pago fue rechazado.</h1>
                <p>Tuvimos un problema al recibir el pago del pedido <strong>${ticket.code}</strong>.</p>
                <p>Por favor intenta comprar nuevamente.</p>

                <p>Te dejamos a continuación de todas maneras los datos de tu pedido:</p>

                <h2>🧍 Tus datos:</h2>
                <ul>
                    <li><strong>Nombre:</strong> ${ticket.purchaser.first_name} ${ticket.purchaser.last_name}</li>
                    <li><strong>Email:</strong> ${ticket.purchaser.email}</li>
                </ul>

                <h2>🛒 Productos:</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #8B5B29; color: white;">
                            <th style="padding: 10px; border: 1px solid #ddd;">Producto</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Precio</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Cantidad</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ticket.products.map(p => `
                            <tr style="background-color: #E7E2D1;">
                                <td style="padding: 10px; border: 1px solid #ddd;">${p.title}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">$${p.price}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${p.quantity}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">$${p.price * p.quantity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2 style="text-align: right;">💰 Total: $${ticket.totalAmount.toFixed(2)}</h2>

               <h2>💳 Detalles del intento de pago:</h2>
            <ul>
                <li><strong>Método:</strong> ${metodoPago[ticket.paymentInf?.method] || 'Desconocido'}</li>
                ${ticket.paymentInf?.card?.lastFourDigits
                    ? `<li><strong>Tarjeta:</strong> ${ticket.paymentInf.card.issuerName} terminada en ${ticket.paymentInf.card.lastFourDigits}</li>`
                    : ''
                }
                ${ticket.paymentInf?.card?.installments
                    ? `<li><strong>Cuotas:</strong> ${ticket.paymentInf.card.installments}</li>`
                    : ''
                }
                ${ticket.paymentInf?.paymentDate
                    ? `<li><strong>Fecha:</strong> ${formatDate(ticket.purchase_datetime)}</li>`
                    : ''
                }
            </ul>

                <p style="margin-top: 20px;">⚔️ Gracias por confiar en nuestro comercio medieval.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <img src="https://res.cloudinary.com/dsvo0wjue/image/upload/v1744145651/logoMail_bkhkmd.png" alt="Logo medieval" width="150" />
                </div>
            </div>
        </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error al enviar correo de compra cancelada:', error);
        } else {
            console.log('Correo de compra cancelada enviado:', info.response);
        }
    });
}

export function sendEmail({ to, subject, html }) {
    const mailOptions = {
        from: `"🛡️ Ymir Store" <${process.env.EMAIL_lawer}>`,
        to,
        subject,
        html
    };

    try {
        const info = transporter.sendMail(mailOptions);
        console.log('Correo enviado:', info.response);
        return info;
    } catch (error) {
        console.error('Error al enviar correo:', error);
        throw error;
    }
}