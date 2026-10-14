const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const siteDirectory = path.join(__dirname, "..");
const publicPages = new Set([
    "saloon web.html",
    "about.html",
    "services.html",
    "contact.html",
    "booking.html"
]);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(siteDirectory, "saloon web.html"));
});

app.get("/style.css", (req, res) => {
    res.sendFile(path.join(siteDirectory, "style.css"));
});

app.get("/script.js", (req, res) => {
    res.sendFile(path.join(siteDirectory, "script.js"));
});

app.use("/images", express.static(path.join(siteDirectory, "images")));

app.get("/:page", (req, res, next) => {
    if (!publicPages.has(req.params.page)) {
        return next();
    }

    res.sendFile(path.join(siteDirectory, req.params.page));
});

app.post("/book-appointment", async (req, res) => {
    const {
        customer_name,
        services,
        appointment_date,
        appointment_time,
        delivery_method,
        customer_email
    } = req.body;

    if (
        typeof customer_name !== "string" ||
        !customer_name.trim() ||
        !services ||
        !appointment_date ||
        !appointment_time ||
        !["whatsapp", "email"].includes(delivery_method)
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all appointment details and choose a delivery method."
        });
    }

    const selectedServices = Array.isArray(services)
        ? services
        : [services];

    if (selectedServices.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Please choose at least one service."
        });
    }

    if (
        delivery_method === "email" &&
        (
            typeof customer_email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email.trim())
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    console.log("New appointment received!");
    console.log("Customer:", customer_name.trim());
    console.log("Services:", selectedServices.join(", "));
    console.log("Date:", appointment_date);
    console.log("Time:", appointment_time);

    if (delivery_method === "email") {
        const apiKey = process.env.RESEND_API_KEY;
        const sender = process.env.RESEND_FROM_EMAIL;

        if (!apiKey || !sender) {
            console.error("Email booking notification is missing Resend configuration.");
            return res.status(503).json({
                success: false,
                message: "Email booking is temporarily unavailable. Please choose WhatsApp or try again later."
            });
        }

        const salonEmail = process.env.SALON_NOTIFICATION_EMAIL ||
            "linnetatieno3117@gmail.com";
        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: sender,
                to: [salonEmail],
                reply_to: customer_email.trim(),
                subject: "New Lynne Beauty Salon appointment request",
                text: [
                    "New appointment request for Lynne Beauty Salon",
                    `Name: ${customer_name.trim()}`,
                    `Customer email: ${customer_email.trim()}`,
                    `Services: ${selectedServices.join(", ")}`,
                    `Date: ${appointment_date}`,
                    `Time: ${appointment_time}`
                ].join("\n")
            })
        });

        if (!emailResponse.ok) {
            const providerError = await emailResponse.text();
            console.error("Resend email notification failed:", providerError);
            return res.status(502).json({
                success: false,
                message: "We couldn't send the email notification. Please choose WhatsApp or try again later."
            });
        }

        return res.json({
            success: true,
            message: "Your appointment details have been emailed to the salon."
        });
    }

    res.json({
        success: true,
        message: "Your appointment details have been received!"
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Salon website and backend running on port ${port}`);
});