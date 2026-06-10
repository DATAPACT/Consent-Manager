import * as nodemailer from "nodemailer"

const testAccount = await nodemailer.createTestAccount();

export const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    }); 

export const sendTestEmail = async (email_details: any) => {

    const info = await transporter.sendMail(email_details);

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