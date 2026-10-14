const appointmentForm = document.getElementById("appointment");
const now = new Date();
const minimumBookingDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
].join("-");

document.querySelectorAll(".service-video-section video").forEach(function(video) {
    const videoEndSeconds = 79;

    function stopAtVideoEnd() {
        if (video.currentTime >= videoEndSeconds) {
            video.currentTime = videoEndSeconds;
            video.pause();
        }
    }

    video.addEventListener("timeupdate", stopAtVideoEnd);
    video.addEventListener("seeking", stopAtVideoEnd);
});

if (appointmentForm) {
    const dateInput = document.getElementById("appointment_date");
    const emailField = document.getElementById("customerEmailField");
    const emailInput = document.getElementById("customer_email");

    if (dateInput) {
        dateInput.min = minimumBookingDate;
    }

    appointmentForm.querySelectorAll('input[name="delivery_method"]').forEach(function(input) {
        input.addEventListener("change", function() {
            const emailSelected = input.value === "email" && input.checked;
            emailField.hidden = !emailSelected;
            emailInput.required = emailSelected;
        });
    });

    appointmentForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("customer_name").value.trim();
        const deliveryMethodInput = appointmentForm.querySelector(
            'input[name="delivery_method"]:checked'
        );
        const deliveryMethod = deliveryMethodInput ? deliveryMethodInput.value : "";
        const customerEmail = emailInput.value.trim();
        const services = Array.from(
            appointmentForm.querySelectorAll('input[name="services"]:checked')
        ).map(function(input) {
            return input.value;
        });
        const date = document.getElementById("appointment_date").value;
        const time = document.getElementById("appointment_time").value;
        const message = document.getElementById("bookingMessage");

        if (name === "" || services.length === 0 || date === "" || time === "") {
            message.textContent = "Please fill in your name, choose at least one service, and select a date and time.";
            return;
        }

        if (deliveryMethod === "") {
            message.textContent = "Please choose whether to send your appointment by WhatsApp or email.";
            return;
        }

        if (deliveryMethod === "email" && !emailInput.validity.valid) {
            message.textContent = "Please enter a valid email address.";
            return;
        }

        if (date < minimumBookingDate) {
            message.textContent = "Please choose a date that is today or later.";
            return;
        }

        if (time < "06:00" || time > "17:00") {
            message.textContent = "Please choose a time between 6 AM and 5 PM.";
            return;
        }

        const whatsappWindow = deliveryMethod === "whatsapp"
            ? window.open("about:blank", "_blank")
            : null;
        message.textContent = "Sending your appointment...";

        fetch("/book-appointment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customer_name: name,
                services: services,
                appointment_date: date,
                appointment_time: time,
                delivery_method: deliveryMethod,
                customer_email: deliveryMethod === "email" ? customerEmail : ""
            })
        })
            .then(function(response) {
                return response.json().then(function(data) {
                    if (!response.ok) {
                        throw new Error(data.message || "Booking failed.");
                    }
                    return data;
                });
            })
            .then(function(data) {
                message.textContent = "Thank you, " + name + "! " + data.message;

                if (deliveryMethod === "whatsapp") {
                    const whatsappMessage = [
                        "New appointment request for Lynne Beauty Salon",
                        "Name: " + name,
                        "Services: " + services.join(", "),
                        "Date: " + date,
                        "Time: " + time
                    ].join("\n");
                    const whatsappUrl =
                        "https://wa.me/254718790166?text=" +
                        encodeURIComponent(whatsappMessage);

                    if (whatsappWindow) {
                        whatsappWindow.location.href = whatsappUrl;
                        message.textContent +=
                            " WhatsApp is open with your booking details; review them and tap Send to notify the salon.";
                    } else {
                        const whatsappLink = document.createElement("a");
                        whatsappLink.href = whatsappUrl;
                        whatsappLink.target = "_blank";
                        whatsappLink.rel = "noopener noreferrer";
                        whatsappLink.textContent = "Open WhatsApp to notify the salon";
                        message.append(" ", whatsappLink);
                    }
                }

                console.log("Booking response:", data);
            })
            .catch(function(error) {
                if (whatsappWindow) {
                    whatsappWindow.close();
                }

                message.textContent = error.message ||
                    "We couldn't send your booking. Please try again.";

                console.error("Booking error:", error);
            });

    });
}
