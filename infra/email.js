import nodemailer from "nodemailer";
import { ServiceError } from "./errors";
import { Resend } from "resend";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production",
});

async function send(emailOptions) {
  try {
    if (process.env.NODE_ENV !== "production") {
      await transporter.sendMail(emailOptions);
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: emailOptions.to,
      subject: emailOptions.subject,
      text: emailOptions.text,
    });
  } catch (error) {
    throw new ServiceError({
      message: "Error when trying to send email",
      action: "Verify if email service is available",
      cause: error,
      context: emailOptions,
    });
  }
}

const email = {
  send,
};

export default email;
