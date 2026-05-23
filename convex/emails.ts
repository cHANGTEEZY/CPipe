import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

const FROM_EMAIL = "admin@sushankgurung.com";

export const sendStatusEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    status: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not set. Email not sent.");
      return;
    }

    const resend = new Resend(resendApiKey);

    let subject = "";
    let html = "";

    if (args.status === "pending") {
      subject = "Your CPipe Tracker Account is under review";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${args.name},</h2>
          <p>Your account for CPipe Tracker has been created and is currently under review by our admin team.</p>
          <p>We will notify you once your account has been approved.</p>
          <br/>
          <p>Thanks,<br><strong>CPipe Tracker Team</strong></p>
        </div>
      `;
    } else if (args.status === "approved") {
      subject = "Your CPipe Tracker Account has been approved!";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${args.name},</h2>
          <p>Great news! Your account for CPipe Tracker has been approved.</p>
          <p>You can now log in and start using the application.</p>
          <br/>
          <p>Thanks,<br><strong>CPipe Tracker Team</strong></p>
        </div>
      `;
    } else if (args.status === "rejected") {
      subject = "Update regarding your CPipe Tracker Account";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${args.name},</h2>
          <p>We regret to inform you that your account application for CPipe Tracker was not approved.</p>
          ${args.reason ? `<p><strong>Reason:</strong> ${args.reason}</p>` : ""}
          <p>If you believe this is a mistake, please contact support.</p>
          <br/>
          <p>Thanks,<br><strong>CPipe Tracker Team</strong></p>
        </div>
      `;
    } else {
      // Don't send emails for other statuses right now (suspended/banned) unless needed
      return;
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.email,
        subject,
        html,
      });
      console.log(`Sent ${args.status} email to ${args.email}`);
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  },
});

export const sendWorkspaceInviteEmail = internalAction({
  args: {
    email: v.string(),
    workspaceName: v.string(),
    role: v.string(),
    inviterName: v.string(),
    inviteUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not set. Invite email not sent.");
      return;
    }

    const resend = new Resend(resendApiKey);
    const roleLabel = args.role.charAt(0).toUpperCase() + args.role.slice(1);

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.email,
        subject: `You're invited to ${args.workspaceName} on CPipeLine`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited</h2>
            <p><strong>${args.inviterName}</strong> invited you to join <strong>${args.workspaceName}</strong> as <strong>${roleLabel}</strong>.</p>
            <p style="margin: 24px 0;">
              <a href="${args.inviteUrl}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Accept invitation
              </a>
            </p>
            <p style="font-size: 13px; color: #71717a;">Or copy this link: ${args.inviteUrl}</p>
            <p style="font-size: 13px; color: #71717a;">This link expires in 7 days. Sign in with <strong>${args.email}</strong> to accept.</p>
            <br/>
            <p>Thanks,<br><strong>CPipeLine Team</strong></p>
          </div>
        `,
      });
      console.log(`Sent workspace invite email to ${args.email}`);
    } catch (error) {
      console.error("Failed to send invite email:", error);
    }
  },
});

export const sendTaskAssignedEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    taskTitle: v.string(),
    projectName: v.string(),
    assignedBy: v.string(),
  },
  handler: async (_ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) return;
    const resend = new Resend(resendApiKey);

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.email,
        subject: `You've been assigned to a task: ${args.taskTitle}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${args.name},</h2>
            <p><strong>${args.assignedBy}</strong> has assigned you to a new task in <strong>${args.projectName}</strong>.</p>
            <div style="padding: 16px; background-color: #f4f4f5; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px 0;">${args.taskTitle}</h3>
            </div>
            <p>Log in to CPipe Tracker to view more details.</p>
            <br/>
            <p>Thanks,<br><strong>CPipe Tracker Team</strong></p>
          </div>
        `,
      });
      console.log(`Sent task assigned email to ${args.email}`);
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  },
});
