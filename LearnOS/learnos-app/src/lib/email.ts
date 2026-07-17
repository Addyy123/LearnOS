export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`

  if (!process.env.RESEND_API_KEY) {
    console.log("----------------------------------------")
    console.log("📧 MOCK EMAIL SENT")
    console.log(`To: ${email}`)
    console.log(`Subject: Verify your email for LearnOS`)
    console.log(`Link: ${verifyUrl}`)
    console.log("----------------------------------------")
    return
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "LearnOS <onboarding@resend.dev>",
        to: email,
        subject: "Verify your email for LearnOS",
        html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
      }),
    })

    if (!res.ok) {
      console.error("Failed to send email via Resend:", await res.text())
    }
  } catch (err) {
    console.error("Error sending email", err)
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`

  if (!process.env.RESEND_API_KEY) {
    console.log("----------------------------------------")
    console.log("📧 MOCK EMAIL SENT")
    console.log(`To: ${email}`)
    console.log(`Subject: Reset your password for LearnOS`)
    console.log(`Link: ${resetUrl}`)
    console.log("----------------------------------------")
    return
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "LearnOS <onboarding@resend.dev>",
        to: email,
        subject: "Reset your password for LearnOS",
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
      }),
    })

    if (!res.ok) {
      console.error("Failed to send reset email via Resend:", await res.text())
    }
  } catch (err) {
    console.error("Error sending reset email", err)
  }
}
