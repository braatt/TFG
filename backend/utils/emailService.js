const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async (to, subject, html) => {
  try {
    const msg = {
      to,
      from: 'flightnots@gmail.com',
      subject,
      html, 
    };

    console.log(`Enviando correo a: ${to}`);
    await sgMail.send(msg);
    console.log('Correo enviado con éxito');
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw error;
  }
};

module.exports = { sendMail };
