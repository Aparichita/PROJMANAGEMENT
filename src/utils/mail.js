import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail=async function (options) {
    const mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Task Manager",
        link: "https://TaskManager.com/",
      },
    });

    const emailHtml = mailGenerator.generate(options.mailGenContent);

    // Generate the plaintext version of the e-mail (for clients that do not support HTML)
    const emailTextual = mailGenerator.generatePlaintext(
      options.mailGenContent,
    );

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: process.env.MAILTRAP_SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });

    const mail = {
      from: "mail.taskmanager@example.com",
      to: options.email,
      subject: options.subject,
      text: emailTextual, // plain‑text body
      html: emailHtml, // HTML body
    };
    try {
      const result = await transporter.sendMail(mail);
    } catch (error) {
        console.error("You have given wrong MAILTRAP details");
        console.error("Error",error);

    }
    

}


const emailVerificationMailgenConst=(username,verificationUrl)=>{
    return{
    body: {
        name: username,
        intro: 'Welcome to My App. We\'re very excited to have you on board.',
        action: {
            instructions: 'To verify your email,please click on the following button',
            button: {
                color: '#22BC66', // Optional action button color
                text: 'Verify your email',
                link:verificationUrl,
            }
        },
        outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
    },
};
};

const forgotPasswordMailgenConst= (password, PasswordResetUrl) => {
  return {
    body: {
      name: password,
      intro: "We got a request to reset the password of your account",
      action: {
        instructions: "To reset your password click on the following button or link",
        button: {
          color: "#22BC66", // Optional action button color
          text: "Reset your password",
          link:
            PasswordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };

};

export {emailVerificationMailgenConst,forgotPasswordMailgenConst,sendEmail,};