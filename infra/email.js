import nodemailer from "nodemailer";
import { ServiceError } from "./errors";

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
    await transporter.sendMail(emailOptions);
  } catch (error) {
    throw new ServiceError({
      message: "Error when trying to send email",
      action: "Verify if email service is available",
      cause: err,
      context: emailOptions,
    });
  }
}

const email = {
  send,
};

export default email;
