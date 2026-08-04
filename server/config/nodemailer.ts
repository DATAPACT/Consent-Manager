import * as nodemailer from "nodemailer"

export const transporter = await createTransporter();

export async function createTransporter(){
    if (process.env.BREVO_SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.BREVO_SMTP_HOST,
            port: Number(process.env.BREVO_SMTP_PORT ?? 587),
            secure: false,
            auth: {
                user: process.env.BREVO_SMTP_USER,
                pass: process.env.BREVO_SMTP_PASSWORD,
            }
        });
    }
    else{
        const testAccount = await nodemailer.createTestAccount();

        return nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        }); 
    }
}

export const sendTestEmail = async (email_details: any) => {

    const info = await transporter.sendMail(email_details);
    console.log(`This is our transporter: ${transporter}`);


    if (info.accepted) {
        console.log("Email sent successfully. Preview URL:",nodemailer.getTestMessageUrl(info));
        return {url: nodemailer.getTestMessageUrl(info), success: true};
      }
    else{
        console.error("Error sending email");
        return {
            error: "Failed to send email",
            success: false,
        };
    }
}